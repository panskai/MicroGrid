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

interface StepDIYAreaSetupProps {
  availableAreaM2?: number;
  panelModel?: string;
  bracketModel?: string;
  onUpdate: (data: Partial<ConfigData> & { pvCapacityKw?: number; bracketSets?: number }) => void;
}

const AREA_PER_SET = 260;
const QUICK_AREAS = [300, 550, 800, 1100, 1400, 2000];
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

export default function StepDIYAreaSetup({
  availableAreaM2,
  panelModel = '655W',
  bracketModel = 'standard_32',
  onUpdate,
}: StepDIYAreaSetupProps) {
  const { lang } = useLang();
  const { pvPanels, getBracketByModel, calcPvKw } = useProducts();
  const [inputUnit, setInputUnit] = useState<AreaUnit>('m2');
  const [areaInput, setAreaInput] = useState(formatInputValue(availableAreaM2, 'm2'));
  const [chosenSets, setChosenSets] = useState<number | null>(null);

  const areaM2Value = availableAreaM2 && availableAreaM2 > 0 ? availableAreaM2 : 0;
  const hasArea = areaM2Value > 0;
  const maxSets = hasArea ? Math.max(1, Math.floor(areaM2Value / AREA_PER_SET)) : 0;
  const effectiveSets = chosenSets !== null ? Math.min(chosenSets, maxSets) : maxSets;
  const pvKw = effectiveSets > 0 ? calcPvKw(effectiveSets, panelModel, bracketModel) : 0;
  const bracket = getBracketByModel(bracketModel);

  useEffect(() => {
    setAreaInput(formatInputValue(availableAreaM2, inputUnit));
  }, [availableAreaM2, inputUnit]);

  const push = (m2: number, panel: string, sets: number) => {
    const pv = calcPvKw(sets, panel, bracketModel);
    onUpdate({
      availableAreaM2: m2,
      panelModel: panel,
      bracketSets: sets,
      pvCapacityKw: pv,
    } as any);
  };

  const handleQuickArea = (m2: number) => {
    const newMax = Math.max(1, Math.floor(m2 / AREA_PER_SET));
    setChosenSets(null);
    push(m2, panelModel, newMax);
  };

  const handleAreaChange = (val: string) => {
    setAreaInput(val);
    const num = parseFloat(val);
    if (!Number.isNaN(num) && num > 0) {
      const m2 = inputUnit === 'm2' ? num : sqftToSqm(num);
      const newMax = Math.max(1, Math.floor(m2 / AREA_PER_SET));
      const newSets = chosenSets !== null ? Math.min(chosenSets, newMax) : newMax;
      setChosenSets(chosenSets !== null ? newSets : null);
      push(m2, panelModel, newSets);
    }
  };

  const handlePanel = (model: string) => {
    if (hasArea) push(areaM2Value, model, effectiveSets);
    else onUpdate({ panelModel: model } as any);
  };

  const handleChooseSets = (sets: number) => {
    setChosenSets(sets);
    if (hasArea) push(areaM2Value, panelModel, sets);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
      <section>
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.07em',
            color: '#718096',
            textTransform: 'uppercase',
            marginBottom: '0.6rem',
          }}
        >
          {lang === 'en' ? 'A - PV Module Selection' : 'A - 光伏组件型号'}
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
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: isSelected ? '#ebf4ff' : 'white',
                  transition: 'all 0.15s',
                  textAlign: 'center',
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

      <section>
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.07em',
            color: '#718096',
            textTransform: 'uppercase',
            marginBottom: '0.6rem',
          }}
        >
          {lang === 'en' ? 'B - Available Site Area' : 'B - 可用场地面积'}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.65rem' }}>
          {QUICK_AREAS.map(m2 => {
            const active = hasArea && Math.abs(areaM2Value - m2) < 50;
            const sets = Math.max(1, Math.floor(m2 / AREA_PER_SET));
            return (
              <button
                key={m2}
                onClick={() => handleQuickArea(m2)}
                style={{
                  padding: '0.38rem 0.85rem',
                  fontSize: '0.85rem',
                  border: `2px solid ${active ? '#1a365d' : '#e2e8f0'}`,
                  borderRadius: '18px',
                  cursor: 'pointer',
                  background: active ? '#1a365d' : 'white',
                  color: active ? 'white' : '#4a5568',
                  fontWeight: active ? 700 : 400,
                  transition: 'all 0.15s',
                }}
              >
                ~{formatAreaDual(m2, lang).combined}
                <span style={{ fontSize: '0.72rem', marginLeft: '0.25rem', opacity: 0.8 }}>
                  ({lang === 'en' ? `<= ${sets} sets` : `最多 ${sets} 套`})
                </span>
              </button>
            );
          })}
        </div>

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
          <div style={{ fontWeight: 600, color: '#2d3748', fontSize: '0.95rem' }}>
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
            value={areaInput}
            onChange={e => handleAreaChange(e.target.value)}
            placeholder={lang === 'en' ? (inputUnit === 'm2' ? 'e.g. 1100' : 'e.g. 11840') : inputUnit === 'm2' ? '如：1100' : '如：11840'}
            min={100}
            step={inputUnit === 'm2' ? 50 : 500}
            style={{
              padding: '0.55rem 1rem',
              border: '1px solid #cbd5e0',
              borderRadius: '8px',
              fontSize: '1rem',
              width: getInputWidth(areaInput, 10),
            }}
          />
          <span style={{ color: '#718096', fontSize: '0.9rem' }}>{getUnitLabel(inputUnit)}</span>
        </div>
        <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: '#718096' }}>
          {lang === 'en'
            ? `Input in ${getUnitLabel(inputUnit)}. Summaries still show both m² and ft².`
            : `当前按 ${getUnitLabel(inputUnit)} 输入；汇总结果仍会同时显示 m² 和 ft²。`}
        </div>

        {hasArea && maxSets > 0 && (
          <div style={{ marginTop: '0.65rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[
              {
                label: lang === 'en' ? 'Max Installable Sets' : '最大可装套数',
                value: `${maxSets} ${lang === 'en' ? 'sets' : '套'}`,
                color: '#2b6cb0',
              },
              {
                label: lang === 'en' ? 'Area / Set' : '每套占地',
                value: `~${formatAreaDual(bracket.areaM2, lang).combined}`,
                color: '#718096',
              },
            ].map(metric => (
              <div
                key={metric.label}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: '#ebf8ff',
                  border: '1px solid #90cdf4',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 800, color: metric.color, fontSize: '0.95rem', lineHeight: 1.25 }}>
                  {metric.value}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#718096' }}>{metric.label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {hasArea && maxSets > 0 && (
        <section>
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.07em',
              color: '#718096',
              textTransform: 'uppercase',
              marginBottom: '0.6rem',
            }}
          >
            {lang === 'en' ? 'C - Actual Sets to Install' : 'C - 实际安装套数'}
          </div>

          <div style={{ fontSize: '0.82rem', color: '#718096', marginBottom: '0.7rem' }}>
            {lang === 'en'
              ? `Site allows up to ${maxSets} set${maxSets > 1 ? 's' : ''}. Choose how many you actually want to install.`
              : `场地最多可安装 ${maxSets} 套，请选择实际安装套数。`}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.8rem' }}>
            {Array.from({ length: maxSets }, (_, i) => i + 1).map(n => {
              const isActive = effectiveSets === n;
              return (
                <button
                  key={n}
                  onClick={() => handleChooseSets(n)}
                  style={{
                    padding: '0.42rem 0.85rem',
                    fontSize: '0.88rem',
                    border: `2px solid ${isActive ? '#1a365d' : '#e2e8f0'}`,
                    borderRadius: '18px',
                    cursor: 'pointer',
                    background: isActive ? '#1a365d' : 'white',
                    color: isActive ? 'white' : '#4a5568',
                    fontWeight: isActive ? 700 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {n} {lang === 'en' ? (n === 1 ? 'set' : 'sets') : '套'}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={() => handleChooseSets(Math.max(1, effectiveSets - 1))}
              disabled={effectiveSets <= 1}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1.5px solid #cbd5e0',
                background: effectiveSets <= 1 ? '#f7fafc' : 'white',
                cursor: effectiveSets <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '1.3rem',
                lineHeight: 1,
                color: effectiveSets <= 1 ? '#a0aec0' : '#2d3748',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              -
            </button>
            <span style={{ minWidth: '80px', textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', color: '#1a365d' }}>
              {effectiveSets} {lang === 'en' ? (effectiveSets === 1 ? 'set' : 'sets') : '套'}
            </span>
            <button
              onClick={() => handleChooseSets(Math.min(maxSets, effectiveSets + 1))}
              disabled={effectiveSets >= maxSets}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1.5px solid #cbd5e0',
                background: effectiveSets >= maxSets ? '#f7fafc' : 'white',
                cursor: effectiveSets >= maxSets ? 'not-allowed' : 'pointer',
                fontSize: '1.3rem',
                lineHeight: 1,
                color: effectiveSets >= maxSets ? '#a0aec0' : '#2d3748',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              +
            </button>
          </div>

          <div style={{ marginTop: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[
              {
                label: lang === 'en' ? 'Selected Sets' : '已选套数',
                value: `${effectiveSets} ${lang === 'en' ? 'sets' : '套'}`,
                color: '#276749',
                bg: '#f0fff4',
                border: '#9ae6b4',
              },
              {
                label: lang === 'en' ? 'PV Capacity' : 'PV 总容量',
                value: `${pvKw.toFixed(1)} kW`,
                color: '#276749',
                bg: '#f0fff4',
                border: '#9ae6b4',
              },
              {
                label: lang === 'en' ? 'Current Input Unit' : '当前输入口径',
                value: formatAreaSingle(areaM2Value, inputUnit, lang),
                color: '#2b6cb0',
                bg: '#ebf8ff',
                border: '#90cdf4',
              },
            ].map(metric => (
              <div
                key={metric.label}
                style={{
                  padding: '0.45rem 1rem',
                  background: metric.bg,
                  border: `1px solid ${metric.border}`,
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 800, color: metric.color, fontSize: '1.05rem' }}>{metric.value}</div>
                <div style={{ fontSize: '0.68rem', color: '#718096' }}>{metric.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
