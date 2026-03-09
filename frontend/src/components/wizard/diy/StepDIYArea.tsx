import { useEffect, useState } from 'react';
import type { ConfigData } from '@/types/index';
import { useProducts } from '@/context/ProductsContext';
import { useLang } from '@/context/LangContext';
import {
  type AreaUnit,
  formatAreaDual,
  formatAreaSingle,
  sqftToSqm,
  sqmToSqft,
} from '@/utils/unitFormat';

interface StepDIYAreaProps {
  availableAreaM2?: number;
  bracketModel?: string;
  panelModel?: string;
  totalInverterKw?: number;
  onUpdate: (data: Partial<ConfigData>) => void;
}

const QUICK_AREAS = [{ m2: 300 }, { m2: 550 }, { m2: 800 }, { m2: 1100 }, { m2: 1400 }, { m2: 2000 }];
const AREA_UNITS: AreaUnit[] = ['m2', 'ft2'];

function formatInputValue(areaM2?: number, unit: AreaUnit = 'm2'): string {
  if (!areaM2 || areaM2 <= 0) return '';
  const displayValue = unit === 'm2' ? areaM2 : sqmToSqft(areaM2);
  const rounded = Math.round(displayValue * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function getUnitLabel(unit: AreaUnit): string {
  return unit === 'm2' ? 'm²' : 'ft²';
}

function getInputWidth(value: string, minimumChars = 10): string {
  return `${Math.max(minimumChars, value.trim().length + 2)}ch`;
}

export default function StepDIYArea({
  availableAreaM2,
  bracketModel = 'standard_32',
  panelModel,
  totalInverterKw = 0,
  onUpdate,
}: StepDIYAreaProps) {
  const { t, lang } = useLang();
  const { pvPanels, getBracketByModel, calcPvKw } = useProducts();
  const [inputUnit, setInputUnit] = useState<AreaUnit>('m2');
  const [inputVal, setInputVal] = useState(formatInputValue(availableAreaM2, 'm2'));

  const bracket = getBracketByModel(bracketModel);
  const areaPerSet = bracket.areaM2;
  const normalizedAreaM2 = availableAreaM2 && availableAreaM2 > 0 ? availableAreaM2 : 0;
  const maxSets = normalizedAreaM2 ? Math.max(1, Math.floor(normalizedAreaM2 / areaPerSet)) : 0;
  const currentPanelModel = panelModel ?? '655W';

  useEffect(() => {
    setInputVal(formatInputValue(availableAreaM2, inputUnit));
  }, [availableAreaM2, inputUnit]);

  const handleArea = (val: string) => {
    setInputVal(val);
    const num = parseFloat(val);
    if (!Number.isNaN(num) && num > 0) {
      onUpdate({ availableAreaM2: inputUnit === 'm2' ? num : sqftToSqm(num) });
    }
  };

  const handleQuick = (m2: number) => {
    onUpdate({ availableAreaM2: m2 });
  };

  const handlePanel = (model: string) => {
    onUpdate({ panelModel: model });
  };

  const getMatchStatus = (sets: number) => {
    if (totalInverterKw <= 0) return null;
    const pvKw = calcPvKw(sets, currentPanelModel, bracketModel);
    const ratio = pvKw / totalInverterKw;
    if (ratio >= 0.9 && ratio <= 1.3) return 'good';
    if (ratio >= 0.7 && ratio < 0.9) return 'low';
    if (ratio > 1.3) return 'over';
    return 'insufficient';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div
        style={{
          padding: '0.85rem 1.1rem',
          background: '#ebf8ff',
          borderLeft: '4px solid #3182ce',
          borderRadius: '8px',
          fontSize: '0.87rem',
          color: '#2c5282',
          lineHeight: 1.7,
        }}
      >
        <strong>{lang === 'en' ? 'Standard folding bracket: ' : '标准折叠支架：'}</strong>
        {lang === 'en'
          ? `${bracket.panelsPerSet} panels per set, requires ~${formatAreaDual(areaPerSet, lang).combined} including row spacing.`
          : `每套安装 ${bracket.panelsPerSet} 块组件，含行间走道约需 ${formatAreaDual(areaPerSet, lang).combined}。`}
        {' '}
        {lang === 'en'
          ? 'The system calculates the maximum installable sets from site area and provides inverter matching recommendations.'
          : '系统将根据场地面积推算最大可安装套数，并结合逆变器功率给出匹配建议。'}
      </div>

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
                }}
              >
                <div style={{ fontWeight: 700, color: '#1a365d' }}>{p.model}</div>
                <div style={{ fontSize: '0.75rem', color: '#718096' }}>{p.displayName.split(' ').slice(1).join(' ')}</div>
                <div style={{ fontSize: '0.75rem', color: '#276749', marginTop: '0.1rem' }}>
                  {calcPvKw(1, p.model, bracketModel).toFixed(2)} kW/{lang === 'en' ? 'set' : '套'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.5rem', fontSize: '0.93rem' }}>
          {t('diy.area.quick')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {QUICK_AREAS.map(q => {
            const isActive = normalizedAreaM2 > 0 && Math.abs(normalizedAreaM2 - q.m2) < 50;
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
                ~{formatAreaDual(q.m2, lang).combined}
                <span style={{ fontSize: '0.72rem', marginLeft: '0.3rem', opacity: 0.75 }}>
                  ({lang === 'en' ? `<= ${sets} sets` : `最多 ${sets} 套`})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontWeight: 600, color: '#2d3748', fontSize: '0.93rem' }}>
            {lang === 'en' ? 'Manual area input' : '手动输入面积'}
          </div>
          <div
            style={{
              display: 'inline-flex',
              background: '#edf2f7',
              borderRadius: '999px',
              padding: '0.15rem',
              gap: '0.15rem',
            }}
          >
            {AREA_UNITS.map(unit => {
              const active = inputUnit === unit;
              return (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setInputUnit(unit)}
                  style={{
                    border: 'none',
                    borderRadius: '999px',
                    padding: '0.3rem 0.8rem',
                    background: active ? '#1a365d' : 'transparent',
                    color: active ? 'white' : '#4a5568',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                  }}
                >
                  {getUnitLabel(unit)}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            type="number"
            value={inputVal}
            onChange={e => handleArea(e.target.value)}
            placeholder={lang === 'en' ? (inputUnit === 'm2' ? 'e.g. 1100' : 'e.g. 11840') : inputUnit === 'm2' ? '如：1100' : '如：11840'}
            min={100}
            step={inputUnit === 'm2' ? 50 : 500}
            style={{
              padding: '0.6rem 1rem',
              border: '1px solid #cbd5e0',
              borderRadius: '8px',
              fontSize: '1rem',
              width: getInputWidth(inputVal, 10),
            }}
          />
          <span style={{ color: '#718096', fontSize: '0.9rem' }}>{getUnitLabel(inputUnit)}</span>
        </div>
        <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: '#718096' }}>
          {lang === 'en'
            ? `Input in ${getUnitLabel(inputUnit)}. Summaries still show both m² and ft².`
            : `当前按 ${getUnitLabel(inputUnit)} 输入；汇总结果仍会同时显示 m² 和 ft²。`}
        </div>
      </div>

      {normalizedAreaM2 > 0 && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: maxSets >= 1 ? '#f0fff4' : '#fff5f5',
            border: `1px solid ${maxSets >= 1 ? '#9ae6b4' : '#fed7d7'}`,
            borderLeft: `4px solid ${maxSets >= 1 ? '#38a169' : '#fc8181'}`,
            borderRadius: '10px',
          }}
        >
          <div style={{ fontWeight: 700, color: '#2d3748', marginBottom: '0.65rem', fontSize: '0.95rem' }}>
            {t('diy.area.result')}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.6rem',
              marginBottom: '0.75rem',
            }}
          >
            {[
              { label: t('diy.area.m2'), value: formatAreaDual(normalizedAreaM2, lang).combined, color: '#1a365d' },
              { label: t('diy.area.max_sets'), value: `${maxSets} ${lang === 'en' ? 'sets' : '套'}`, color: '#276749' },
              { label: t('diy.area.max_pv'), value: `${calcPvKw(maxSets, currentPanelModel, bracketModel).toFixed(1)} kW`, color: '#276749' },
            ].map(metric => (
              <div
                key={metric.label}
                style={{
                  textAlign: 'center',
                  background: 'white',
                  borderRadius: '8px',
                  padding: '0.55rem',
                }}
              >
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: metric.color, lineHeight: 1.25 }}>{metric.value}</div>
                <div style={{ fontSize: '0.72rem', color: '#718096' }}>{metric.label}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '0.82rem', color: '#4a5568', marginBottom: '0.35rem', fontWeight: 600 }}>
            {lang === 'en' ? 'PV capacity by sets' : '各套数对应 PV 容量'}
            {totalInverterKw > 0 ? ` (${lang === 'en' ? 'ref. inverter' : '参考逆变器'} ${totalInverterKw.toFixed(1)} kW)` : ''}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            {Array.from({ length: maxSets }, (_, i) => i + 1).map(n => {
              const pvKw = calcPvKw(n, currentPanelModel, bracketModel);
              const status = getMatchStatus(n);
              const statusStyle: Record<string, { bg: string; border: string; color: string; tag?: string }> = {
                good: { bg: '#c6f6d5', border: '#9ae6b4', color: '#276749', tag: t('diy.area.match.good') },
                low: { bg: '#fefcbf', border: '#f6e05e', color: '#744210', tag: t('diy.area.match.low') },
                over: { bg: '#e9d8fd', border: '#d6bcfa', color: '#553c9a', tag: t('diy.area.match.over') },
                insufficient: { bg: '#fed7d7', border: '#fc8181', color: '#c53030', tag: lang === 'en' ? 'Insufficient' : '不足' },
              };
              const s = status ? statusStyle[status] : { bg: '#e2e8f0', border: '#e2e8f0', color: '#4a5568' };
              return (
                <span
                  key={n}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    color: s.color,
                    fontWeight: status === 'good' ? 700 : 400,
                  }}
                >
                  {n} {lang === 'en' ? 'sets' : '套'} → {pvKw.toFixed(1)} kW{s.tag ? ` ${s.tag}` : ''}
                </span>
              );
            })}
          </div>

          <div style={{ marginTop: '0.5rem', fontSize: '0.76rem', color: '#718096' }}>
            {lang === 'en'
              ? `Current input unit: ${formatAreaSingle(normalizedAreaM2, inputUnit, lang)}`
              : `当前输入口径：${formatAreaSingle(normalizedAreaM2, inputUnit, lang)}`}
          </div>

          {totalInverterKw > 0 && (
            <div style={{ marginTop: '0.25rem', fontSize: '0.76rem', color: '#718096' }}>
              {t('diy.area.over_note')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
