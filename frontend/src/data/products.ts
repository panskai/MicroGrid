/**
 * products.ts — 静态产品目录数据
 * 与 products.yaml 保持同步，用于 UI 选择器即时渲染（无需 API 调用）。
 * 若后端在线，可通过 fetchProducts() 获取最新数据覆盖此文件。
 */

export interface PVPanel {
  model: string;
  displayName: string;
  watts: number;
  pricePerWp: number;    // USD/Wp
  efficiencyPct: number;
  /** 每套标准支架(32块) 的总功率 kW */
  kwPerSet: (panelsPerSet?: number) => number;
}

export interface BracketSystem {
  model: string;
  displayName: string;
  panelsPerSet: number;
  areaM2: number;
}

export interface BatteryPack {
  model: string;
  displayName: string;
  capacityKwh: number;
  priceUsd: number;
  cycleLife: number;
}

export interface IntegratedSpec {
  size: string;
  displayName: string;
  pvKw: number;
  batteryKwh: number;
}

// ─────────────────────────────────────────────────────────────
// 光伏组件
// ─────────────────────────────────────────────────────────────
export const PV_PANELS: PVPanel[] = [
  {
    model: '710W',
    displayName: '710Wp Ultra-High Eff. TOPCon N-type',
    watts: 710,
    pricePerWp: 0.36,
    efficiencyPct: 22.8,
    kwPerSet: (n = 32) => +(n * 0.710).toFixed(2),
  },
  {
    model: '655W',
    displayName: '655Wp High-Eff. Mono-Si PERC',
    watts: 655,
    pricePerWp: 0.32,
    efficiencyPct: 21.3,
    kwPerSet: (n = 32) => +(n * 0.655).toFixed(2),
  },
  {
    model: '600W',
    displayName: '600Wp Mono-Si Standard',
    watts: 600,
    pricePerWp: 0.30,
    efficiencyPct: 20.5,
    kwPerSet: (n = 32) => +(n * 0.600).toFixed(2),
  },
  {
    model: '550W',
    displayName: '550Wp Mono-Si',
    watts: 550,
    pricePerWp: 0.29,
    efficiencyPct: 20.0,
    kwPerSet: (n = 32) => +(n * 0.550).toFixed(2),
  },
];

export const DEFAULT_PANEL_MODEL = '655W';

// ─────────────────────────────────────────────────────────────
// 折叠支架
// ─────────────────────────────────────────────────────────────
export const BRACKET_SYSTEMS: BracketSystem[] = [
  { model: 'standard_32', displayName: 'Standard Folding Bracket (32 panels)', panelsPerSet: 32, areaM2: 260 },
  { model: 'large_48',    displayName: 'Large Folding Bracket (48 panels)',    panelsPerSet: 48, areaM2: 390 },
  { model: 'compact_24',  displayName: 'Compact Folding Bracket (24 panels)',  panelsPerSet: 24, areaM2: 200 },
];

export const DEFAULT_BRACKET_MODEL = 'standard_32';

// ─────────────────────────────────────────────────────────────
// 电池包（与 products.yaml 同步，优先由 API 实时覆盖）
// ─────────────────────────────────────────────────────────────
export const BATTERY_PACKS: BatteryPack[] = [
  { model: 'LFP-16kWh', displayName: 'LFP 16kWh Battery Pack (Standard)',      capacityKwh: 16,  priceUsd: 3100,  cycleLife: 6000 },
  { model: 'LFP-10kWh', displayName: 'LFP 10kWh Battery Pack',                 capacityKwh: 10,  priceUsd: 2500,  cycleLife: 4000 },
  { model: 'LFP-25kWh', displayName: 'LFP 25kWh Battery Pack (High Capacity)', capacityKwh: 25,  priceUsd: 7250,  cycleLife: 6000 },
  { model: 'LFP-20kWh', displayName: 'LFP 20kWh Battery Pack',                 capacityKwh: 20,  priceUsd: 6000,  cycleLife: 4000 },
  { model: 'LFP-30kWh', displayName: 'LFP 30kWh Battery Pack (Industrial)',    capacityKwh: 30,  priceUsd: 8400,  cycleLife: 6000 },
  { model: 'LFP-5kWh',  displayName: 'LFP 5kWh Battery Pack (Compact)',        capacityKwh: 5,   priceUsd: 1600,  cycleLife: 3500 },
  { model: 'LFP-40kWh', displayName: 'LFP 40kWh Battery Pack (Cabinet Large)', capacityKwh: 40,  priceUsd: 11200, cycleLife: 6000 },
];

export const DEFAULT_BATTERY_MODEL = 'LFP-16kWh';

// ─────────────────────────────────────────────────────────────
// 光储一体机规格
// ─────────────────────────────────────────────────────────────
export const INTEGRATED_SPECS: IntegratedSpec[] = [
  { size: 'small',  displayName: 'Small Integrated PV-Storage Unit',  pvKw: 5,  batteryKwh: 10  },
  { size: 'medium', displayName: 'Medium Integrated PV-Storage Unit', pvKw: 10, batteryKwh: 20  },
  { size: 'large',  displayName: 'Large Integrated PV-Storage Unit',  pvKw: 20, batteryKwh: 40  },
];

// ─────────────────────────────────────────────────────────────
// 柴油发电机型号列表（用于 UI 选择）
// ─────────────────────────────────────────────────────────────
export const DIESEL_GENERATORS = [
  { model: 'DG-20kW',  displayName: '20kW Diesel Generator Set',  powerKw: 20,  priceUsd: 22500  },
  { model: 'DG-40kW',  displayName: '40kW Diesel Generator Set',  powerKw: 40,  priceUsd: 45000  },
  { model: 'DG-60kW',  displayName: '60kW Diesel Generator Set',  powerKw: 60,  priceUsd: 67500  },
  { model: 'DG-100kW', displayName: '100kW Diesel Generator Set', powerKw: 100, priceUsd: 112500 },
];

// ─────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────

export function getPanelByModel(model: string): PVPanel {
  return PV_PANELS.find(p => p.model === model) ?? PV_PANELS[0];
}

export function getBracketByModel(model: string): BracketSystem {
  return BRACKET_SYSTEMS.find(b => b.model === model) ?? BRACKET_SYSTEMS[0];
}

export function getBatteryByModel(model: string): BatteryPack {
  return BATTERY_PACKS.find(b => b.model === model) ?? BATTERY_PACKS[0];
}

/** 计算折叠支架 × 组件 的 PV 总容量 (kW) */
export function calcPvKw(bracketSets: number, panelModel: string, bracketModel: string): number {
  const panel   = getPanelByModel(panelModel);
  const bracket = getBracketByModel(bracketModel);
  return +(bracketSets * bracket.panelsPerSet * panel.watts / 1000).toFixed(2);
}

/**
 * 估算电池包数量
 * 规则：PV装机(kW) × 3h × storageDays（与 Excel 参考案例对齐）
 * 参考（Excel案例）：4套655W(83.84kW) × 3h × 1天 = 251kWh
 *   ÷ 16kWh/包 = 16包（LFP-16kWh, $3,100/包 × 16 = $49,600）✓ → 5年回本 ✓
 * 无光伏（纯柴发）时退化为：柴发容量(kW) × 4h × storageDays
 */
export function calcBatteryPacks(
  dieselKw: number,
  pvKw: number,
  storageDays: number,
  batteryPackModel: string,
): number {
  const pack   = getBatteryByModel(batteryPackModel);
  // PV优先：PV×3h；无PV时用柴发×4h
  const target = pvKw > 0
    ? pvKw * 3 * storageDays
    : dieselKw * 4 * storageDays;
  return Math.max(1, Math.ceil(target / pack.capacityKwh));
}

/** 估算总电池容量 (kWh) */
export function calcBatteryKwh(
  dieselKw: number,
  pvKw: number,
  storageDays: number,
  batteryPackModel: string,
): number {
  const pack  = getBatteryByModel(batteryPackModel);
  const packs = calcBatteryPacks(dieselKw, pvKw, storageDays, batteryPackModel);
  return packs * pack.capacityKwh;
}

/**
 * 按负荷法估算电池包数量（适用于已知年用电量的场景）
 *
 * 两种模式：
 *  - 协同模式（有柴发/光伏兜底）：覆盖"日均负荷 × 50%"，适合夜间+峰值平滑
 *    → 与 Excel 案例 PV×3h 结果接近
 *  - 高自治模式（无兜底）：覆盖"日均负荷 × storageDays"，电池独立撑过整天
 *
 * @param annualLoadKwh  年用电量 (kWh)
 * @param storageDays    储能天数
 * @param batteryPackModel 电池包型号
 * @param mode  'hybrid'（协同，默认）| 'autonomous'（高自治）
 */
export function calcBatteryPacksFromLoad(
  annualLoadKwh: number,
  storageDays: number,
  batteryPackModel: string,
  mode: 'hybrid' | 'autonomous' = 'hybrid',
): number {
  const pack      = getBatteryByModel(batteryPackModel);
  const dailyLoad = annualLoadKwh / 365;
  const dod       = 0.9;  // 放电深度
  // 协同模式：只需覆盖日均负荷的一半（夜间+峰值缓冲），另一半靠光伏/柴发
  // 高自治模式：需覆盖完整 storageDays 的日负荷
  const factor  = mode === 'autonomous' ? 1.0 : 0.5;
  const target  = dailyLoad * factor * storageDays / dod;
  return Math.max(1, Math.ceil(target / pack.capacityKwh));
}
