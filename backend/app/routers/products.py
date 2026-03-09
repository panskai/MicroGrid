"""
routers/products.py — GET /api/products  &  GET /api/solar-hours  &  GET /api/health
"""
from __future__ import annotations
import math
from pathlib import Path
import yaml
from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["products"])

_BACKEND_DIR = Path(__file__).resolve().parents[2]   # backend/
_PRODUCTS_YAML = _BACKEND_DIR / "products.yaml"


@router.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


@router.get("/products")
def get_products():
    """返回 products.yaml 中的产品目录（JSON 格式）。"""
    with open(_PRODUCTS_YAML, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data


@router.get("/solar-hours")
def get_solar_hours(lat: float, lon: float = 0.0):
    """根据经纬度估算年均峰值日照时数（工程经验公式，误差 ±10%）。"""
    lat_rad         = math.radians(abs(lat))
    psh_day         = max(2.5, 5.8 * math.cos(lat_rad) ** 0.5)
    psh_day_tilted  = round(psh_day * 1.08, 2)
    annual_kwh_m2   = round(psh_day_tilted * 365, 0)
    annual_eff_hours = round(psh_day_tilted * 365 * 0.75)

    if   abs(lat) <= 23.5: zone = "Tropical (abundant sunshine)"
    elif abs(lat) <= 35:   zone = "Subtropical / Arid (good sunshine)"
    elif abs(lat) <= 50:   zone = "Temperate (moderate sunshine)"
    else:                  zone = "High-latitude (limited sunshine)"

    return {
        "success":                True,
        "latitude":               lat,
        "longitude":              lon,
        "peak_sun_hours_per_day": psh_day_tilted,
        "annual_kwh_per_m2":      annual_kwh_m2,
        "annual_eff_hours":       annual_eff_hours,
        "climate_zone":           zone,
        "note":                   "Engineering estimate based on latitude. Suitable for early-stage project assessment.",
    }
