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

interface StepAreaProps {
  availableAreaM2?: number;
  bracketModel?: string;
  onUpdate: (data: Partial<ConfigData>) => void;
}

const QUICK_AREAS = [
  { m2: 300, maxSets: 1 },
  { m2: 550, maxSets: 2 },
  { m2: 800, maxSets: 3 },
  { m2: 1100, maxSets: 4 },
  { m2: 1400, maxSets: 5 },
];

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

export default function StepArea({
  availableAreaM2,
  bracketModel = 'standard_32',
  onUpdate,
}: StepAreaProps) {
  const { getBracketByModel, calcPvKw } = useProducts();
  const { lang } = useLang();
  const [inputUnit, setInputUnit] = useState<AreaUnit>('m2');
  const [inputVal, setInputVal] = useState(formatInputValue(availableAreaM2, 'm2'));

  const bracket = getBracketByModel(bracketModel);
  const areaPerSet = bracket.areaM2;
  const normalizedAreaM2 = availableAreaM2 && availableAreaM2 > 0 ? availableAreaM2 : 0;
  const maxSets = normalizedAreaM2 ? Math.max(1, Math.floor(normalizedAreaM2 / areaPerSet)) : 0;

  useEffect(() => {
    setInputVal(formatInputValue(availableAreaM2, inputUnit));
  }, [availableAreaM2, inputUnit]);

  const handleInput = (val: string) => {
    setInputVal(val);
    const num = parseFloat(val);
    if (!Number.isNaN(num) && num > 0) {
      onUpdate({ availableAreaM2: inputUnit === 'm2' ? num : sqftToSqm(num) });
    }
  };

  const handleQuick = (m2: number) => {
    onUpdate({ availableAreaM2: m2 });
  };

  const handleUnitChange = (unit: AreaUnit) => {
    if (unit === inputUnit) return;
    setInputUnit(unit);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          padding: '0.85rem 1.1rem',
          background: '#ebf8ff',
          borderLeft: '4px solid #3182ce',
          borderRadius: '8px',
          fontSize: '0.88rem',
          color: '#2c5282',
          lineHeight: 1.7,
        }}
      >
        {lang === 'en' ? (
          <>
            <strong>Standard folding bracket footprint: </strong>
            Each set installs {bracket.panelsPerSet} panels, requiring approx.{' '}
            <strong>{formatAreaDual(areaPerSet, lang).combined}</strong> including row spacing, with PV output of approx.{' '}
            <strong>{calcPvKw(1, '655W', bracketModel)} kW/set</strong> (using standard 655Wp panels). The system will
            automatically determine the maximum installable sets based on your site area.
          </>
        ) : (
          <>
            <strong>标准折叠支架占地参考：</strong>
            每套安装 {bracket.panelsPerSet} 块组件，含行间走道约需{' '}
            <strong>{formatAreaDual(areaPerSet, lang).combined}</strong>，发电功率约{' '}
            <strong>{calcPvKw(1, '655W', bracketModel)} kW/套</strong>（以标准 655Wp 组件为例）。
            <br />
            系统将根据您的场地面积自动确定最大可安装套数，并在方案优化中筛选最优配置。
          </>
        )}
      </div>

      <div>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.6rem', fontSize: '0.95rem' }}>
          {lang === 'en' ? 'Quick-select typical area' : '快速选择典型面积'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {QUICK_AREAS.map(q => (
            <button
              key={q.m2}
              onClick={() => handleQuick(q.m2)}
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.85rem',
                border: `1px solid ${normalizedAreaM2 && Math.abs(normalizedAreaM2 - q.m2) < 50 ? '#1a365d' : '#e2e8f0'}`,
                borderRadius: '20px',
                cursor: 'pointer',
                background: normalizedAreaM2 && Math.abs(normalizedAreaM2 - q.m2) < 50 ? '#1a365d' : 'white',
                color: normalizedAreaM2 && Math.abs(normalizedAreaM2 - q.m2) < 50 ? 'white' : '#4a5568',
                transition: 'all 0.15s',
              }}
            >
              ~{formatAreaDual(q.m2, lang).combined}
              <span style={{ fontSize: '0.72rem', marginLeft: '0.3rem', opacity: 0.75 }}>
                ({lang === 'en' ? `<= ${q.maxSets} sets` : `最多 ${q.maxSets} 套`})
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: '0.6rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontWeight: 600, color: '#2d3748', fontSize: '0.95rem' }}>
            {lang === 'en' ? 'Enter available area' : '输入可安装面积'}
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
                  onClick={() => handleUnitChange(unit)}
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
            onChange={e => handleInput(e.target.value)}
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
            ? `Input in ${getUnitLabel(inputUnit)}. The system stores area internally as m² and shows both units in the summary.`
            : `当前按 ${getUnitLabel(inputUnit)} 输入；系统内部统一换算为 m²，汇总结果会同时显示 m² 和 ft²。`}
        </div>
      </div>

      {normalizedAreaM2 > 0 && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: maxSets >= 1 ? '#f0fff4' : '#fff5f5',
            border: `1px solid ${maxSets >= 1 ? '#9ae6b4' : '#fed7d7'}`,
            borderRadius: '10px',
            borderLeft: `4px solid ${maxSets >= 1 ? '#38a169' : '#fc8181'}`,
          }}
        >
          <div style={{ fontWeight: 700, color: '#2d3748', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            {lang === 'en' ? 'Site Assessment Result' : '场地评估结果'}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <div style={{ textAlign: 'center', background: 'white', borderRadius: '8px', padding: '0.65rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1a365d', lineHeight: 1.25 }}>
                {formatAreaDual(normalizedAreaM2, lang).combined}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#718096' }}>
                {lang === 'en' ? 'Available Area' : '可用面积'}
              </div>
            </div>
            <div style={{ textAlign: 'center', background: 'white', borderRadius: '8px', padding: '0.65rem' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#276749' }}>{maxSets}</div>
              <div style={{ fontSize: '0.72rem', color: '#718096' }}>
                {lang === 'en' ? 'Max Installable Sets' : '最大可安装套数'}
              </div>
            </div>
            <div style={{ textAlign: 'center', background: 'white', borderRadius: '8px', padding: '0.65rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2b6cb0', lineHeight: 1.25 }}>
                {formatAreaDual(maxSets * areaPerSet, lang).combined}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#718096' }}>
                {lang === 'en' ? 'Estimated Footprint' : '预计占用面积'}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', borderTop: '1px solid #c6f6d5', paddingTop: '0.85rem' }}>
            <div style={{ fontSize: '0.82rem', color: '#4a5568', marginBottom: '0.5rem', fontWeight: 600 }}>
              {lang === 'en' ? 'PV capacity per set count:' : '不同套数对应的 PV 容量：'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {Array.from({ length: maxSets }, (_, i) => i + 1).map(n => (
                <span
                  key={n}
                  style={{
                    padding: '0.25rem 0.7rem',
                    background: '#e6fffa',
                    border: '1px solid #81e6d9',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    color: '#2c7a7b',
                  }}
                >
                  {n} {lang === 'en' ? 'sets' : '套'} → {calcPvKw(n, '655W', bracketModel).toFixed(1)} kW
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#718096' }}>
            {lang === 'en'
              ? `Optimization will automatically search for the best configuration within 1 to ${maxSets} sets.`
              : `优化计算将在 1 到 ${maxSets} 套范围内自动搜索最优配置。`}
          </div>
          <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#718096' }}>
            {lang === 'en'
              ? `Current input unit: ${formatAreaSingle(normalizedAreaM2, inputUnit, lang)}`
              : `当前输入口径：${formatAreaSingle(normalizedAreaM2, inputUnit, lang)}`}
          </div>
        </div>
      )}
    </div>
  );
}
