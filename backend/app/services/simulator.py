"""
services/simulator.py — 快速估算 & PyPSA 完整仿真
"""
from __future__ import annotations
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from microgrid_simulator import (       # type: ignore
    OffGridMicrogridSimulator,
    generate_load_profile,
    generate_pv_profile,
)


def quick_estimate(
    pv_kw: float,
    diesel_kw: float,
    battery_kwh: float,
    annual_load_kwh: float,
    diesel_eff: float = 3.5,
) -> dict:
    """
    快速估算柴油消耗指标（< 0.1 秒，基于比例缩放）。
    参考案例：40kW 柴油 / 84kW PV / 160kWh 电池 / 131,400 kWh/年
    """
    REF_SOLAR_FRAC = 0.896
    REF_PV_KW      = 84.0
    REF_LOAD_KWH   = 131_400.0

    avg_load_kw = annual_load_kwh / 8760.0
    pv_to_load  = pv_kw / max(avg_load_kw, 0.1)
    ref_ratio   = REF_PV_KW / (REF_LOAD_KWH / 8760.0)

    solar_frac = min(0.97, REF_SOLAR_FRAC * (pv_to_load / ref_ratio) ** 0.6)

    mg_diesel_kwh    = annual_load_kwh * (1.0 - solar_frac)
    mg_diesel_liters = round(mg_diesel_kwh / diesel_eff, 0)
    mg_diesel_hours  = round(mg_diesel_kwh / max(diesel_kw * 0.6, 0.1), 0)
    mg_diesel_hours  = int(min(mg_diesel_hours, 8760))

    diesel_only_liters = round(annual_load_kwh / (diesel_eff * 0.88), 0)

    return {
        "solar_fraction":             round(solar_frac * 100, 1),
        "loss_of_load_pct":           0.0,
        "curtailment_pct":            round(max(0, (solar_frac - 0.7) * 30), 1),
        "mg_diesel_liters":           int(mg_diesel_liters),
        "mg_diesel_hours":            int(mg_diesel_hours),
        "diesel_only_liters":         int(diesel_only_liters),
        "diesel_run_hours_a":         8760,
        "annual_fuel_saving_liters":  int(diesel_only_liters - mg_diesel_liters),
    }


def run_pypsa(
    pv_kw: float,
    battery_kwh: float,
    diesel_kw: float,
    annual_load_kwh: float,
    load_type: str,
    diesel_eff: float,
    diesel_price: float,
    latitude: float,
    year: int,
) -> dict:
    """运行完整 PyPSA 仿真（约 15-30 秒）。"""
    pv_profile   = generate_pv_profile(latitude=latitude, year=year, panel_capacity_kw=pv_kw)
    load_profile = generate_load_profile(annual_consumption_kwh=annual_load_kwh,
                                         load_type=load_type, year=year)
    bat_power_kw = battery_kwh / 4.0
    sim = OffGridMicrogridSimulator(
        pv_capacity_kw       = pv_kw,
        battery_capacity_kwh = battery_kwh,
        battery_power_kw     = bat_power_kw,
        diesel_capacity_kw   = diesel_kw,
        load_profile         = load_profile,
        pv_profile           = pv_profile,
        diesel_fuel_cost     = diesel_price / diesel_eff,
        verbose              = False,
    )
    sim.build_network()
    results = sim.run_simulation(solver_name="highs")

    mg_diesel_liters   = round(results["annual_diesel_kwh"] / diesel_eff, 0)
    mg_diesel_hours    = int(results.get("diesel_run_hours", 889))
    diesel_only_liters = round(annual_load_kwh / (diesel_eff * 0.88), 0)

    return {
        "solar_fraction":             round(results["solar_fraction"], 1),
        "loss_of_load_pct":           round(results["loss_of_load_rate"], 3),
        "curtailment_pct":            round(results["curtailment_rate"], 1),
        "mg_diesel_liters":           int(mg_diesel_liters),
        "mg_diesel_hours":            mg_diesel_hours,
        "diesel_only_liters":         int(diesel_only_liters),
        "diesel_run_hours_a":         8760,
        "annual_fuel_saving_liters":  int(diesel_only_liters - mg_diesel_liters),
    }
