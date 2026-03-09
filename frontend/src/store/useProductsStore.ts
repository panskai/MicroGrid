/**
 * store/useProductsStore.ts — 产品目录状态（替代 ProductsContext）
 *
 * 用法：
 *   const { pvPanels, calcPvKw, isFromAPI } = useProductsStore();
 *
 * 不再需要 <ProductsProvider> 包裹，Zustand 自动初始化。
 */
import { create } from 'zustand';
import {
  PV_PANELS, BRACKET_SYSTEMS, BATTERY_PACKS, DIESEL_GENERATORS, INTEGRATED_SPECS,
  DEFAULT_PANEL_MODEL, DEFAULT_BRACKET_MODEL, DEFAULT_BATTERY_MODEL,
  type PVPanel, type BracketSystem, type BatteryPack, type IntegratedSpec,
} from '@/data/products';
import { fetchProducts } from '@/api/client';
import type { ProductsData } from '@/api/client';

// ── 兼容旧 ProductsContext 的 DieselGenerator 类型 ────────────
export interface DieselGenerator {
  model:       string;
  displayName: string;
  powerKw:     number;
  priceUsd:    number;
}

// ── 计算辅助函数类型 ──────────────────────────────────────────
export interface ProductsCatalog {
  pvPanels:          PVPanel[];
  bracketSystems:    BracketSystem[];
  batteryPacks:      BatteryPack[];
  dieselGenerators:  DieselGenerator[];
  integratedSpecs:   IntegratedSpec[];
  defaultPanelModel:   string;
  defaultBracketModel: string;
  defaultBatteryModel: string;
  isFromAPI: boolean;
  isLoading: boolean;

  getPanelByModel:          (model: string) => PVPanel;
  getBracketByModel:        (model: string) => BracketSystem;
  getBatteryByModel:        (model: string) => BatteryPack;
  calcPvKw:                 (sets: number, panelModel: string, bracketModel: string) => number;
  calcBatteryPacks:         (diesel: number, pv: number, days: number, packModel: string) => number;
  calcBatteryKwh:           (diesel: number, pv: number, days: number, packModel: string) => number;
  calcBatteryPacksFromLoad: (annualKwh: number, days: number, packModel: string, mode?: 'hybrid' | 'autonomous') => number;
  /** 触发数据初始化（在 App 挂载时调用一次） */
  init: () => void;
}

// ── 私有辅助：从产品列表构建纯函数工具集 ─────────────────────
function buildHelpers(panels: PVPanel[], brackets: BracketSystem[], batteries: BatteryPack[]) {
  const getPanelByModel   = (m: string) => panels.find(p => p.model === m)   ?? panels[0];
  const getBracketByModel = (m: string) => brackets.find(b => b.model === m) ?? brackets[0];
  const getBatteryByModel = (m: string) => batteries.find(b => b.model === m) ?? batteries[0];

  const calcPvKw = (sets: number, pm: string, bm: string) => {
    const p = getPanelByModel(pm);
    const b = getBracketByModel(bm);
    return +(sets * b.panelsPerSet * p.watts / 1000).toFixed(2);
  };

  const calcBatteryPacks = (diesel: number, pv: number, days: number, packModel: string) => {
    const pack   = getBatteryByModel(packModel);
    const target = pv > 0 ? pv * 3 * days : diesel * 4 * days;
    return Math.max(1, Math.ceil(target / pack.capacityKwh));
  };

  const calcBatteryKwh = (diesel: number, pv: number, days: number, packModel: string) => {
    const pack  = getBatteryByModel(packModel);
    return calcBatteryPacks(diesel, pv, days, packModel) * pack.capacityKwh;
  };

  const calcBatteryPacksFromLoad = (
    annualKwh: number, days: number, packModel: string, mode: 'hybrid' | 'autonomous' = 'hybrid',
  ) => {
    const pack   = getBatteryByModel(packModel);
    const daily  = annualKwh / 365;
    const factor = mode === 'autonomous' ? 1.0 : 0.5;
    const target = daily * factor * days / 0.9;
    return Math.max(1, Math.ceil(target / pack.capacityKwh));
  };

  return { getPanelByModel, getBracketByModel, getBatteryByModel,
           calcPvKw, calcBatteryPacks, calcBatteryKwh, calcBatteryPacksFromLoad };
}

// ── 私有辅助：解析后端 API JSON ───────────────────────────────
function parseAPIData(data: ProductsData) {
  const pvPanels: PVPanel[] = Object.entries(data.pv_panels.models).map(
    ([model, spec]) => ({
      model,
      displayName:   spec.display_name,
      watts:         spec.watts,
      pricePerWp:    spec.price_usd_per_wp,
      efficiencyPct: spec.efficiency_pct,
      kwPerSet:      (n = 32) => +(n * spec.watts / 1000).toFixed(2),
    })
  );
  const bracketSystems: BracketSystem[] = Object.entries(data.bracket_systems.models).map(
    ([model, spec]) => ({ model, displayName: spec.display_name, panelsPerSet: spec.panels_per_set, areaM2: spec.area_m2 })
  );
  const batteryPacks: BatteryPack[] = Object.entries(data.battery_packs.models).map(
    ([model, spec]) => ({ model, displayName: spec.display_name, capacityKwh: spec.capacity_kwh, priceUsd: spec.price_usd, cycleLife: spec.cycle_life })
  );
  const dieselGenerators: DieselGenerator[] = Object.entries(data.diesel_generators.models).map(
    ([model, spec]) => ({ model, displayName: spec.display_name, powerKw: spec.power_kw, priceUsd: spec.price_usd })
  );
  const integratedSpecs: IntegratedSpec[] = Object.entries(data.integrated_pv_storage.models).map(
    ([size, spec]) => ({ size, displayName: spec.display_name, pvKw: spec.pv_kw, batteryKwh: spec.battery_kwh })
  );
  return {
    pvPanels, bracketSystems, batteryPacks, dieselGenerators, integratedSpecs,
    defaultPanelModel:   data.pv_panels.default_model,
    defaultBracketModel: data.bracket_systems.default_model,
    defaultBatteryModel: data.battery_packs.default_model,
  };
}

const staticHelpers = buildHelpers(PV_PANELS, BRACKET_SYSTEMS, BATTERY_PACKS);

export const useProductsStore = create<ProductsCatalog>((set) => ({
  pvPanels:           PV_PANELS,
  bracketSystems:     BRACKET_SYSTEMS,
  batteryPacks:       BATTERY_PACKS,
  dieselGenerators:   DIESEL_GENERATORS,
  integratedSpecs:    INTEGRATED_SPECS,
  defaultPanelModel:  DEFAULT_PANEL_MODEL,
  defaultBracketModel: DEFAULT_BRACKET_MODEL,
  defaultBatteryModel: DEFAULT_BATTERY_MODEL,
  isFromAPI: false,
  isLoading: true,
  ...staticHelpers,

  init: () => {
    fetchProducts()
      .then((data: ProductsData) => {
        const parsed  = parseAPIData(data);
        const helpers = buildHelpers(parsed.pvPanels, parsed.bracketSystems, parsed.batteryPacks);
        set({ ...parsed, isFromAPI: true, isLoading: false, ...helpers });
      })
      .catch(() => {
        set({ isLoading: false });
      });
  },
}));

/** 向后兼容 hook（原 useProducts() 无需改动） */
export const useProducts = () => useProductsStore();
