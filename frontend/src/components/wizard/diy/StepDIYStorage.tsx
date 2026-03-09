/**
 * StepDIYStorage.tsx — DIY流程 Step 5: 电池包选型 & 储能容量确定
 *
 * 核心约束：
 *   - 每个一体化托盘最多放 16 个电池包
 *   - 最大电池包数 = trayCount × 16
 *
 * 用户操作：
 *   1. 选择电池包型号（影响单包容量）
 *   2. 系统显示当前托盘允许的最大包数
 *   3. 用户选择实际需要的电池包数量（快速按钮 + 自定义输入）
 *   4. 系统实时计算总储能容量
 */
import { useState } from 'react';
import type { ConfigData } from '@/types/index';
import { useProducts } from '@/context/ProductsContext';
import { useLang } from '@/context/LangContext';

interface StepDIYStorageProps {
  trayCount?: number;             // 来自 Step4，决定最大电池包数
  batteryPackModel?: string;      // 当前选中电池包型号
  batteryPackCount?: number;      // 当前选中电池包数量
  totalInverterKw?: number;       // 参考逆变器总功率（用于推荐）
  onUpdate: (data: Partial<ConfigData>) => void;
}

const MAX_PACKS_PER_TRAY = 16;

export default function StepDIYStorage({
  trayCount = 1,
  batteryPackModel,
  batteryPackCount,
  totalInverterKw = 0,
  onUpdate,
}: StepDIYStorageProps) {
  const { lang } = useLang();
  const { batteryPacks, getBatteryByModel } = useProducts();

  const maxPacks = trayCount * MAX_PACKS_PER_TRAY;
  const currentModel = batteryPackModel ?? 'LFP-16kWh';
  const currentPack = getBatteryByModel(currentModel);

  const [selectedCount, setSelectedCount] = useState<number>(
    batteryPackCount ?? Math.min(1, maxPacks)
  );

  // Recommend packs: totalInverterKw × 4h / DoD / packKwh (rough guide)
  const recommendedPacks = currentPack && currentPack.capacityKwh > 0 && totalInverterKw > 0
    ? Math.min(maxPacks, Math.max(1, Math.ceil((totalInverterKw * 4) / 0.9 / currentPack.capacityKwh)))
    : 1;

  const handleModelChange = (model: string) => {
    onUpdate({
      batteryPackModel:   model,
      batteryPackCount:   selectedCount,
      batteryCapacityKwh: selectedCount * getBatteryByModel(model).capacityKwh,
    } as any);
  };

  const handleCountChange = (count: number) => {
    const clamped = Math.max(1, Math.min(count, maxPacks));
    setSelectedCount(clamped);
    onUpdate({
      batteryPackCount:   clamped,
      batteryCapacityKwh: clamped * currentPack.capacityKwh,
    } as any);
  };

  const totalKwh = selectedCount * currentPack.capacityKwh;

  // Build count option buttons
  const countOptions: number[] = [];
  if (maxPacks <= 20) {
    for (let i = 1; i <= maxPacks; i++) countOptions.push(i);
  } else {
    const set = new Set<number>([1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, maxPacks]);
    for (let i = 1; i <= maxPacks; i += 4) set.add(i);
    set.add(recommendedPacks);
    countOptions.push(...Array.from(set).filter(n => n >= 1 && n <= maxPacks).sort((a, b) => a - b));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── 托盘约束说明 ── */}
      <div style={{
        padding: '0.85rem 1.1rem',
        background: '#f3e8ff',
        borderLeft: '4px solid #805ad5',
        borderRadius: '8px',
        fontSize: '0.86rem',
        color: '#44337a',
        lineHeight: 1.7,
      }}>
        <strong>{lang === 'en' ? 'Tray constraint: ' : '托盘约束：'}</strong>
        {lang === 'en'
          ? `You have ${trayCount} integrated tray(s). Each tray supports up to ${MAX_PACKS_PER_TRAY} battery packs. Maximum: ${maxPacks} packs total.`
          : `当前共 ${trayCount} 个一体化托盘，每个托盘最多放 ${MAX_PACKS_PER_TRAY} 个电池包，合计最多可选 ${maxPacks} 个。`}
      </div>

      {/* ── 电池包型号选择 ── */}
      <div>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.6rem', fontSize: '0.93rem' }}>
          {lang === 'en' ? '① Select Battery Pack Model' : '① 选择电池包型号'}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '0.65rem',
        }}>
          {batteryPacks.map(pack => {
            const isSelected = currentModel === pack.model;
            const maxKwh = maxPacks * pack.capacityKwh;
            return (
              <div
                key={pack.model}
                onClick={() => handleModelChange(pack.model)}
                style={{
                  padding: '0.9rem 0.85rem',
                  border: `2px solid ${isSelected ? '#805ad5' : '#e2e8f0'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: isSelected ? '#f3e8ff' : 'white',
                  transition: 'all 0.18s',
                }}
              >
                <div style={{ fontWeight: 800, color: '#1a365d', fontSize: '1.05rem' }}>
                  {pack.capacityKwh} kWh
                </div>
                <div style={{ fontSize: '0.7rem', color: '#718096', marginTop: '0.15rem', lineHeight: 1.4 }}>
                  {pack.displayName}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#805ad5', fontWeight: 600, marginTop: '0.3rem' }}>
                  {lang === 'en' ? `Max: ${maxKwh} kWh` : `最大：${maxKwh} kWh`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 电池包数量选择 ── */}
      <div>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.6rem', fontSize: '0.93rem' }}>
          {lang === 'en'
            ? `② Select number of packs (1–${maxPacks}):`
            : `② 选择电池包数量（1–${maxPacks} 个）：`}
        </div>

        {/* 快速选择按钮 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {countOptions.map(n => {
            const isSelected = n === selectedCount;
            const isRecommended = n === recommendedPacks;
            return (
              <button
                key={n}
                onClick={() => handleCountChange(n)}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.9rem',
                  fontWeight: isSelected ? 700 : 400,
                  border: `2px solid ${isSelected ? '#805ad5' : isRecommended ? '#9ae6b4' : '#e2e8f0'}`,
                  borderRadius: '20px',
                  cursor: 'pointer',
                  background: isSelected ? '#805ad5' : isRecommended ? '#f0fff4' : 'white',
                  color: isSelected ? 'white' : '#4a5568',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {n}
                {isRecommended && !isSelected && (
                  <span style={{
                    position: 'absolute', top: '-8px', right: '-6px',
                    fontSize: '0.55rem', background: '#38a169', color: 'white',
                    borderRadius: '6px', padding: '0.05rem 0.3rem', fontWeight: 700,
                  }}>
                    {lang === 'en' ? 'rec' : '荐'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 手动数字输入 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.88rem', color: '#718096' }}>
            {lang === 'en' ? 'Custom: ' : '自定义：'}
          </span>
          <input
            type="number"
            value={selectedCount}
            min={1}
            max={maxPacks}
            step={1}
            onChange={e => handleCountChange(parseInt(e.target.value, 10) || 1)}
            style={{
              padding: '0.45rem 0.8rem',
              border: '1px solid #cbd5e0',
              borderRadius: '8px',
              fontSize: '0.9rem',
              width: '90px',
            }}
          />
          <span style={{ fontSize: '0.88rem', color: '#718096' }}>
            {lang === 'en' ? `packs (max ${maxPacks})` : `个（最多 ${maxPacks} 个）`}
          </span>
        </div>
      </div>

      {/* ── 最终结果汇总 ── */}
      <div style={{
        padding: '1rem 1.25rem',
        background: '#f0fff4',
        border: '1px solid #9ae6b4',
        borderLeft: '4px solid #38a169',
        borderRadius: '10px',
      }}>
        <div style={{ fontWeight: 700, color: '#2d3748', marginBottom: '0.75rem' }}>
          {lang === 'en' ? 'Storage Configuration' : '储能配置结果'}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '0.65rem',
        }}>
          {[
            {
              label: lang === 'en' ? 'Trays' : '托盘数',
              value: `${trayCount}`,
              unit: lang === 'en' ? 'trays' : '个',
              color: '#6b46c1',
            },
            {
              label: lang === 'en' ? 'Pack Capacity' : '单包容量',
              value: `${currentPack.capacityKwh} kWh`,
              unit: `/${lang === 'en' ? 'pack' : '包'}`,
              color: '#1a365d',
            },
            {
              label: lang === 'en' ? 'Pack Count' : '电池包数量',
              value: `${selectedCount}`,
              unit: lang === 'en' ? 'packs' : '个',
              color: '#276749',
            },
            {
              label: lang === 'en' ? 'Total Storage' : '总储能容量',
              value: `${totalKwh}`,
              unit: 'kWh',
              color: '#22543d',
            },
          ].map(m => (
            <div key={m.label} style={{
              textAlign: 'center', background: 'white',
              borderRadius: '8px', padding: '0.6rem',
            }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: m.color }}>
                {m.value}
                <span style={{ fontSize: '0.75rem', fontWeight: 400 }}> {m.unit}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#718096' }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Utilization info */}
        <div style={{
          marginTop: '0.85rem', fontSize: '0.81rem', color: '#4a5568',
          padding: '0.5rem 0.75rem', background: '#f7fafc',
          borderRadius: '6px', lineHeight: 1.6,
        }}>
          {lang === 'en'
            ? `Tray utilization: ${selectedCount}/${maxPacks} packs (${((selectedCount / maxPacks) * 100).toFixed(0)}%). ${maxPacks - selectedCount > 0 ? `${maxPacks - selectedCount} slot(s) remaining for future expansion.` : 'Fully utilized.'}`
            : `托盘使用率：${selectedCount}/${maxPacks} 包（${((selectedCount / maxPacks) * 100).toFixed(0)}%）。${maxPacks - selectedCount > 0 ? `剩余 ${maxPacks - selectedCount} 个插槽可用于未来扩容。` : '托盘已满配。'}`}
        </div>
      </div>

    </div>
  );
}
