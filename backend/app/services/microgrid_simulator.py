"""
microgrid_simulator.py
=======================
基于 PyPSA 的离网微电网仿真与优化核心模块。

功能：
- 建立 光伏 + 储能 + 柴油发电机 的离网微电网模型
- 进行全年8760小时能量仿真
- 优化电池容量（给定光伏容量）
- 验证阴天自主供电天数
- 输出运行统计结果
"""

from __future__ import annotations

import warnings
import numpy as np
import pandas as pd
import pypsa

warnings.filterwarnings("ignore")


# ─────────────────────────────────────────────────────────────
# 1. 光伏出力模拟（不使用 atlite 时的简化模型）
# ─────────────────────────────────────────────────────────────

def generate_pv_profile(
    latitude: float = 35.0,
    year: int = 2020,
    panel_capacity_kw: float = 1.0,
) -> pd.Series:
    """
    生成简化的光伏出力时序（0~1 标幺值）。

    实际项目中建议替换为 atlite 从 ERA5 获取的真实数据。

    Parameters
    ----------
    latitude : float
        安装地点纬度（°N），影响太阳高度角
    year : int
        模拟年份
    panel_capacity_kw : float
        光伏板额定功率（kW），用于归一化
    Returns
    -------
    pd.Series
        逐小时容量因子（0~1），索引为 DatetimeIndex
    """
    snapshots = pd.date_range(f"{year}-01-01", periods=8760, freq="h")
    hours = np.arange(8760)

    # 季节变化（日长差异）
    day_of_year = snapshots.day_of_year.values
    solar_declination = 23.45 * np.sin(np.radians(360 / 365 * (day_of_year - 81)))
    max_sun_hours = np.clip(
        2 / 15 * np.degrees(
            np.arccos(-np.tan(np.radians(latitude)) * np.tan(np.radians(solar_declination)))
        ),
        0, 24
    )

    # 日内变化（正弦曲线）
    hour_of_day = hours % 24
    sunrise = 12 - max_sun_hours / 2
    sunset = 12 + max_sun_hours / 2

    cf = np.zeros(8760)
    for i in range(8760):
        h = hour_of_day[i]
        if sunrise[i] < h < sunset[i]:
            # 太阳高度角的正弦近似
            angle = np.pi * (h - sunrise[i]) / (sunset[i] - sunrise[i])
            cf[i] = max(0, np.sin(angle) ** 1.2)

    # ── 云层遮挡（块状连续阴天模型，更贴近真实气象）──────────
    # 使用"连续阴天事件"代替随机单小时，驱动电池耗尽并启动柴油机
    # （随机单小时云遮不会耗尽电池，与 HOMER Pro ERA5 气象差异极大）
    np.random.seed(42)
    cloud_factor = np.ones(8760)

    # 1. 多日连阴事件（每次持续 2~7 天，发生概率约 18%/天）
    h = 0
    while h < 8760:
        if np.random.random() < 0.18:                   # 开始一次连阴事件
            dur    = int(np.random.uniform(2, 7) * 24)  # 持续 2~7 天
            end    = min(h + dur, 8760)
            intens = np.random.uniform(0.05, 0.45)       # 透过率 5%~45%
            cloud_factor[h:end] = intens
            h = end + int(np.random.uniform(5, 15) * 24)# 两次事件间隔 5~15 天
        else:
            h += 24                                      # 晴天推进一天

    # 2. 散状单日轻度遮挡（额外 10% 的天数有局部云遮）
    partial_days = np.random.choice(365, size=int(365 * 0.10), replace=False)
    for day in partial_days:
        s, e = day * 24, min((day + 1) * 24, 8760)
        cloud_factor[s:e] = np.where(
            cloud_factor[s:e] == 1.0,
            np.random.uniform(0.4, 0.8),
            cloud_factor[s:e]
        )

    cf = cf * cloud_factor

    return pd.Series(cf, index=snapshots, name="pv_cf")


def generate_load_profile(
    annual_consumption_kwh: float,
    load_type: str = "residential",
    year: int = 2020,
) -> pd.Series:
    """
    生成负载时序（kW）。

    Parameters
    ----------
    annual_consumption_kwh : float
        年总用电量（kWh）
    load_type : str
        负载类型：'residential'（住宅）| 'commercial'（商业）| 'industrial'（工业）
    year : int
        模拟年份
    Returns
    -------
    pd.Series
        逐小时负载功率（kW），索引为 DatetimeIndex
    """
    snapshots = pd.date_range(f"{year}-01-01", periods=8760, freq="h")
    hour_of_day = np.arange(8760) % 24
    day_of_year = snapshots.day_of_year.values

    if load_type == "residential":
        # 住宅：早晚高峰
        base = np.ones(8760)
        morning_peak = np.exp(-0.5 * ((hour_of_day - 8) / 1.5) ** 2)
        evening_peak = np.exp(-0.5 * ((hour_of_day - 19) / 2.0) ** 2)
        daily_pattern = base * 0.3 + morning_peak * 0.7 + evening_peak * 1.0
    elif load_type == "commercial":
        # 商业：白天平稳
        daily_pattern = np.where(
            (hour_of_day >= 8) & (hour_of_day <= 20),
            1.0 + 0.3 * np.sin(np.pi * (hour_of_day - 8) / 12),
            0.15,
        ).astype(float)
    else:
        # 工业：24小时近似均匀
        daily_pattern = np.ones(8760) * 0.85 + 0.15 * np.random.rand(8760)

    # 季节变化（夏季和冬季用电多）
    seasonal = 1.0 + 0.2 * np.cos(2 * np.pi * (day_of_year - 180) / 365)
    load_pattern = daily_pattern * seasonal

    # 归一化到年用电量
    avg_kw = annual_consumption_kwh / 8760
    load_kw = load_pattern / load_pattern.mean() * avg_kw

    return pd.Series(load_kw, index=snapshots, name="load_kw")


# ─────────────────────────────────────────────────────────────
# 2. PyPSA 离网微电网建模与仿真
# ─────────────────────────────────────────────────────────────

class OffGridMicrogridSimulator:
    """
    基于 PyPSA 的离网微电网仿真器。

    系统架构：
    ┌──────────┐    ┌────────────┐    ┌──────────────┐
    │  光伏阵列  │───▶│            │◀──▶│  电池储能     │
    └──────────┘    │  直流/交流  │    └──────────────┘
    ┌──────────┐    │   母线     │    ┌──────────────┐
    │柴油发电机 │───▶│            │───▶│    负载       │
    └──────────┘    └────────────┘    └──────────────┘
    """

    def __init__(
        self,
        pv_capacity_kw: float,
        battery_capacity_kwh: float,
        battery_power_kw: float,
        diesel_capacity_kw: float,
        load_profile: pd.Series,
        pv_profile: pd.Series,
        battery_efficiency: float = 0.95,
        diesel_fuel_cost: float = 1.5,     # 元/kWh（折算为电能）
        verbose: bool = False,
    ):
        """
        Parameters
        ----------
        pv_capacity_kw : float
            光伏装机容量（kW）
        battery_capacity_kwh : float
            电池能量容量（kWh）
        battery_power_kw : float
            电池额定充放电功率（kW）
        diesel_capacity_kw : float
            柴油发电机额定功率（kW），0 表示无柴油发电机
        load_profile : pd.Series
            逐小时负载功率（kW），索引为 DatetimeIndex
        pv_profile : pd.Series
            逐小时光伏容量因子（0~1），索引为 DatetimeIndex
        battery_efficiency : float
            电池充放电效率（单向）
        diesel_fuel_cost : float
            柴油发电成本（元/kWh）
        verbose : bool
            是否打印构建日志
        """
        self.pv_capacity_kw = pv_capacity_kw
        self.battery_capacity_kwh = battery_capacity_kwh
        self.battery_power_kw = battery_power_kw
        self.diesel_capacity_kw = diesel_capacity_kw
        self.load_profile = load_profile
        self.pv_profile = pv_profile
        self.battery_efficiency = battery_efficiency
        self.diesel_fuel_cost = diesel_fuel_cost
        self.verbose = verbose

        self.network: pypsa.Network | None = None
        self.results: dict = {}

    def build_network(self) -> pypsa.Network:
        """构建 PyPSA 离网微电网模型。"""
        n = pypsa.Network()
        snapshots = self.load_profile.index
        n.set_snapshots(snapshots)

        # ── 能源载体 ──────────────────────────────
        n.add("Carrier", "AC", co2_emissions=0)
        n.add("Carrier", "solar", co2_emissions=0)
        n.add("Carrier", "battery", co2_emissions=0)
        n.add("Carrier", "diesel", co2_emissions=2.68)  # kgCO₂/L ≈ kgCO₂/kWh

        # ── 主母线（交流） ─────────────────────────
        n.add("Bus", "AC_bus", carrier="AC", v_nom=0.4)  # 400V 低压

        # ── 光伏发电机 ─────────────────────────────
        n.add(
            "Generator", "PV",
            bus="AC_bus",
            carrier="solar",
            p_nom=self.pv_capacity_kw,
            p_max_pu=self.pv_profile,
            p_min_pu=0,
            marginal_cost=0,
            capital_cost=0,  # 容量已固定，不参与容量扩展
        )

        # ── 电池储能 ───────────────────────────────
        max_hours = self.battery_capacity_kwh / max(self.battery_power_kw, 1e-6)
        n.add(
            "StorageUnit", "Battery",
            bus="AC_bus",
            carrier="battery",
            p_nom=self.battery_power_kw,
            max_hours=max_hours,
            efficiency_store=self.battery_efficiency,
            efficiency_dispatch=self.battery_efficiency,
            cyclic_state_of_charge=True,
            state_of_charge_initial=self.battery_capacity_kwh * 0.5,
            capital_cost=0,
        )

        # ── 柴油发电机（可选） ─────────────────────
        if self.diesel_capacity_kw > 0:
            n.add(
                "Generator", "Diesel",
                bus="AC_bus",
                carrier="diesel",
                p_nom=self.diesel_capacity_kw,
                p_min_pu=0.0,   # LP 优化中设为 0，允许柴油机完全关停（近似 HOMER Pro 调度）
                # 注：实际柴油机有 30% 最小出力约束，但 LP 无法模拟开/关状态（需 MILP）。
                # 设为 0 使 PyPSA 可将柴油机调度为 0（近似"关机"），太阳能占比更贴近 HOMER Pro。
                marginal_cost=self.diesel_fuel_cost,
                capital_cost=0,
            )

        # ── 负载（用电需求） ───────────────────────
        n.add("Load", "Load", bus="AC_bus", p_set=self.load_profile)

        # ── 虚拟弃光（允许弃光，避免模型不可行） ────
        n.add(
            "Generator", "Curtailment",
            bus="AC_bus",
            carrier="AC",
            p_nom=self.pv_capacity_kw * 2,
            p_min_pu=-1,  # 可以"消耗"多余电量（模拟弃光）
            p_max_pu=0,   # 不能主动发电
            marginal_cost=-0.001,  # 轻微负成本，优先弃光
        )

        # ── 失负荷虚拟发电机（高成本，保证模型可行性） ─
        n.add(
            "Generator", "LoadShedding",
            bus="AC_bus",
            carrier="AC",
            p_nom=self.load_profile.max() * 1.5,
            marginal_cost=999,  # 极高成本
            capital_cost=0,
        )

        self.network = n
        if self.verbose:
            print(n)
        return n

    def run_simulation(self, solver_name: str = "highs") -> dict:
        """
        运行能量仿真（最小化运行成本的经济调度）。

        Returns
        -------
        dict
            仿真结果字典，包含能量统计、缺电量、弃光量等
        """
        if self.network is None:
            self.build_network()

        n = self.network

        # 运行优化（经济调度）
        status = n.optimize(solver_name=solver_name, solver_options={"output_flag": False})

        if "optimal" not in str(status).lower() and status is not True:
            print(f"⚠ 求解状态: {status}，结果可能不准确")

        # ── 提取关键结果 ──────────────────────────
        pv_gen_kwh = n.generators_t.p["PV"].sum()
        load_kwh = n.loads_t.p["Load"].sum()
        load_shed_kwh = n.generators_t.p.get("LoadShedding", pd.Series(0)).sum()
        curtail_kwh = abs(n.generators_t.p.get("Curtailment", pd.Series(0)).clip(upper=0).sum())

        diesel_kwh = 0.0
        diesel_hours = 0
        if self.diesel_capacity_kw > 0 and "Diesel" in n.generators_t.p.columns:
            diesel_series = n.generators_t.p["Diesel"]
            diesel_kwh = diesel_series.sum()
            diesel_hours = (diesel_series > 0.01).sum()

        battery_charge_kwh = n.storage_units_t.p_store["Battery"].sum()
        battery_discharge_kwh = n.storage_units_t.p_dispatch["Battery"].sum()
        soc_series = n.storage_units_t.state_of_charge["Battery"]

        # ── 关键指标计算 ──────────────────────────
        solar_fraction = pv_gen_kwh / max(load_kwh, 1e-6)
        loss_of_load = load_shed_kwh / max(load_kwh, 1e-6)   # 失负荷率
        curtailment_rate = curtail_kwh / max(pv_gen_kwh, 1e-6)  # 弃光率

        # 连续失负荷天数分析（模拟阴天持续情景）
        hourly_deficit = n.generators_t.p.get("LoadShedding", pd.Series(0, index=n.snapshots))
        daily_deficit = hourly_deficit.resample("D").sum()
        max_continuous_deficit_days = self._max_continuous_deficit_days(daily_deficit)

        self.results = {
            # 能量统计（kWh/年）
            "annual_pv_generation_kwh": round(pv_gen_kwh, 1),
            "annual_load_kwh": round(load_kwh, 1),
            "annual_load_shed_kwh": round(load_shed_kwh, 1),
            "annual_curtailment_kwh": round(curtail_kwh, 1),
            "annual_diesel_kwh": round(diesel_kwh, 1),
            "annual_battery_charge_kwh": round(battery_charge_kwh, 1),
            "annual_battery_discharge_kwh": round(battery_discharge_kwh, 1),

            # 关键指标
            "solar_fraction": round(solar_fraction * 100, 1),       # 太阳能占比 %
            "loss_of_load_rate": round(loss_of_load * 100, 3),      # 失负荷率 %
            "curtailment_rate": round(curtailment_rate * 100, 1),   # 弃光率 %
            "diesel_run_hours": diesel_hours,                        # 年柴油机运行小时数

            # 自主性分析
            "max_autonomous_days": max_continuous_deficit_days,      # 可自主供电的最长连续天数
            "battery_avg_soc": round(soc_series.mean(), 1),          # 平均荷电状态（kWh）
            "battery_min_soc": round(soc_series.min(), 1),

            # 时序数据（用于后续分析）
            "_soc_series": soc_series,
            "_load_shed_series": hourly_deficit,
            "_pv_series": n.generators_t.p["PV"],
            "_diesel_series": n.generators_t.p.get("Diesel", pd.Series(0, index=n.snapshots)),
        }

        return self.results

    @staticmethod
    def _max_continuous_deficit_days(daily_deficit: pd.Series) -> int:
        """计算系统能连续无缺电运行的最长天数（用于验证自主性）。"""
        # 找出连续的"无缺电"天数序列
        no_deficit = (daily_deficit < 0.01).astype(int)
        max_streak = 0
        current_streak = 0
        for v in no_deficit:
            if v:
                current_streak += 1
                max_streak = max(max_streak, current_streak)
            else:
                current_streak = 0
        return max_streak


class MicrogridOptimizer:
    """
    优化离网微电网中电池容量（在给定光伏容量条件下）。

    使用 PyPSA 的容量扩展规划（CEP）找到最低成本的电池配置。
    """

    def __init__(
        self,
        pv_capacity_kw: float,
        load_profile: pd.Series,
        pv_profile: pd.Series,
        diesel_capacity_kw: float = 0,
        battery_power_cost_per_kw: float = 2000,    # 元/kW（功率）
        battery_energy_cost_per_kwh: float = 1500,  # 元/kWh（能量）
        max_loss_of_load: float = 0.01,             # 允许最大失负荷率 1%
    ):
        self.pv_capacity_kw = pv_capacity_kw
        self.load_profile = load_profile
        self.pv_profile = pv_profile
        self.diesel_capacity_kw = diesel_capacity_kw
        self.battery_power_cost_per_kw = battery_power_cost_per_kw
        self.battery_energy_cost_per_kwh = battery_energy_cost_per_kwh
        self.max_loss_of_load = max_loss_of_load

    def optimize(self, solver_name: str = "highs") -> dict:
        """
        通过 PyPSA 容量扩展规划，寻找最低成本的电池配置。

        Returns
        -------
        dict
            包含最优电池功率、容量和成本的结果字典
        """
        n = pypsa.Network()
        n.set_snapshots(self.load_profile.index)

        n.add("Carrier", "AC")
        n.add("Carrier", "solar")
        n.add("Carrier", "battery")
        n.add("Carrier", "diesel")

        n.add("Bus", "AC_bus", carrier="AC")

        # 光伏（固定容量）
        n.add("Generator", "PV", bus="AC_bus", carrier="solar",
              p_nom=self.pv_capacity_kw, p_max_pu=self.pv_profile, marginal_cost=0)

        # 柴油发电机（如有）
        if self.diesel_capacity_kw > 0:
            n.add("Generator", "Diesel", bus="AC_bus", carrier="diesel",
                  p_nom=self.diesel_capacity_kw, p_min_pu=0.0, marginal_cost=1.5)

        # 电池（容量待优化）—— 功率和能量分别用 StorageUnit 和 Store 组合
        n.add(
            "StorageUnit", "Battery",
            bus="AC_bus",
            carrier="battery",
            p_nom_extendable=True,       # 功率容量待优化
            p_nom_min=0,
            p_nom_max=self.pv_capacity_kw * 2,
            max_hours=8,                 # 最大 8h 储能（可调整）
            efficiency_store=0.95,
            efficiency_dispatch=0.95,
            cyclic_state_of_charge=True,
            capital_cost=self.battery_power_cost_per_kw + self.battery_energy_cost_per_kwh * 8,
        )

        # 负载
        n.add("Load", "Load", bus="AC_bus", p_set=self.load_profile)

        # 失负荷（高成本惩罚项）
        penalty = 10000  # 元/kWh 惩罚
        n.add("Generator", "LoadShedding", bus="AC_bus", carrier="AC",
              p_nom=self.load_profile.max() * 2, marginal_cost=penalty)

        # 弃光（负成本 sink）
        n.add("Generator", "Curtailment", bus="AC_bus", carrier="AC",
              p_nom=self.pv_capacity_kw * 2, p_min_pu=-1, p_max_pu=0, marginal_cost=-0.001)

        # 运行优化
        n.optimize(solver_name=solver_name, solver_options={"output_flag": False})

        opt_battery_kw = n.storage_units.at["Battery", "p_nom_opt"]
        opt_battery_kwh = opt_battery_kw * 8

        return {
            "optimal_battery_power_kw": round(opt_battery_kw, 1),
            "optimal_battery_energy_kwh": round(opt_battery_kwh, 1),
            "annual_load_shed_kwh": round(n.generators_t.p["LoadShedding"].sum(), 1),
        }


# ─────────────────────────────────────────────────────────────
# 3. 电流规格负载时序生成（可替代 generate_load_profile）
# ─────────────────────────────────────────────────────────────

def generate_load_profile_from_current_spec(
    voltage_v: float,
    current_schedule: list,
    year: int = 2020,
    power_factor: float = 1.0,
    annual_kwh_override: float = None,
) -> pd.Series:
    """
    根据电压/电流规格表生成逐小时负载时序（kW）。

    实际工程中常见的输入形式：已知各时段工作电流，由此推算负载功率。

    Parameters
    ----------
    voltage_v : float
        系统电压（V），如 240（北美分相制）
    current_schedule : list of (start_hour, end_hour, current_A)
        各时段电流，0~23 制（跨日时段 end_hour 可 > 24）。
        示例（40kW 案例负载）：
            [(8, 10, 140),   # 08:00-10:00：140A
             (10, 17, 50),   # 10:00-17:00：50A
             (17, 20, 140),  # 17:00-20:00：140A
             (20, 32, 20)]   # 20:00-次日08:00：20A
    power_factor : float
        功率因数，P = V × I × pf / 1000（kW）
    annual_kwh_override : float, optional
        若指定，将时序形状保留但归一化到该年总用电量（kWh）。
        用于对齐 HOMER Pro 或实测年用电量。

    Returns
    -------
    pd.Series
        逐小时负载功率（kW），索引为 DatetimeIndex（8760 点）

    Notes
    -----
    40kW 案例验证：
        电流表 → 日用电 309.6 kWh → 年用电 113,004 kWh（理论值）
        设 annual_kwh_override=131400 可归一化到 HOMER Pro 仿真值。
    """
    snapshots   = pd.date_range(f"{year}-01-01", periods=8760, freq="h")
    hour_of_day = np.arange(8760) % 24
    load_kw     = np.zeros(8760)

    for start_h, end_h, current_a in current_schedule:
        power_kw = voltage_v * current_a * power_factor / 1000.0
        s = int(start_h) % 24

        if end_h <= 24:
            # 同日时段
            e = int(end_h) % 24 if int(end_h) % 24 != 0 else 24
            mask = (hour_of_day >= s) & (hour_of_day < e)
        else:
            # 跨日时段（如 20:00 → 32:00 表示 20:00→次日08:00）
            e = int(end_h) - 24
            mask = (hour_of_day >= s) | (hour_of_day < e)

        load_kw[mask] = power_kw

    if annual_kwh_override is not None:
        base_kwh = load_kw.sum()   # 1h × kW = kWh
        if base_kwh > 0:
            load_kw = load_kw * (annual_kwh_override / base_kwh)

    return pd.Series(load_kw, index=snapshots, name="load_kw")


# ─────────────────────────────────────────────────────────────
# 4. 纯柴油基准仿真（替代 HOMER Pro A工况结果）
# ─────────────────────────────────────────────────────────────

class DieselOnlySimulator:
    """
    纯柴油发电机系统仿真器（离网基准场景）。

    无光伏、无储能，仅靠柴油发电机供电。
    考虑柴油机最小技术出力（默认 30%），超出负载的多余电量直接弃掉。

    PyPSA 网络结构：
    ┌──────────────┐
    │ 柴油发电机    │───▶  AC母线  ───▶  负载
    │ (p_min=30%)  │         │
    └──────────────┘    弃电（DumpLoad）

    替代 HOMER Pro 提供的 A工况数据：
        - 年用油量（升/年）       → ProjectParameters.dieselonly_diesel_liters
        - 年运行小时（≈8760h）    → DieselOMParams.hours_a
    """

    def __init__(
        self,
        diesel_capacity_kw: float,
        load_profile: pd.Series,
        min_load_pu: float = 0.3,
        diesel_fuel_cost_usd_per_kwh: float = 0.297,  # $0.95/L ÷ 3.2kWh/L
        diesel_kwh_per_liter: float = 3.2,
        verbose: bool = False,
    ):
        """
        Parameters
        ----------
        diesel_capacity_kw : float
            柴油机额定功率（kW）
        load_profile : pd.Series
            逐小时负载功率（kW）
        min_load_pu : float
            最小技术出力（标幺值），默认 0.3（30%）
        diesel_fuel_cost_usd_per_kwh : float
            柴油边际成本（美元/kWh 电能）= 柴油价($/L) ÷ 发电效率(kWh/L)
        diesel_kwh_per_liter : float
            柴油发电效率（kWh/L），用于 kWh → 升 换算
        """
        self.diesel_capacity_kw     = diesel_capacity_kw
        self.load_profile           = load_profile
        self.min_load_pu            = min_load_pu
        self.diesel_fuel_cost       = diesel_fuel_cost_usd_per_kwh
        self.diesel_kwh_per_liter   = diesel_kwh_per_liter
        self.verbose                = verbose
        self.network: pypsa.Network | None = None
        self.results: dict = {}

    def build_network(self) -> pypsa.Network:
        """构建纯柴油 PyPSA 网络"""
        n = pypsa.Network()
        n.set_snapshots(self.load_profile.index)

        n.add("Carrier", "AC",     co2_emissions=0)
        n.add("Carrier", "diesel", co2_emissions=2.68)

        n.add("Bus", "AC_bus", carrier="AC", v_nom=0.4)

        # ── 柴油发电机（有最小技术出力约束）──────────────
        n.add(
            "Generator", "Diesel",
            bus="AC_bus",
            carrier="diesel",
            p_nom=self.diesel_capacity_kw,
            p_min_pu=self.min_load_pu,
            p_max_pu=1.0,
            marginal_cost=self.diesel_fuel_cost,
            capital_cost=0,
        )

        # ── 负载 ──────────────────────────────────────────
        n.add("Load", "Load", bus="AC_bus", p_set=self.load_profile)

        # ── 弃电（吸收最小出力超过负载的多余电量）────────
        # 当负载 < diesel_min_load 时，柴油机仍发 diesel_min_load，
        # 多余电量由 DumpLoad（负功率发电机）吸收。
        n.add(
            "Generator", "DumpLoad",
            bus="AC_bus",
            carrier="AC",
            p_nom=self.diesel_capacity_kw,
            p_min_pu=-1,   # 可向下出力（吸收多余电量）
            p_max_pu=0,    # 不主动发电
            marginal_cost=-0.001,
        )

        # ── 失负荷兜底（高成本，保证模型可行性）────────────
        n.add(
            "Generator", "LoadShedding",
            bus="AC_bus",
            carrier="AC",
            p_nom=self.load_profile.max() * 1.5,
            marginal_cost=999,
            capital_cost=0,
        )

        self.network = n
        if self.verbose:
            print(n)
        return n

    def run_simulation(self, solver_name: str = "highs") -> dict:
        """
        运行纯柴油基准仿真。

        Returns
        -------
        dict
            annual_diesel_kwh_generated : 年发电量（含弃掉的多余电）
            annual_load_kwh             : 年总负载
            annual_dump_kwh             : 年弃电量（最小出力超负载部分）
            annual_load_shed_kwh        : 年失负荷（若柴油机容量不足）
            diesel_run_hours            : 年运行小时数（≈8760）
            diesel_liters_per_year      : 年用油量（升）
            effective_load_efficiency   : 有效供电效率 = 负载/发电
        """
        if self.network is None:
            self.build_network()

        n = self.network
        status = n.optimize(solver_name=solver_name, solver_options={"output_flag": False})
        if "optimal" not in str(status).lower() and status is not True:
            print(f"  ⚠ 求解状态: {status}")

        diesel_series  = n.generators_t.p["Diesel"]
        diesel_kwh     = diesel_series.sum()
        diesel_hours   = int((diesel_series > 0.01).sum())
        dump_kwh       = abs(
            n.generators_t.p.get("DumpLoad", pd.Series(0)).clip(upper=0).sum()
        )
        load_shed_kwh  = n.generators_t.p.get("LoadShedding", pd.Series(0)).sum()
        load_kwh       = n.loads_t.p["Load"].sum()
        diesel_liters  = diesel_kwh / self.diesel_kwh_per_liter

        self.results = {
            "annual_diesel_kwh_generated": round(diesel_kwh, 1),
            "annual_load_kwh":             round(load_kwh, 1),
            "annual_dump_kwh":             round(dump_kwh, 1),
            "annual_load_shed_kwh":        round(load_shed_kwh, 1),
            "diesel_run_hours":            diesel_hours,
            "diesel_liters_per_year":      round(diesel_liters, 0),
            "effective_load_efficiency":   round(load_kwh / max(diesel_kwh, 1e-6), 3),
        }

        if self.verbose:
            print(f"  [纯柴油仿真结果]")
            print(f"    年发电量  : {diesel_kwh:>10,.1f} kWh")
            print(f"    年用电量  : {load_kwh:>10,.1f} kWh")
            print(f"    年弃电量  : {dump_kwh:>10,.1f} kWh（最小出力超负载）")
            print(f"    年用油量  : {diesel_liters:>10,.0f} 升")
            print(f"    运行小时  : {diesel_hours:>10,} h/年")

        return self.results