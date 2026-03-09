"""
core/config.py — 应用配置（从环境变量读取，含 .env 文件支持）
"""
from __future__ import annotations
import os
from pathlib import Path

# 项目根目录（backend/）
BASE_DIR = Path(__file__).resolve().parents[2]   # backend/
PRODUCTS_YAML = BASE_DIR / "products.yaml"

# ── 服务配置 ──────────────────────────────────────────────────
API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
API_PORT: int = int(os.getenv("API_PORT", "6001"))
DEBUG:    bool = os.getenv("DEBUG", "false").lower() == "true"

# ── CORS ─────────────────────────────────────────────────────
CORS_ORIGINS: list[str] = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:8081,http://localhost:5173,http://localhost:4173,http://localhost:3000"
).split(",")

# ── SMTP（可选，发送邮件报告）────────────────────────────────
SMTP_HOST: str = os.getenv("SMTP_HOST", "")
SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER: str = os.getenv("SMTP_USER", "")
SMTP_PASS: str = os.getenv("SMTP_PASS", "")
SMTP_FROM: str = os.getenv("SMTP_FROM", SMTP_USER)
