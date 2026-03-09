/**
 * resultToTopology.ts — 将 CalculateResponse 转换为 MicrogridTopology 所需数据
 * 用于已知负载推荐方案的「产品示意图」tab
 */
import type { CalculateResponse } from '@/types/index';
import type { TopologyData } from '@/components/pages/MicrogridTopology';

export function resultToTopologyData(
  apiResult: CalculateResponse | null,
  config?: { panelModel?: string; loadType?: string; voltageLevel?: string; dieselPriceUsd?: number }
): Partial<TopologyData> {
  if (!apiResult?.systemConfig) return {};

  const sc = apiResult.systemConfig as Record<string, unknown>;
  const pvKw = typeof sc.pvCapacityKw === 'number' ? sc.pvCapacityKw : 0;
  const bracketSets = typeof sc.bracketSets === 'number' ? sc.bracketSets : 0;
  const areaM2 = typeof sc.occupiedAreaM2 === 'number' ? sc.occupiedAreaM2 : 0;
  const batteryKwh = typeof sc.batteryCapacityKwh === 'number' ? sc.batteryCapacityKwh : 0;
  const batteryPackCount = typeof sc.batteryPackCount === 'number' ? sc.batteryPackCount : 0;
  const batteryModel = sc.batteryModel as string | undefined;
  const dieselKw = typeof sc.dieselCapacityKw === 'number' ? sc.dieselCapacityKw : 0;
  const annualKwh = typeof sc.annualLoadKwh === 'number' ? sc.annualLoadKwh : 0;
  const loadType = (sc.loadType as string) || config?.loadType || 'industrial';

  return {
    pv: {
      title: 'PV',
      capacity: { name: 'Max PV Capacity', value: pvKw > 0 ? pvKw.toFixed(1) : '—', unit: pvKw > 0 ? 'kW' : '' },
      sets: bracketSets > 0 ? { name: 'Max Bracket Sets', value: bracketSets, unit: 'sets' } : undefined,
      panelModel: (sc.panelModel as string) || config?.panelModel || '655Wp',
      areaM2: areaM2 || undefined,
    },
    load: {
      title: 'Load',
      annualKwh: { name: 'Annual Load', value: annualKwh > 0 ? annualKwh.toLocaleString() : '—', unit: annualKwh > 0 ? 'kWh' : '' },
      loadType,
      peakKw: annualKwh > 0 ? Math.round(annualKwh / 365 / 6) : undefined,
    },
    ess: {
      title: 'ESS',
      capacity: { name: 'Battery Capacity', value: batteryKwh > 0 ? Math.round(batteryKwh) : '—', unit: batteryKwh > 0 ? 'kWh' : '' },
      storageDays: { name: 'Storage Days', value: batteryKwh > 0 ? 1 : '—', unit: batteryKwh > 0 ? 'day' : '' },
      packModel: batteryModel || '—',
    },
    diesel: dieselKw > 0
      ? {
          title: 'Diesel',
          capacity: { name: 'Generator Capacity', value: dieselKw, unit: 'kW' },
          isNew: (sc.dieselIsNew as boolean) ?? false,
        }
      : {
          title: 'Diesel',
          capacity: { name: 'Generator Capacity', value: '—', unit: '' },
        },
  };
}
