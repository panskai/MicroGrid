"""
routers/calculate.py — POST /api/calculate
"""
from __future__ import annotations
import traceback
import sys
from pathlib import Path

from fastapi import APIRouter
from app.schemas.calculate import CalculateRequest, CalculateResponse
from app.core.catalog import get_catalog
from app.services.calculator import compute_sizes, build_capex
from app.services.simulator import quick_estimate, run_pypsa

# 确保 services/ 在 path 中（economic_analysis 等在那里）
_SERVICES = Path(__file__).resolve().parents[1] / "services"
if str(_SERVICES) not in sys.path:
    sys.path.insert(0, str(_SERVICES))

from economic_analysis import (        # type: ignore
    MicrogridOMParams, DieselOMParams, ProjectParameters, generate_solution_report
)
from microgrid_designer import estimate_diesel_om_params  # type: ignore

router = APIRouter(prefix="/api", tags=["calculate"])


def _to_serializable(obj):
    import numpy as np, pandas as pd
    if isinstance(obj, dict):        return {k: _to_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):        return [_to_serializable(i) for i in obj]
    if isinstance(obj, pd.DataFrame):return obj.to_dict(orient="records")
    if isinstance(obj, np.integer):  return int(obj)
    if isinstance(obj, np.floating): return float(obj)
    if isinstance(obj, np.ndarray):  return obj.tolist()
    return obj


@router.post("/calculate", response_model=CalculateResponse)
def calculate(req: CalculateRequest, simulate: bool = False):
    """
    微电网经济性分析。
    - simulate=false（默认）：快速估算 < 0.1 s
    - simulate=true：运行完整 PyPSA 仿真 ~15-30 s
    """
    try:
        catalog = get_catalog()
        sizes   = compute_sizes(req, catalog)

        pv_kw        = sizes["pv_capacity_kw"]
        battery_kwh  = sizes["battery_capacity_kwh"]
        diesel_kw    = sizes["diesel_kw_comparison"]
        annual_load  = sizes["annual_load_kwh"]
        num_packs    = sizes["num_battery_packs"]

        dg         = catalog.diesel_generator(power_kw=diesel_kw)
        diesel_eff = getattr(dg, "fuel_efficiency_kwh_per_liter", 3.5)

        capex = build_capex(sizes, req, catalog)

        if simulate and pv_kw > 0:
            sim_r = run_pypsa(pv_kw, battery_kwh, diesel_kw, annual_load,
                              req.loadType, diesel_eff, req.dieselPriceUsd,
                              req.latitude, req.year)
        else:
            sim_r = quick_estimate(pv_kw, diesel_kw, battery_kwh, annual_load, diesel_eff)

        proj = ProjectParameters(
            project_name             = f"{diesel_kw:.0f}kW Diesel / {pv_kw:.1f}kW PV Off-Grid Microgrid",
            annual_load_kwh          = float(annual_load),
            diesel_price_per_liter   = req.dieselPriceUsd,
            microgrid_diesel_liters  = float(sim_r["mg_diesel_liters"]),
            dieselonly_diesel_liters = float(sim_r["diesel_only_liters"]),
        )
        mg_om     = MicrogridOMParams()
        diesel_om = estimate_diesel_om_params(diesel_capacity_kw=diesel_kw)
        diesel_om.hours_b = float(sim_r["mg_diesel_hours"])

        report  = generate_solution_report(proj, capex, mg_om, diesel_om)
        summary = report["summary"]
        comp_df = report["tables"]["comparison"]

        comparison_table = [
            {
                "year":              int(row["年份(t)"]),
                "mgAnnualCost":      float(row["微电网每年投入($)"]),
                "dieselAnnualCost":  float(row["柴油发电机每年投入($)"]),
                "mgCumulative":      float(row["微电网累计投入($)"]),
                "dieselCumulative":  float(row["柴油累计投入($)"]),
                "mgLcoe":            float(row["微电网LCOE($/kWh)"]),
                "dieselLcoe":        float(row["柴油LCOE($/kWh)"]),
                "annualRevenue":     float(row["每年收益($)"]),
                "cumulativeRevenue": float(row["累计收益($)"]),
            }
            for _, row in comp_df.iterrows()
        ]

        panel   = catalog.panel(req.panelModel)
        bracket = catalog.bracket(req.bracketModel)
        bp      = catalog.battery_pack(req.batteryPackModel)

        fuel_saving_usd = round(
            (sim_r["diesel_only_liters"] - sim_r["mg_diesel_liters"]) * req.dieselPriceUsd, 0
        )

        return {
            "success":   True,
            "simulated": simulate,
            "systemConfig": {
                "scenario":           req.scenario,
                "pvCapacityKw":       pv_kw,
                "batteryCapacityKwh": battery_kwh,
                "batteryPackCount":   num_packs,
                "dieselCapacityKw":   sizes["diesel_capacity_kw"],
                "dieselKwComparison": diesel_kw,
                "bracketSets":        req.bracketSets,
                "panelModel":         req.panelModel,
                "panelWatts":         panel.watts,
                "panelPricePerWp":    panel.price_usd_per_wp,
                "panelsPerSet":       bracket.panels_per_set,
                "batteryModel":       req.batteryPackModel,
                "batteryPackKwh":     bp.capacity_kwh,
                "annualLoadKwh":      annual_load,
                "voltageLevel":       req.voltageLevel,
                "emsMode":            req.emsControlMethod,
                "occupiedAreaM2":     sizes["occupied_area_m2"],
                "loadType":           req.loadType,
                "latitude":           req.latitude,
                "dieselModel":        dg.model if hasattr(dg, "model") else f"DG-{diesel_kw:.0f}kW",
            },
            "capex": {
                "pvModuleCost":        capex.pv_module_cost,
                "pvMountingCost":      capex.pv_mounting_cost,
                "energyStorageCost":   capex.energy_storage_cost,
                "dieselGeneratorCost": capex.diesel_generator_cost,
                "intlTransportCost":   capex.intl_transport_cost,
                "installationCost":    capex.installation_cost,
                "accessoryCost":       capex.accessory_cost,
                "otherInitialCost":    capex.other_initial_cost,
                "equipmentSubtotal":   capex.equipment_subtotal,
                "profitMargin":        capex.profit_margin,
                "profitAmount":        capex.profit_amount,
                "sellingPrice":        capex.selling_price,
            },
            "simulation": {
                "solarFractionPct":       sim_r["solar_fraction"],
                "lossOfLoadPct":          sim_r["loss_of_load_pct"],
                "curtailmentPct":         sim_r["curtailment_pct"],
                "mgDieselLiters":         sim_r["mg_diesel_liters"],
                "mgDieselHours":          sim_r["mg_diesel_hours"],
                "dieselOnlyLiters":       sim_r["diesel_only_liters"],
                "dieselRunHoursA":        sim_r["diesel_run_hours_a"],
                "annualFuelSavingLiters": sim_r["annual_fuel_saving_liters"],
                "annualFuelSavingUsd":    fuel_saving_usd,
            },
            "summary": {
                "projectName":            summary["project_name"],
                "analysisYears":          summary["analysis_years"],
                "annualLoadKwh":          summary["annual_load_kwh"],
                "sellingPriceUsd":        summary["selling_price_usd"],
                "totalCostUsd":           summary["total_cost_usd"],
                "profitAmountUsd":        summary["profit_amount_usd"],
                "mgAnnualOmUsd":          summary["microgrid_annual_om_usd"],
                "mgAnnualFuelUsd":        summary["mg_annual_fuel_usd"],
                "dieselAnnualFuelUsd":    summary["diesel_annual_fuel_usd"],
                "breakevenYear":          summary["breakeven_year"],
                "lcoeCrossoverYear":      summary["lcoe_crossover_year"],
                "finalMgLcoe":            summary["final_mg_lcoe"],
                "finalDieselLcoe":        summary["final_diesel_lcoe"],
                "finalCumulativeRevenue": summary["final_cumulative_revenue"],
            },
            "comparisonTable": comparison_table,
        }

    except Exception as exc:
        return {"success": False, "error": str(exc), "traceback": traceback.format_exc()}
