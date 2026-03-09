"""
main.py — FastAPI 应用入口
"""
from __future__ import annotations
import sys
from pathlib import Path

# 确保 backend/ 根目录、app/ 自身及 services/ 在 path 中
_APP      = Path(__file__).resolve().parent          # .../backend/app
_BACKEND  = _APP.parent                              # .../backend
_SRVS     = _APP / "services"
for _p in (_BACKEND, _APP, _SRVS):
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.core import config as cfg
from app.routers import products, calculate, optimize, report

app = FastAPI(
    title       = "Microgrid Advisor API",
    description = "VoltageEnergy™ Off-Grid Microgrid Economic Analysis",
    version     = "2.0.0",
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = cfg.CORS_ORIGINS,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── 注册路由 ──────────────────────────────────────────────────
app.include_router(products.router)
app.include_router(calculate.router)
app.include_router(optimize.router)
app.include_router(report.router)


if __name__ == "__main__":
    print("Starting Microgrid Advisor API...")
    print(f"  Docs: http://localhost:{cfg.API_PORT}/docs")
    uvicorn.run(
        "app.main:app",
        host       = cfg.API_HOST,
        port       = cfg.API_PORT,
        reload     = cfg.DEBUG,
        reload_dirs= [str(_BACKEND)],
        app_dir    = str(_BACKEND),
    )
