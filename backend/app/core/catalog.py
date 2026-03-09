"""
core/catalog.py — products.yaml 单例加载器
"""
from __future__ import annotations
import sys
from pathlib import Path
from functools import lru_cache

# 确保 services/ 在 path 中（config_loader 在那里）
_SERVICES = Path(__file__).resolve().parents[1] / "services"
if str(_SERVICES) not in sys.path:
    sys.path.insert(0, str(_SERVICES))

from config_loader import get_catalog as _get_catalog  # type: ignore


@lru_cache(maxsize=1)
def get_catalog():
    """返回产品目录单例（首次调用时从 products.yaml 加载）。"""
    from app.core.config import PRODUCTS_YAML
    # 直接传入绝对路径，避免依赖 CWD
    return _get_catalog(str(PRODUCTS_YAML))
