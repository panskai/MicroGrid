/**
 * configToTopology.ts — 将 ConfigData 转换为 MicrogridTopology 所需数据
 * 支持已知负载与 DIY 两种场景，设备随配置动态显示与更新
 */
import type { ConfigData } from '@/types/index';
import type { TopologyData } from '@/components/pages/MicrogridTopology';
import { calcPvKw, getBracketByModel, getBatteryByModel } from '@/data/products';
import { formatAreaDual } from '@/utils/unitFormat';

export interface TopologyVisibility {
  pv: boolean;
  load: boolean;
  ess: boolean;
  diesel: boolean;
}

export function configToTopologyData(config: ConfigData, lang: 'zh' | 'en' = 'en'): {
  data: Partial<TopologyData>;
  visibility: TopologyVisibility;
  /** 已知负载：PV 卡片始终显示 4 项（最大光伏容量、最大支架套数、组件型号、最大占地面积），未选显示 — */
  pvFullFields?: boolean;
} {
  const scenario = config.scenario;
  const visibility: TopologyVisibility = {
    pv: false,
    load: false,
    ess: false,
    diesel: false,
  };

  const data: Partial<TopologyData> = {};

  // ── PV ─────────────────────────────────────────────────────
  const bracket = getBracketByModel(config.bracketModel ?? 'standard_32');
  const pvCapacityKw = (config as any).pvCapacityKw ?? 0;
  const maxSetsFromArea = (config.availableAreaM2 ?? 0) > 0 ? Math.floor(config.availableAreaM2 / bracket.areaM2) : 0;
  const hasPv = config.bracketSets > 0 || pvCapacityKw > 0 || maxSetsFromArea > 0;
  const hasPanelModel = !!config.panelModel;
  const isKnownLoad = scenario === 'known-load';
  const isDIY = scenario === 'diy';

  // 已知负载 / DIY：PV 入口即显示；并随右侧配置更新
  visibility.pv = isKnownLoad || isDIY || hasPv || hasPanelModel;

  if (isKnownLoad) {
    const sets = config.bracketSets > 0 ? config.bracketSets : maxSetsFromArea;
    const pvKw = config.bracketSets > 0 || maxSetsFromArea > 0
      ? calcPvKw(Math.max(sets, 1), config.panelModel ?? '655W', config.bracketModel ?? 'standard_32')
      : pvCapacityKw;
    const areaM2 = sets > 0 ? sets * bracket.areaM2 : 0;

    data.pv = {
      title: 'PV',
      capacity: { name: 'Max PV Capacity', value: pvKw > 0 ? pvKw.toFixed(1) : '—', unit: pvKw > 0 ? 'kW' : '' },
      sets: { name: 'Max Bracket Sets', value: sets > 0 ? sets : '—', unit: sets > 0 ? 'sets' : '' },
      panelModel: config.panelModel ?? '—',
      areaM2: areaM2 || 0,
    };
  } else if (hasPv || hasPanelModel) {
    const sets = config.bracketSets > 0 ? config.bracketSets : maxSetsFromArea;
    const pvKw = config.bracketSets > 0 || maxSetsFromArea > 0
      ? calcPvKw(Math.max(sets, 1), config.panelModel ?? '655W', config.bracketModel ?? 'standard_32')
      : pvCapacityKw;
    const areaM2 = sets > 0 ? sets * bracket.areaM2 : 0;

    data.pv = {
      title: 'PV',
      capacity: { name: 'Max PV Capacity', value: pvKw > 0 ? pvKw.toFixed(1) : '—', unit: pvKw > 0 ? 'kW' : '' },
      sets: sets > 0 ? { name: 'Max Bracket Sets', value: sets, unit: 'sets' } : undefined,
      panelModel: config.panelModel ?? '655Wp',
      areaM2: areaM2 || undefined,
    };
  } else {
    data.pv = {
      title: 'PV',
      capacity: { name: 'PV Capacity', value: '—', unit: '' },
    };
  }

  const pvFullFields = isKnownLoad;

  // ── Load ────────────────────────────────────────────────────
  visibility.load = true; // Load 常显，无数据时显示 —
  const annualKwh = config.annualLoadKwh ?? 0;
  const loadTypeKey = config.loadType ?? 'residential';
  const peakKw = (config as any).peakLoadKw ?? (config as any).totalInverterKw ?? (annualKwh > 0 ? Math.round(annualKwh / 365 / 6) : 0);

  data.load = {
    title: 'Load',
    annualKwh: {
      name: 'Annual Load',
      value: annualKwh > 0 ? annualKwh.toLocaleString() : '—',
      unit: annualKwh > 0 ? 'kWh' : '',
    },
    loadType: loadTypeKey,
    peakKw: peakKw > 0 ? peakKw : undefined,
  };

  // ── ESS ────────────────────────────────────────────────────
  visibility.ess = true; // ESS 中心常显
  const pack = getBatteryByModel(config.batteryPackModel ?? 'LFP-16kWh');
  const packCount = (config as any).batteryPackCount ?? 0;
  const bracketForEss = getBracketByModel(config.bracketModel ?? 'standard_32');
  const maxSetsFromAreaForEss = (config.availableAreaM2 ?? 0) > 0 ? Math.floor(config.availableAreaM2 / bracketForEss.areaM2) : 0;
  const setsForEss = config.bracketSets > 0 ? config.bracketSets : maxSetsFromAreaForEss;
  const pvKwForEss = (config as any).pvCapacityKw ?? (setsForEss > 0 ? calcPvKw(setsForEss, config.panelModel ?? '655W', config.bracketModel ?? 'standard_32') : 0);
  const capacityKwh = (config as any).batteryCapacityKwh ?? (config.storageDays && config.storageDays > 0 && pvKwForEss > 0
    ? Math.ceil((pvKwForEss * 3 * config.storageDays) / pack.capacityKwh) * pack.capacityKwh
    : packCount > 0 ? packCount * pack.capacityKwh : 0);
  const storageDays = config.storageDays ?? (packCount > 0 ? 1 : null);

  data.ess = {
    title: 'ESS',
    capacity: { name: 'Battery Capacity', value: capacityKwh > 0 ? Math.round(capacityKwh) : '—', unit: capacityKwh > 0 ? 'kWh' : '' },
    storageDays: { name: 'Storage Days', value: storageDays ?? '—', unit: storageDays ? 'day' : '' },
    packModel: config.batteryPackModel || '—',
  };

  // ── Diesel ──────────────────────────────────────────────────
  visibility.diesel = config.hasGenerator;
  if (config.hasGenerator) {
    data.diesel = {
      title: 'Diesel',
      capacity: { name: 'Generator Capacity', value: config.dieselCapacityKw ?? 40, unit: 'kW' },
      isNew: config.dieselIsNew ?? false,
    };
  } else {
    data.diesel = {
      title: 'Diesel',
      capacity: { name: 'Generator Capacity', value: '—', unit: '' },
    };
  }

  // ── DIY: 设备卡片字段与右侧步骤选项逐项对应 ─────────────────────
  if (isDIY) {
    const voltage = config.voltageLevel ?? '—';
    const currentA = config.requiredCurrent ?? 0;
    const isThreePhase = voltage === '120V/208V' || voltage === '277V/480V';
    const ratedVoltage = voltage === '120V/240V' ? 240 : voltage === '120V/208V' ? 208 : voltage === '277V/480V' ? 480 : 0;
    const estimatedLoadKw = (ratedVoltage > 0 && currentA > 0)
      ? +((((isThreePhase ? Math.sqrt(3) : 1) * ratedVoltage * currentA) / 1000) * 0.9).toFixed(1)
      : 0;

    const trayCount = (config as any).trayCount ?? 0;
    const packCount = (config as any).batteryPackCount ?? 0;
    const batteryCapacity = (config as any).batteryCapacityKwh ?? 0;
    const dieselMaxVoltageV = (config as any).dieselMaxVoltageV ?? 0;
    const dieselMaxCurrentA = (config as any).dieselMaxCurrentA ?? 0;
    const dieselMaxPowerKw = (config as any).dieselMaxPowerKw ?? 0;
    const tr = (zh: string, en: string) => (lang === 'zh' ? zh : en);
    const dieselStatus = config.dieselIsNew ? tr('新购', 'New') : tr('已有', 'Existing');

    const pvEstimatedArea = (config.bracketSets > 0 ? config.bracketSets : 0) * bracket.areaM2;
    data.pv = {
      ...(data.pv ?? { title: 'PV', capacity: { name: 'Max PV Capacity', value: '—', unit: '' } }),
      customItems: [
        { name: tr('光伏容量', 'PV Capacity'), value: pvCapacityKw > 0 ? pvCapacityKw.toFixed(1) : '—', unit: pvCapacityKw > 0 ? 'kW' : '' },
        { name: tr('支架套数', 'Bracket Sets'), value: config.bracketSets > 0 ? config.bracketSets : '—', unit: config.bracketSets > 0 ? tr('套', 'sets') : '' },
        { name: tr('组件型号', 'Panel Model'), value: config.panelModel ?? '—', unit: '' },
        { name: tr('预计占地面积', 'Estimated PV Area'), value: formatAreaDual(pvEstimatedArea, lang).combined, unit: '' },
      ],
    };

    data.load = {
      ...(data.load ?? { title: 'Load', annualKwh: { name: 'Annual Load', value: '—', unit: '' } }),
      customItems: [
        { name: tr('电压等级', 'Voltage Level'), value: voltage, unit: '' },
        { name: tr('最大负载电流', 'Max Load Current'), value: currentA > 0 ? currentA : '—', unit: currentA > 0 ? 'A' : '' },
        { name: tr('估算负载功率', 'Estimated Load'), value: estimatedLoadKw > 0 ? estimatedLoadKw : '—', unit: estimatedLoadKw > 0 ? 'kW' : '' },
      ],
    };

    data.ess = {
      ...(data.ess ?? { title: 'ESS', capacity: { name: 'Battery Capacity', value: '—', unit: '' } }),
      customItems: [
        { name: tr('托盘数量', 'Tray Count'), value: trayCount > 0 ? trayCount : '—', unit: trayCount > 0 ? tr('个', 'tray') : '' },
        { name: tr('电池包型号', 'Pack Model'), value: config.batteryPackModel ?? '—', unit: '' },
        { name: tr('电池包数量', 'Pack Count'), value: packCount > 0 ? packCount : '—', unit: packCount > 0 ? tr('个', 'pack') : '' },
        { name: tr('储能容量', 'Battery Capacity'), value: batteryCapacity > 0 ? Math.round(batteryCapacity) : '—', unit: batteryCapacity > 0 ? 'kWh' : '' },
      ],
    };

    if (config.hasGenerator) {
      data.diesel = {
        ...(data.diesel ?? { title: 'Diesel', capacity: { name: 'Generator Capacity', value: '—', unit: '' } }),
        customItems: [
          { name: tr('发电机容量', 'Generator Capacity'), value: config.dieselCapacityKw ?? '—', unit: config.dieselCapacityKw ? 'kW' : '' },
          { name: tr('最大电压', 'Max Voltage'), value: dieselMaxVoltageV > 0 ? dieselMaxVoltageV : '—', unit: dieselMaxVoltageV > 0 ? 'V' : '' },
          { name: tr('最大电流', 'Max Current'), value: dieselMaxCurrentA > 0 ? dieselMaxCurrentA : '—', unit: dieselMaxCurrentA > 0 ? 'A' : '' },
          { name: tr('负载功率', 'Load Power'), value: dieselMaxPowerKw > 0 ? dieselMaxPowerKw.toFixed(1) : '—', unit: dieselMaxPowerKw > 0 ? 'kW' : '' },
          { name: tr('状态', 'Status'), value: dieselStatus, unit: '' },
        ],
      };
    }
  }

  return { data, visibility, pvFullFields };
}
