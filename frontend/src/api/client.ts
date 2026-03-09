/**
 * client.ts — 微电网 API 客户端
 * 调用后端 api.py（FastAPI）进行计算
 */

import type { ConfigData, CalculateResponse, OptimizeRequest, OptimizeResponse } from '@/types/index';

// API 基础地址（通过 vite.config.ts proxy 转发）
const API_BASE = '/api';

// ─────────────────────────────────────────────────────────────
// 产品目录类型（来自 products.yaml）
// ─────────────────────────────────────────────────────────────
export interface ProductsData {
  pv_panels: {
    default_model: string;
    models: Record<string, {
      display_name: string;
      watts: number;
      price_usd_per_wp: number;
      efficiency_pct: number;
    }>;
  };
  bracket_systems: {
    default_model: string;
    models: Record<string, {
      display_name: string;
      panels_per_set: number;
      area_m2: number;
    }>;
  };
  battery_packs: {
    default_model: string;
    models: Record<string, {
      display_name: string;
      capacity_kwh: number;
      price_usd: number;
      cycle_life: number;
    }>;
  };
  inverters: {
    models: Record<string, {
      display_name: string;
      power_kw: number;
      price_usd: number;
      voltage_levels: string[];
    }>;
    voltage_default_map: Record<string, string>;
  };
  diesel_generators: {
    price_usd_per_kw: number;
    models: Record<string, {
      display_name: string;
      power_kw: number;
      price_usd: number;
    }>;
  };
  integrated_pv_storage: {
    models: Record<string, {
      display_name: string;
      pv_kw: number;
      battery_kwh: number;
      battery_kw: number;
    }>;
  };
}

// ─────────────────────────────────────────────────────────────
// 将 ConfigData 映射为 API 请求体
// ─────────────────────────────────────────────────────────────
function configToRequest(config: ConfigData): Record<string, unknown> {
  return {
    scenario:           config.scenario,
    bracketSets:        config.bracketSets,
    panelModel:         config.panelModel   || '655W',
    bracketModel:       config.bracketModel  || 'standard_32',
    batteryPackModel:   config.batteryPackModel || 'LFP-10kWh',
    hasGenerator:       config.hasGenerator,
    dieselCapacityKw:   config.dieselCapacityKw || 0,
    dieselIsNew:        config.dieselIsNew ?? false,
    voltageLevel:       config.voltageLevel ?? '120V/240V',
    storageDays:        config.storageDays,
    emsControlMethod:   config.emsControlMethod,
    annualLoadKwh:      config.annualLoadKwh   || null,
    loadType:           config.loadType        || 'residential',
    trayCapacity:       config.trayCapacity    || null,
    requiredCurrent:    config.requiredCurrent || null,
    inverterCount:      config.inverterCount   || null,
    electricityPriceUsd:config.electricityPriceUsd || 0.35,
    dieselPriceUsd:     config.dieselPriceUsd  || 0.95,
    latitude:           config.latitude        || 25.0,
    year:               2020,
  };
}

// ─────────────────────────────────────────────────────────────
// API 调用函数
// ─────────────────────────────────────────────────────────────

/** 获取产品目录 */
export async function fetchProducts(): Promise<ProductsData> {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error(`获取产品目录失败: ${res.status}`);
  return res.json();
}

/** 快速计算（不运行 PyPSA，< 0.5 秒） */
export async function calculateQuick(config: ConfigData): Promise<CalculateResponse> {
  const body = configToRequest(config);
  const res = await fetch(`${API_BASE}/calculate?simulate=false`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`计算请求失败: ${res.status}`);
  return res.json();
}

/** 完整仿真计算（运行 PyPSA，约 15-30 秒） */
export async function calculateFull(config: ConfigData): Promise<CalculateResponse> {
  const body = configToRequest(config);
  const res = await fetch(`${API_BASE}/calculate?simulate=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`完整仿真请求失败: ${res.status}`);
  return res.json();
}

/** 自动定容优化（给定年负荷 + 可选约束，返回推荐方案列表） */
export async function optimizeMicrogrid(req: OptimizeRequest): Promise<OptimizeResponse> {
  // 清理 null/undefined，避免后端解析歧义
  const body: Record<string, unknown> = { ...req };
  if (body.availableAreaM2  == null) delete body.availableAreaM2;
  if (body.existingDieselKw == null) delete body.existingDieselKw;
  const res = await fetch(`${API_BASE}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`优化请求失败: ${res.status}`);
  return res.json();
}

/** 健康检查 */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** 根据经纬度获取日照估算数据 */
export async function fetchSolarHours(lat: number, lon: number): Promise<{
  success: boolean;
  peak_sun_hours_per_day: number;
  annual_kwh_per_m2: number;
  annual_eff_hours: number;
  climate_zone: string;
  note: string;
}> {
  const res = await fetch(`${API_BASE}/solar-hours?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error(`日照数据请求失败: ${res.status}`);
  return res.json();
}
