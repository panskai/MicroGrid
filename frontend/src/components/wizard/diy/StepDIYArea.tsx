/**
 * StepDIYArea.tsx — DIY流程 Step 3: 场地面积 → 推算可安装PV支架套数
 *
 * 与 known-load 流程的 StepArea 逻辑相同，但提示文案针对 DIY 场景。
 * 同时允许顾客选择PV组件型号（容量），影响每套支架的发电功率。
 */
import { useState } from 'react';
import type { ConfigData } from '@/types/index';
import { useProducts } from '@/context/ProductsContext';
import { useLang } from '@/context/LangContext';

interface StepDIYAreaProps {
  availableAreaM2?: number;
  bracketModel?: string;
  panelModel?: string;
  totalInverterKw?: number;   // 来自Step2推算，用于参考匹配
  onUpdate: (data: Partial<ConfigData>) => void;
}

const QUICK_AREAS = [
  { m2: 300  },
  { m2: 550  },
  { m2: 800  },
  { m2: 1100 },
  { m2: 1400 },
  { m2: 2000 },
];

export default function StepDIYArea({
  availableAreaM2,
  bracketModel = 'standard_32',
  panelModel,
  totalInverterKw = 0,
  onUpdate,
}: StepDIYAreaProps) {
  const { t, lang } = useLang();
  const { pvPanels, getBracketByModel, calcPvKw } = useProducts();
  const [inputVal, setInputVal] = useState(availableAreaM2 ? String(availableAreaM2) : '');

  const bracket    = getBracketByModel(bracketModel);
  const areaPerSet = bracket.areaM2;
  const maxSets    = availableAreaM2
    ? Math.max(1, Math.floor(availableAreaM2 / areaPerSet))
    : 0;

  const currentPanelModel = panelModel ?? '655W';

  const handleArea = (val: string) => {
    setInputVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      onUpdate({ availableAreaM2: num });
    }
  };

  const handleQuick = (m2: number) => {
    setInputVal(String(m2));
    onUpdate({ availableAreaM2: m2 });
  };

  const handlePanel = (model: string) => {
    onUpdate({ panelModel: model });
  };

  // 与逆变器功率的匹配状态
  const getMatchStatus = (sets: number) => {
    if (totalInverterKw <= 0) return null;
    const pvKw = calcPvKw(sets, currentPanelModel, bracketModel);
    const ratio = pvKw / totalInverterKw;
    if (ratio >= 0.9 && ratio <= 1.3) return 'good';
    if (ratio >= 0.7 && ratio < 0.9)  return 'low';
    if (ratio > 1.3)                   return 'over';
    return 'insufficient';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* 说明 */}
      <div style={{
        padding: '0.85rem 1.1rem',
        background: '#ebf8ff',
        borderLeft: '4px solid #3182ce',
        borderRadius: '8px',
        fontSize: '0.87rem',
        color: '#2c5282',
        lineHeight: 1.7,
      }}>
        <strong>{lang === 'en' ? 'Standard folding bracket: ' : '标准折叠支架：'}</strong>
        {lang === 'en'
          ? `${bracket.panelsPerSet} panels per set, requires ~${areaPerSet} m² including row spacing.`
          : `每套安装 ${bracket.panelsPerSet} 块组件，含行间走道约需 ${areaPerSet} m²。`}
        {' '}
        {lang === 'en'
          ? 'The system calculates maximum installable sets from site area and provides inverter matching recommendations.'
          : '系统将根据场地面积推算最大可安装套数，并结合逆变器功率给出最优匹配建议。'}
      </div>

      {/* 光伏组件型号选择 */}
      <div>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.6rem', fontSize: '0.93rem' }}>
          {t('diy.area.panel_label')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {pvPanels.map(p => {
            const isSelected = currentPanelModel === p.model;
            return (
              <div
                key={p.model}
                onClick={() => handlePanel(p.model)}
                style={{
                  padding: '0.55rem 1rem',
                  border: `2px solid ${isSelected ? '#1a365d' : '#e2e8f0'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: isSelected ? '#ebf4ff' : 'white',
                  transition: 'all 0.15s',
                  fontSize: '0.85rem',
                  position: 'relative',
                }}
              >
                <div style={{ fontWeight: 700, color: '#1a365d' }}>{p.model}</div>
                <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                  {p.displayName.split(' ').slice(1).join(' ')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#276749', marginTop: '0.1rem' }}>
                  {calcPvKw(1, p.model, bracketModel).toFixed(2)} kW/{lang === 'en' ? 'set' : '套'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 快速面积选择 */}
      <div>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.5rem', fontSize: '0.93rem' }}>
          {t('diy.area.quick')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {QUICK_AREAS.map(q => {
            const isActive = availableAreaM2 !== undefined && Math.abs(availableAreaM2 - q.m2) < 50;
            const sets = Math.max(1, Math.floor(q.m2 / areaPerSet));
            return (
              <button
                key={q.m2}
                onClick={() => handleQuick(q.m2)}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.85rem',
                  border: `1px solid ${isActive ? '#1a365d' : '#e2e8f0'}`,
                  borderRadius: '20px',
                  cursor: 'pointer',
                  background: isActive ? '#1a365d' : 'white',
                  color: isActive ? 'white' : '#4a5568',
                  transition: 'all 0.15s',
                }}
              >
                ~{q.m2.toLocaleString()} m²
                <span style={{ fontSize: '0.72rem', marginLeft: '0.3rem', opacity: 0.75 }}>
                  (≤{sets}{lang === 'en' ? ' sets' : '套'})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 手动输入 */}
      <div>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.5rem', fontSize: '0.93rem' }}>
          {t('diy.area.manual')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            type="number"
            value={inputVal}
            onChange={e => handleArea(e.target.value)}
            placeholder={lang === 'en' ? 'e.g. 1100' : '如：1100'}
            min={100}
            step={50}
            style={{
              padding: '0.6rem 1rem',
              border: '1px solid #cbd5e0',
              borderRadius: '8px',
              fontSize: '1rem',
              width: '140px',
            }}
          />
          <span style={{ color: '#718096', fontSize: '0.9rem' }}>m²</span>
        </div>
      </div>

      {/* 推算结果 */}
      {availableAreaM2 && availableAreaM2 > 0 && (
        <div style={{
          padding: '1rem 1.25rem',
          background: maxSets >= 1 ? '#f0fff4' : '#fff5f5',
          border: `1px solid ${maxSets >= 1 ? '#9ae6b4' : '#fed7d7'}`,
          borderLeft: `4px solid ${maxSets >= 1 ? '#38a169' : '#fc8181'}`,
          borderRadius: '10px',
        }}>
          <div style={{ fontWeight: 700, color: '#2d3748', marginBottom: '0.65rem', fontSize: '0.95rem' }}>
            {t('diy.area.result')}
          </div>

          {/* 核心指标 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.6rem',
            marginBottom: '0.75rem',
          }}>
            {[
              { label: t('diy.area.m2'),       value: `${availableAreaM2.toLocaleString()} m²`,                                   color: '#1a365d' },
              { label: t('diy.area.max_sets'),  value: `${maxSets} ${lang === 'en' ? 'sets' : '套'}`,                              color: '#276749' },
              { label: t('diy.area.max_pv'),    value: `${calcPvKw(maxSets, currentPanelModel, bracketModel).toFixed(1)} kW`,      color: '#276749' },
            ].map(m => (
              <div key={m.label} style={{
                textAlign: 'center', background: 'white',
                borderRadius: '8px', padding: '0.55rem',
              }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: '0.72rem', color: '#718096' }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* 各套数 + 逆变器匹配状态 */}
          <div style={{ fontSize: '0.82rem', color: '#4a5568', marginBottom: '0.35rem', fontWeight: 600 }}>
          {lang === 'en' ? 'PV capacity by sets' : '各套数 PV 容量'}
            {totalInverterKw > 0 ? ` (${lang === 'en' ? 'ref. inverter' : '参考逆变器功率'} ${totalInverterKw.toFixed(1)} kW)` : ''}：
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            {Array.from({ length: maxSets }, (_, i) => i + 1).map(n => {
              const pvKw = calcPvKw(n, currentPanelModel, bracketModel);
              const status = getMatchStatus(n);
              const statusStyle: Record<string, { bg: string; border: string; color: string; tag?: string }> = {
                good:         { bg: '#c6f6d5', border: '#9ae6b4', color: '#276749', tag: t('diy.area.match.good') },
                low:          { bg: '#fefcbf', border: '#f6e05e', color: '#744210', tag: t('diy.area.match.low') },
                over:         { bg: '#e9d8fd', border: '#d6bcfa', color: '#553c9a', tag: t('diy.area.match.over') },
                insufficient: { bg: '#fed7d7', border: '#fc8181', color: '#c53030', tag: lang === 'en' ? 'Insufficient' : '不足' },
              };
              const s = status ? statusStyle[status] : { bg: '#e2e8f0', border: '#e2e8f0', color: '#4a5568' };
              return (
                <span key={n} style={{
                  padding: '0.25rem 0.75rem',
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  color: s.color,
                  fontWeight: status === 'good' ? 700 : 400,
                }}>
                  {n}{lang === 'en' ? ' sets' : '套'} → {pvKw.toFixed(1)} kW{s.tag ? ` ${s.tag}` : ''}
                </span>
              );
            })}
          </div>

          {totalInverterKw > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.76rem', color: '#718096' }}>
              {t('diy.area.over_note')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
