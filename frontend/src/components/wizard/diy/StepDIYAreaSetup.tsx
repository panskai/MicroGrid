/**
 * StepDIYAreaSetup.tsx — DIY流程 Step 2
 *
 * 场地面积输入 → 推算可安装支架套数 & PV 总容量
 * 附 PV 组件型号选择
 */
import { useState } from 'react';
import type { ConfigData } from '@/types/index';
import { useProducts } from '@/context/ProductsContext';
import { useLang } from '@/context/LangContext';

interface StepDIYAreaSetupProps {
  availableAreaM2?: number;
  panelModel?: string;
  bracketModel?: string;
  onUpdate: (data: Partial<ConfigData> & { pvCapacityKw?: number; bracketSets?: number }) => void;
}

const AREA_PER_SET = 260;
const QUICK_AREAS  = [300, 550, 800, 1100, 1400, 2000];

export default function StepDIYAreaSetup({
  availableAreaM2,
  panelModel = '655W',
  bracketModel = 'standard_32',
  onUpdate,
}: StepDIYAreaSetupProps) {
  const { lang }                                   = useLang();
  const { pvPanels, getBracketByModel, calcPvKw }  = useProducts();

  const [areaInput,    setAreaInput]    = useState(availableAreaM2 ? String(availableAreaM2) : '');
  // 用户实际选择的套数（null = 尚未手动选，跟随 maxSets）
  const [chosenSets,   setChosenSets]   = useState<number | null>(null);

  const areaVal = parseFloat(areaInput);
  const hasArea = !isNaN(areaVal) && areaVal > 0;
  const maxSets = hasArea ? Math.max(1, Math.floor(areaVal / AREA_PER_SET)) : 0;

  // 有效安装套数：用户手动选 → 用户选，否则默认 maxSets
  const effectiveSets = chosenSets !== null
    ? Math.min(chosenSets, maxSets)   // 防止面积缩小后超出上限
    : maxSets;

  const pvKw    = effectiveSets > 0 ? calcPvKw(effectiveSets, panelModel, bracketModel) : 0;
  const bracket = getBracketByModel(bracketModel);

  /** 统一推送更新（套数和面积均确定时才推送完整数据） */
  const push = (m2: number, panel: string, sets: number) => {
    const pv = calcPvKw(sets, panel, bracketModel);
    onUpdate({
      availableAreaM2: m2,
      panelModel:      panel,
      bracketSets:     sets,
      pvCapacityKw:    pv,
    } as any);
  };

  const handleQuickArea = (m2: number) => {
    setAreaInput(String(m2));
    // 面积变化后重置手动选择，让套数自动跟随新 maxSets
    const newMax = Math.max(1, Math.floor(m2 / AREA_PER_SET));
    setChosenSets(null);
    push(m2, panelModel, newMax);
  };

  const handleAreaChange = (val: string) => {
    setAreaInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const newMax = Math.max(1, Math.floor(num / AREA_PER_SET));
      // 如果当前 chosenSets 仍在新上限内则保留，否则重置
      const newSets = chosenSets !== null ? Math.min(chosenSets, newMax) : newMax;
      setChosenSets(chosenSets !== null ? newSets : null);
      push(num, panelModel, newSets);
    }
  };

  const handlePanel = (model: string) => {
    if (hasArea) push(areaVal, model, effectiveSets);
    else onUpdate({ panelModel: model } as any);
  };

  const handleChooseSets = (sets: number) => {
    setChosenSets(sets);
    if (hasArea) push(areaVal, panelModel, sets);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>

      {/* ══ Section A: PV 组件型号 ══════════════════════════ */}
      <section>
        <div style={{
          fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.07em',
          color: '#718096', textTransform: 'uppercase', marginBottom: '0.6rem',
        }}>
          {lang === 'en' ? 'A — PV Module Selection' : 'A — 光伏组件型号'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
          {pvPanels.map(p => {
            const isSelected = panelModel === p.model;
            return (
              <div
                key={p.model}
                onClick={() => handlePanel(p.model)}
                style={{
                  padding: '0.5rem 1rem',
                  border: `2px solid ${isSelected ? '#1a365d' : '#e2e8f0'}`,
                  borderRadius: '10px', cursor: 'pointer',
                  background: isSelected ? '#ebf4ff' : 'white',
                  transition: 'all 0.15s', textAlign: 'center',
                  minWidth: '110px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a365d' }}>{p.model}</div>
                <div style={{ fontSize: '0.7rem', color: '#718096', marginTop: '0.15rem' }}>
                  {calcPvKw(1, p.model, bracketModel).toFixed(2)} kW/{lang === 'en' ? 'set' : '套'}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══ Section B: 场地面积 ══════════════════════════════ */}
      <section>
        <div style={{
          fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.07em',
          color: '#718096', textTransform: 'uppercase', marginBottom: '0.6rem',
        }}>
          {lang === 'en' ? 'B — Available Site Area' : 'B — 可用场地面积'}
        </div>

        {/* Quick presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.65rem' }}>
          {QUICK_AREAS.map(m2 => {
            const active = availableAreaM2 !== undefined && Math.abs(availableAreaM2 - m2) < 50;
            const sets   = Math.max(1, Math.floor(m2 / AREA_PER_SET));
            return (
              <button
                key={m2}
                onClick={() => handleQuickArea(m2)}
                style={{
                  padding: '0.38rem 0.85rem', fontSize: '0.85rem',
                  border: `2px solid ${active ? '#1a365d' : '#e2e8f0'}`,
                  borderRadius: '18px', cursor: 'pointer',
                  background: active ? '#1a365d' : 'white',
                  color: active ? 'white' : '#4a5568',
                  fontWeight: active ? 700 : 400, transition: 'all 0.15s',
                }}
              >
                ~{m2.toLocaleString()} m²
                <span style={{ fontSize: '0.72rem', marginLeft: '0.25rem', opacity: 0.8 }}>
                  (≤{sets}{lang === 'en' ? ' sets' : '套'})
                </span>
              </button>
            );
          })}
        </div>

        {/* Manual input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            type="number" value={areaInput}
            onChange={e => handleAreaChange(e.target.value)}
            placeholder={lang === 'en' ? 'e.g. 1100' : '如：1100'}
            min={100} step={50}
            style={{
              padding: '0.55rem 1rem', border: '1px solid #cbd5e0',
              borderRadius: '8px', fontSize: '1rem', width: '130px',
            }}
          />
          <span style={{ color: '#718096', fontSize: '0.9rem' }}>m²</span>
        </div>

        {/* Capacity summary chips (area + area-per-set info) */}
        {hasArea && maxSets > 0 && (
          <div style={{ marginTop: '0.65rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[
              { label: lang === 'en' ? 'Max Installable Sets' : '最多可装套数', value: `${maxSets} ${lang === 'en' ? 'sets' : '套'}`, color: '#2b6cb0' },
              { label: lang === 'en' ? 'Area / Set'           : '每套占地',     value: `~${bracket.areaM2} m²`,                       color: '#718096' },
            ].map(m => (
              <div key={m.label} style={{
                padding: '0.4rem 0.8rem',
                background: '#ebf8ff', border: '1px solid #90cdf4',
                borderRadius: '8px', textAlign: 'center',
              }}>
                <div style={{ fontWeight: 800, color: m.color, fontSize: '1.0rem' }}>{m.value}</div>
                <div style={{ fontSize: '0.68rem', color: '#718096' }}>{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ══ Section C: 实际安装套数 ══════════════════════════ */}
      {hasArea && maxSets > 0 && (
        <section>
          <div style={{
            fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.07em',
            color: '#718096', textTransform: 'uppercase', marginBottom: '0.6rem',
          }}>
            {lang === 'en' ? 'C — Actual Sets to Install' : 'C — 实际安装套数'}
          </div>

          <div style={{ fontSize: '0.82rem', color: '#718096', marginBottom: '0.7rem' }}>
            {lang === 'en'
              ? `Site allows up to ${maxSets} set${maxSets > 1 ? 's' : ''}. Choose how many you actually want to install.`
              : `场地最多可安装 ${maxSets} 套，请选择实际安装套数。`}
          </div>

          {/* Quick-pick buttons: 1 ~ maxSets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.8rem' }}>
            {Array.from({ length: maxSets }, (_, i) => i + 1).map(n => {
              const isActive = effectiveSets === n;
              return (
                <button
                  key={n}
                  onClick={() => handleChooseSets(n)}
                  style={{
                    padding: '0.42rem 0.85rem', fontSize: '0.88rem',
                    border: `2px solid ${isActive ? '#1a365d' : '#e2e8f0'}`,
                    borderRadius: '18px', cursor: 'pointer',
                    background: isActive ? '#1a365d' : 'white',
                    color: isActive ? 'white' : '#4a5568',
                    fontWeight: isActive ? 700 : 400, transition: 'all 0.15s',
                  }}
                >
                  {n} {lang === 'en' ? (n === 1 ? 'set' : 'sets') : '套'}
                </button>
              );
            })}
          </div>

          {/* Stepper (for larger maxSets) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={() => handleChooseSets(Math.max(1, effectiveSets - 1))}
              disabled={effectiveSets <= 1}
              style={{
                width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid #cbd5e0',
                background: effectiveSets <= 1 ? '#f7fafc' : 'white', cursor: effectiveSets <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '1.3rem', lineHeight: 1, color: effectiveSets <= 1 ? '#a0aec0' : '#2d3748',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >−</button>
            <span style={{ minWidth: '80px', textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', color: '#1a365d' }}>
              {effectiveSets} {lang === 'en' ? (effectiveSets === 1 ? 'set' : 'sets') : '套'}
            </span>
            <button
              onClick={() => handleChooseSets(Math.min(maxSets, effectiveSets + 1))}
              disabled={effectiveSets >= maxSets}
              style={{
                width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid #cbd5e0',
                background: effectiveSets >= maxSets ? '#f7fafc' : 'white', cursor: effectiveSets >= maxSets ? 'not-allowed' : 'pointer',
                fontSize: '1.3rem', lineHeight: 1, color: effectiveSets >= maxSets ? '#a0aec0' : '#2d3748',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >＋</button>
          </div>

          {/* Result summary */}
          <div style={{ marginTop: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[
              { label: lang === 'en' ? 'Selected Sets' : '已选套数',   value: `${effectiveSets} ${lang === 'en' ? 'sets' : '套'}`, color: '#276749', bg: '#f0fff4', border: '#9ae6b4' },
              { label: lang === 'en' ? 'PV Capacity'   : 'PV 总容量', value: `${pvKw.toFixed(1)} kW`,                              color: '#276749', bg: '#f0fff4', border: '#9ae6b4' },
            ].map(m => (
              <div key={m.label} style={{
                padding: '0.45rem 1rem',
                background: m.bg, border: `1px solid ${m.border}`,
                borderRadius: '8px', textAlign: 'center',
              }}>
                <div style={{ fontWeight: 800, color: m.color, fontSize: '1.05rem' }}>{m.value}</div>
                <div style={{ fontSize: '0.68rem', color: '#718096' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
