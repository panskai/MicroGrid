"""
optimizer.py
============
微电网容量自动寻优模块。

给定年用电量 + 峰值负荷 + 选址参数，通过参数扫描找出
PV / 储能 / 柴发的最优组合，并按用户指定目标（最短回本期
/ 最低 LCOE / 最高 10 年 NPV）排序后返回方案列表。

不依赖外部 LP 求解器；用简化的能量平衡模型估算太阳能占比，
计算速度快，适合前端实时调用。

主要接口
--------
optimize(req: OptimizeInput) → List[OptimizeOption]

设计原则
--------
1. 柴发容量 → 由峰值负荷决定（覆盖最大需求）
2. PV 容量  → 扫描 1~N 套折叠支架，每套含 32 块 655W 组件
3. 储能容量  → PV(kW) × 3h × 储能天数（与 Excel 参考案例对齐）
4. 太阳能占比→ 简化能量平衡模型：SF = min(0.98, PV年发电 / 年负荷)
5. 成本核算  → 调用 config_loader.ProductCatalog 读取 products.yaml
6. 经济评估  → CAPEX、年节省、回本期、10年NPV、LCOE

参考验证（Excel 案例）
--------------------
annual_load=131400kWh, peak=40kW, sun=4.5h, days=1
→ 推荐方案：4套支架(83.84kW PV) + 16包LFP-16kWh(256kWh) + 40kW柴发
→ 回本期 ≈ 5年（与 Excel 经济分析-备注版.xlsx 一致）
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import List, Optional

from config_loader import get_catalog, ProductCatalog


# ─────────────────────────────────────────────────────────────
# 数据结构
# ─────────────────────────────────────────────────────────────

@dataclass
class OptimizeInput:
    """优化输入参数"""
    # ── 必填 ──────────────────────────────────────────────
    annual_load_kwh: float              # 年用电量 (kWh)

    # ── 可选（提供则更准确）──────────────────────────────
    peak_load_kw: float = 0.0           # 峰值负荷 (kW)；0 = 自动估算
    peak_sun_hours: float = 4.5         # 日均峰值日照小时（当地）
    storage_days: int = 1               # 储能支撑天数
    diesel_price_usd_per_liter: float = 0.95  # 柴油单价 $/L
    fuel_efficiency_kwh_per_l: float = 3.5    # 柴油机燃油效率 kWh/L
    discount_rate: float = 0.08         # 折现率（用于 NPV）
    project_years: int = 10             # 项目寿命（年）
    diesel_is_new: bool = False         # 柴发是否新购（计入 CAPEX）

    # ── 产品型号 ────────────────────────────────────────
    panel_model: str = "655W"
    bracket_model: str = "standard_32"
    battery_pack_model: str = "LFP-16kWh"

    # ── 扫描范围 ────────────────────────────────────────
    min_bracket_sets: int = 1
    max_bracket_sets: int = 8

    # ── 客户约束（可选）─────────────────────────────────
    # 场地面积约束：自动换算为最大支架套数
    available_area_m2: Optional[float] = None   # None = 不限
    # 已有柴发：直接使用该容量，不重新定容，不计购置费
    # None = 自动定容；0 = 确定无柴发；>0 = 已有具体容量(kW)
    existing_diesel_kw: Optional[float] = None

    # ── 优化目标 ────────────────────────────────────────
    objective: str = "payback"          # "payback" | "npv" | "lcoe"


@dataclass
class OptimizeOption:
    """单个方案的完整描述"""
    bracket_sets: int
    pv_kw: float
    battery_kwh: float
    num_packs: int
    diesel_kw: float

    # ── 能量指标 ────────────────────────────────────────
    solar_fraction_pct: float           # 太阳能供电占比 %
    annual_diesel_kwh: float            # 微电网年柴油发电量 kWh
    annual_diesel_liters: float         # 微电网年耗油量 L
    annual_diesel_only_liters: float    # 纯柴发方案年耗油量 L

    # ── 经济指标 ────────────────────────────────────────
    capex_usd: float                    # 初始成本合计（不含利润）
    selling_price_usd: float            # 售价（含 20% 利润）
    annual_diesel_cost_usd: float       # 微电网年柴油费
    annual_diesel_only_cost_usd: float  # 纯柴发年柴油费
    annual_om_cost_usd: float           # 微电网年运维费
    annual_savings_usd: float           # 相比纯柴发年节省
    payback_years: float                # 静态回本期（年）
    npv_10yr_usd: float                 # 10 年 NPV
    lcoe_microgrid_usd_per_kwh: float   # 微电网 LCOE
    lcoe_diesel_only_usd_per_kwh: float # 纯柴发 LCOE

    # ── 标签 ────────────────────────────────────────────
    label: str = ""
    is_recommended: bool = False        # 综合最优方案（方案1）
    is_runner_up: bool = False          # 次优方案（方案2）
    is_third: bool = False              # 第三推荐方案（方案3）
    score: float = 0.0                  # 综合评分（越高越好）
    diesel_is_new: bool = False         # 是否新购柴发（影响 CAPEX）


# ─────────────────────────────────────────────────────────────
# 工具函数
# ─────────────────────────────────────────────────────────────

# 标准柴发规格（kW → 最近标准规格）
_STANDARD_DIESEL_KW = [10, 15, 20, 30, 40, 50, 60, 80, 100, 120, 150, 200]


def _nearest_diesel(kw: float) -> float:
    """返回大于等于 kw 的最近标准规格"""
    for std in _STANDARD_DIESEL_KW:
        if std >= kw:
            return float(std)
    return float(_STANDARD_DIESEL_KW[-1])


def _estimate_peak_load(annual_kwh: float, load_type: str = "commercial") -> float:
    """
    由年用电量估算峰值负荷。

    经验公式（来自 Excel 案例逆推）：
      average_kw = annual_kwh / 8760
      peak_kw    = average_kw × peak_factor
      diesel_kw  = nearest_standard(peak_kw × 1.2)

    Excel 案例验证：
      131400 / 8760 = 15kW 均值
      15 × 2.24 = 33.6kW 峰值
      nearest(33.6 × 1.2 = 40.3kW) = 40kW ✓
    """
    factors = {
        "residential":  2.8,   # 居民用电：波峰明显
        "commercial":   2.24,  # 商业用电（Excel 案例）
        "industrial":   1.8,   # 工业：负荷较均匀
    }
    factor = factors.get(load_type, 2.24)
    avg_kw = annual_kwh / 8760
    return avg_kw * factor


def _solar_fraction(pv_kw: float, annual_load_kwh: float,
                    peak_sun_hours: float, battery_kwh: float) -> float:
    """
    简化太阳能占比估算。

    模型：
      PV年发电 = pv_kw × peak_sun_hours × 365 × system_eff
      可用发电 = min(PV年发电, 年负荷 + 储能损耗补偿)
      SF = 可用发电 / 年负荷

    系统效率：发电→逆变→充放→负荷，约 75-82%（越大越保守）。
    储能修正：电池增加 SF，因为可以存储白天剩余 PV。
    """
    # 系统效率（含组件衰减、逆变器、线路损耗）
    system_eff = 0.78
    pv_annual_kwh = pv_kw * peak_sun_hours * 365 * system_eff

    # 储能提升系数：每 100kWh 储能提升约 3% SF（经验值）
    battery_boost = min(0.15, battery_kwh / 100 * 0.03)

    raw_sf = pv_annual_kwh / annual_load_kwh + battery_boost
    return min(0.97, max(0.0, raw_sf))


def _build_capex(
    catalog: ProductCatalog,
    bracket_sets: int,
    num_packs: int,
    diesel_kw: float,
    diesel_is_new: bool,
    panel_model: str,
    battery_pack_model: str,
) -> tuple[float, float]:
    """
    计算 CAPEX（初始成本合计）和含 20% 利润的售价。

    返回 (capex_usd, selling_price_usd)

    利润规则（与 Excel 对齐）：
      柴发购置费、安装调试费 为直通项（不加利润）
    """
    panel   = catalog.panel(panel_model)
    bracket = catalog.bracket()

    # ── PV 组件成本 ────────────────────────────────────
    panels_per_set = bracket.panels_per_set
    pv_module_cost = bracket_sets * panels_per_set * panel.watts * panel.price_usd_per_wp

    # ── PV 支架成本（含 50% 进口关税）──────────────────
    mounting_per_set = 76_200 / 4   # $19,050/套（以 4 套案例标定）
    pv_mounting_cost = bracket_sets * mounting_per_set

    # ── 储能系统（逆变器 + 电池包 + 托盘）──────────────
    bp       = catalog.battery_pack(battery_pack_model)
    inverter = catalog.inverter_for_voltage("120V/240V")
    num_inv  = max(1, math.ceil(num_packs / inverter.packs_per_inverter))
    inv_cost = num_inv * inverter.price_usd
    bat_cost = num_packs * bp.price_usd
    pal_cost = num_packs * 250      # 托盘 $250/包
    storage_cost = inv_cost + bat_cost + pal_cost

    # ── 柴发成本（仅新购时计入）─────────────────────────
    diesel_cost = 0.0
    if diesel_is_new and diesel_kw > 0:
        dg = catalog.diesel_generator(power_kw=diesel_kw)
        diesel_cost = dg.price_usd

    # ── 附件成本（随支架套数缩放）──────────────────────
    acc = catalog.accessories()
    it  = acc.get("intl_transport", {})
    ins = acc.get("installation",   {})
    am  = acc.get("accessory_materials", {})
    bp_pallet = acc.get("battery_pallet", {})
    intl_transport = (it.get("base_usd", 3000)
                      + bracket_sets * it.get("per_bracket_set_usd", 1950))
    installation   = (ins.get("base_usd", 1000)
                      + bracket_sets * ins.get("per_bracket_set_usd", 1000))
    accessories    = (am.get("base_usd", 8500)
                      + bracket_sets * am.get("per_bracket_set_usd", 5000))
    other_initial  = acc.get("other_initial_usd", 4_200)
    # 电池托盘已包含在 storage_cost 中（pal_cost），此处不重复计算

    capex = (pv_module_cost + pv_mounting_cost + storage_cost
             + diesel_cost + intl_transport + installation
             + accessories + other_initial)

    # ── 售价（柴发 + 安装调试为直通项，不加 20% 利润）──
    pass_through   = diesel_cost + installation
    selling_price  = (capex - pass_through) * 1.20 + pass_through

    return round(capex, 2), round(selling_price, 2)


def _annual_om(bracket_sets: int, num_packs: int) -> float:
    """年度运维费（光储部分，不含柴发 O&M）"""
    # 参考 Excel：PV+储能运维=1000, 设备维修=200, 保险=3000
    base = 1_000 + 200 + 3_000
    # 规模缩放：按支架套数线性
    scale = bracket_sets / 4
    return round(base * max(0.5, scale), 0)


def _diesel_om_annual(diesel_kw: float, run_hours: float) -> float:
    """
    柴发年度 O&M 估算（简化）。

    参考 Excel Sheet2 详细参数，简化为：
      ≈ $1.20/h × 运行小时（含机油、滤芯、人工等）
    """
    return round(diesel_kw * 0.5 + run_hours * 1.20, 0)


def _npv(capex: float, annual_savings: float,
         rate: float, years: int) -> float:
    """简单 NPV（等额年金）"""
    if rate == 0:
        return annual_savings * years - capex
    annuity_factor = (1 - (1 + rate) ** (-years)) / rate
    return round(annual_savings * annuity_factor - capex, 0)


def _lcoe(capex: float, annual_om: float, annual_kwh: float,
          rate: float, years: int) -> float:
    """
    LCOE ($/kWh)：(资本化成本 + 年运维) / 年发电量
    """
    if rate == 0:
        crf = 1 / years
    else:
        crf = rate * (1 + rate) ** years / ((1 + rate) ** years - 1)
    annualized_capex = capex * crf
    return round((annualized_capex + annual_om) / annual_kwh, 4)


# ─────────────────────────────────────────────────────────────
# 主优化函数
# ─────────────────────────────────────────────────────────────

def optimize(req: OptimizeInput) -> List[OptimizeOption]:
    """
    参数扫描优化：遍历 1~max_bracket_sets 套支架，
    返回按目标排序的方案列表。

    参数
    ----
    req : OptimizeInput

    返回
    ----
    List[OptimizeOption]，按 score 降序（推荐方案在前）
    """
    catalog = get_catalog()
    panel   = catalog.panel(req.panel_model)
    bracket = catalog.bracket(req.bracket_model)
    bp      = catalog.battery_pack(req.battery_pack_model)

    # ── 约束1：场地面积 → 限制最大支架套数 ──────────────
    area_per_set   = bracket.area_m2          # 每套占地 m²
    max_sets_area  = req.max_bracket_sets     # 默认不限
    if req.available_area_m2 is not None and req.available_area_m2 > 0:
        max_sets_area = max(1, int(req.available_area_m2 / area_per_set))
    effective_max_sets = min(req.max_bracket_sets, max_sets_area)

    # ── 约束2：已有柴发 → 跳过自动定容，设为不新购 ──────
    if req.existing_diesel_kw is not None:
        # 客户已有：直接使用该容量；若 0 则表示无柴发
        diesel_kw          = float(req.existing_diesel_kw)
        effective_is_new   = False            # 已有 → 不计入 CAPEX
    else:
        # 自动定容
        if req.peak_load_kw > 0:
            peak_kw = req.peak_load_kw
        else:
            peak_kw = _estimate_peak_load(req.annual_load_kwh)
        diesel_kw        = _nearest_diesel(peak_kw * 1.2)
        effective_is_new = req.diesel_is_new

    # ── 纯柴发基准（用于计算节省）──────────────────────
    diesel_only_liters  = req.annual_load_kwh / req.fuel_efficiency_kwh_per_l
    diesel_only_fuel    = diesel_only_liters * req.diesel_price_usd_per_liter

    # 纯柴发 O&M（含保养人工 + 耗材），参考 Excel Sheet2
    #   $1.20/h × 8760h = $10,512/yr
    diesel_only_om_annual = _diesel_om_annual(diesel_kw, 8760)

    # ⚠️ 关键：纯柴发每~1.71年需要更换整机（寿命 15,000h / 8760h = 1.71yr）
    # 年化更换成本 = 机价 / 更换周期
    diesel_lifetime_h    = 15_000
    diesel_replacement_y = diesel_lifetime_h / 8760          # ~1.71 yr
    dg_price             = catalog.diesel_generator(power_kw=diesel_kw).price_usd
    diesel_replacement_annual = dg_price / diesel_replacement_y

    diesel_only_cost = diesel_only_fuel + diesel_only_om_annual + diesel_replacement_annual

    # ── 纯柴发 LCOE ──────────────────────────────────────
    lcoe_diesel_only = round(diesel_only_cost / req.annual_load_kwh, 4)

    options: List[OptimizeOption] = []

    for sets in range(req.min_bracket_sets, effective_max_sets + 1):
        # PV 容量
        pv_kw = sets * bracket.panels_per_set * panel.kw

        # 储能容量（PV×3h×days）
        target_kwh = pv_kw * 3 * req.storage_days
        num_packs  = max(1, math.ceil(target_kwh / bp.capacity_kwh))
        battery_kwh = num_packs * bp.capacity_kwh

        # 太阳能占比
        sf  = _solar_fraction(pv_kw, req.annual_load_kwh,
                               req.peak_sun_hours, battery_kwh)
        sf_pct = round(sf * 100, 1)

        # 柴发年发电量 & 耗油量
        annual_diesel_kwh    = req.annual_load_kwh * (1 - sf)
        annual_diesel_liters = annual_diesel_kwh / req.fuel_efficiency_kwh_per_l
        annual_diesel_cost   = annual_diesel_liters * req.diesel_price_usd_per_liter

        # 年运维费（光储 + 柴发 O&M）
        diesel_run_hours = annual_diesel_kwh / max(1, diesel_kw * 0.6)  # 平均 60% 负载
        om_microgrid = _annual_om(sets, num_packs)
        om_diesel    = _diesel_om_annual(diesel_kw, diesel_run_hours)
        annual_om_total = om_microgrid + om_diesel

        # 年节省 = 纯柴发年总成本 - 微电网年总运营成本
        # 纯柴发年总成本 = 油费 + O&M + 年化更换费
        annual_savings = diesel_only_cost \
                         - (annual_diesel_cost + annual_om_total)

        # CAPEX & 售价
        capex, selling_price = _build_capex(
            catalog, sets, num_packs, diesel_kw,
            effective_is_new, req.panel_model, req.battery_pack_model,
        )

        # 回本期（基于售价）
        if annual_savings > 0:
            payback = round(selling_price / annual_savings, 1)
        else:
            payback = 99.0

        # 10 年 NPV（基于售价）
        npv = _npv(selling_price, annual_savings, req.discount_rate,
                   req.project_years)

        # 微电网 LCOE（年总成本 / 年用电量）
        lcoe_mg = round((selling_price / req.project_years + annual_om_total
                         + annual_diesel_cost) / req.annual_load_kwh, 4)

        # ── 综合评分（用于排序推荐）────────────────────
        # 核心原则：
        #   1. SF < 55% 的方案视为"柴发主导"，对微电网客户无意义 → 硬性排除
        #   2. SF 在 65~90% 为合理区间，80% 附近评分最高
        #   3. 回本期短（≤6年）得分高；>10年视为不可接受
        #   4. NPV 正值越大越好
        MIN_SF = 0.55   # 低于此 SF 的方案不推荐（柴发占比太高）

        if sf < MIN_SF:
            # SF 不足：评分极低，确保排在推荐名单之外
            score = -100.0 + sf * 10  # 越接近阈值越高，但始终为负
        elif req.objective == "payback":
            # SF 奖励：在 75~85% 区间峰值（中心 80%，宽度 ±20%）
            sf_bonus = max(0.0, 1.0 - abs(sf * 100 - 80) / 20)
            # NPV 归一化：相对于"10年纯节省"的比例
            npv_norm = max(0.0, npv) / max(1, annual_savings * req.project_years)
            # 回本评分：6年内满分，10年归零，超过则负分
            pay_score = max(0.0, 1.0 - max(0.0, payback - 3) / 7)
            score = npv_norm * 0.4 + pay_score * 0.35 + sf_bonus * 0.25
        elif req.objective == "npv":
            score = npv / 1_000   # 归一化
        else:  # lcoe
            score = -lcoe_mg * 100

        opt = OptimizeOption(
            bracket_sets=sets,
            pv_kw=round(pv_kw, 2),
            battery_kwh=round(battery_kwh, 1),
            num_packs=num_packs,
            diesel_kw=diesel_kw,
            solar_fraction_pct=sf_pct,
            annual_diesel_kwh=round(annual_diesel_kwh, 0),
            annual_diesel_liters=round(annual_diesel_liters, 0),
            annual_diesel_only_liters=round(diesel_only_liters, 0),
            capex_usd=capex,
            selling_price_usd=selling_price,
            annual_diesel_cost_usd=round(annual_diesel_cost, 0),
            annual_diesel_only_cost_usd=round(diesel_only_cost, 0),
            annual_om_cost_usd=round(annual_om_total, 0),
            annual_savings_usd=round(annual_savings, 0),
            payback_years=payback,
            npv_10yr_usd=round(npv, 0),
            lcoe_microgrid_usd_per_kwh=lcoe_mg,
            lcoe_diesel_only_usd_per_kwh=lcoe_diesel_only,
            score=score,
            diesel_is_new=effective_is_new,
        )
        options.append(opt)

    # ── 排序 & 标注推荐 ──────────────────────────────────
    options.sort(key=lambda o: o.score, reverse=True)

    # 标注前三名（仅限 SF ≥ 55% 的有效方案）
    # 分两组：合格方案（score >= 0）和低 SF 方案（score < 0）
    valid   = [o for o in options if o.score >= 0]
    invalid = [o for o in options if o.score < 0]

    for i, opt in enumerate(valid):
        if i == 0:
            opt.is_recommended = True
            opt.label = "方案1 最优"
        elif i == 1:
            opt.is_runner_up = True
            opt.label = "方案2 次优"
        elif i == 2:
            opt.is_third = True
            opt.label = "方案3 备选"
        else:
            opt.label = f"{opt.bracket_sets} 套"

    for opt in invalid:
        opt.label = f"{opt.bracket_sets} 套（低太阳能占比）"

    # 按排序顺序返回：合格方案在前，低 SF 方案在后
    return valid + invalid


# ─────────────────────────────────────────────────────────────
# 命令行验证
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")

    req = OptimizeInput(
        annual_load_kwh=131_400,
        peak_load_kw=40.0,          # 已知 40kW 柴发
        peak_sun_hours=4.5,
        storage_days=1,
        diesel_price_usd_per_liter=0.95,
        diesel_is_new=True,         # Excel 案例：柴发为新购，计入 CAPEX
        objective="payback",
    )

    results = optimize(req)

    print("=" * 70)
    print(f"优化结果（年负荷 {req.annual_load_kwh:,.0f} kWh，峰值 {req.peak_load_kw}kW）")
    print("=" * 70)
    print(f"{'套数':>4} {'PV(kW)':>8} {'电池(kWh)':>10} {'SF%':>6} "
          f"{'CAPEX':>10} {'售价':>10} {'年节省':>8} {'回本(年)':>8} {'NPV10':>10}")
    print("-" * 70)
    for opt in results:
        star = "★" if opt.is_recommended else " "
        print(f"{star}{opt.bracket_sets:>3} "
              f"{opt.pv_kw:>8.1f} "
              f"{opt.battery_kwh:>10.0f} "
              f"{opt.solar_fraction_pct:>6.1f} "
              f"${opt.capex_usd:>9,.0f} "
              f"${opt.selling_price_usd:>9,.0f} "
              f"${opt.annual_savings_usd:>7,.0f} "
              f"{opt.payback_years:>8.1f} "
              f"${opt.npv_10yr_usd:>9,.0f}")
    print()
    ref = next((o for o in results if o.bracket_sets == 4), None)
    if ref:
        print(f"参考案例（4套）回本期: {ref.payback_years} 年  "
              f"（Excel 案例：5年，差异来自 SF 简化估算）")

    # ── 约束场景1：场地只有 600 m²（最多 2 套）──────────
    print()
    print("=" * 70)
    print("约束场景1：场地面积仅 600 m²（260m²/套 → 最多 2 套）")
    print("=" * 70)
    req2 = OptimizeInput(
        annual_load_kwh=131_400,
        peak_load_kw=40.0,
        diesel_is_new=True,
        available_area_m2=600,          # 面积约束
        objective="payback",
    )
    r2 = optimize(req2)
    for opt in r2:
        star = "★" if opt.is_recommended else ("☆" if opt.is_runner_up else " ")
        print(f"{star}{opt.bracket_sets:>3}套  PV {opt.pv_kw:>6.1f}kW  "
              f"SF {opt.solar_fraction_pct:>5.1f}%  "
              f"售价 ${opt.selling_price_usd:>9,.0f}  "
              f"回本 {opt.payback_years:>5.1f}yr  NPV ${opt.npv_10yr_usd:>8,.0f}")

    # ── 约束场景2：客户已有 40kW 柴发，不新购 ──────────
    print()
    print("=" * 70)
    print("约束场景2：客户已有 40kW 柴发，不新购（CAPEX 不含柴发）")
    print("=" * 70)
    req3 = OptimizeInput(
        annual_load_kwh=131_400,
        existing_diesel_kw=40.0,        # 已有柴发
        objective="payback",
    )
    r3 = optimize(req3)
    for opt in r3:
        star = "★" if opt.is_recommended else ("☆" if opt.is_runner_up else " ")
        new_tag = "(新购)" if opt.diesel_is_new else "(已有)"
        print(f"{star}{opt.bracket_sets:>3}套  PV {opt.pv_kw:>6.1f}kW  "
              f"SF {opt.solar_fraction_pct:>5.1f}%  "
              f"售价 ${opt.selling_price_usd:>9,.0f}{new_tag}  "
              f"回本 {opt.payback_years:>5.1f}yr  NPV ${opt.npv_10yr_usd:>8,.0f}")
