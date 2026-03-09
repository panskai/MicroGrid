/**
 * StepArea.tsx — 场地面积输入
 */
import { useState } from 'react';
import type { ConfigData } from '@/types/index';
import { useProducts } from '@/context/ProductsContext';
import { useLang } from '@/context/LangContext';

interface StepAreaProps {
  availableAreaM2?: number;
  bracketModel?: string;
  onUpdate: (data: Partial<ConfigData>) => void;
}

// 常见面积快速选项
const QUICK_AREAS = [
  { m2: 300,  maxSets: 1 },
  { m2: 550,  maxSets: 2 },
  { m2: 800,  maxSets: 3 },
  { m2: 1100, maxSets: 4 },
  { m2: 1400, maxSets: 5 },
];

export default function StepArea({ availableAreaM2, bracketModel = 'standard_32', onUpdate }: StepAreaProps) {
  const { getBracketByModel, calcPvKw } = useProducts();
  const { t, lang } = useLang();
  const [inputVal, setInputVal] = useState(availableAreaM2 ? String(availableAreaM2) : '');

  const bracket     = getBracketByModel(bracketModel);
  const areaPerSet  = bracket.areaM2;              // m² per set (default 260)
  const maxSets     = availableAreaM2
    ? Math.max(1, Math.floor(availableAreaM2 / areaPerSet))
    : 0;

  const handleInput = (val: string) => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── 说明信息 ──────────────────────────────────────────── */}
      <div style={{ padding: '0.85rem 1.1rem', background: '#ebf8ff', borderLeft: '4px solid #3182ce', borderRadius: '8px', fontSize: '0.88rem', color: '#2c5282', lineHeight: 1.7 }}>
        {lang === 'en'
          ? <><strong>Standard folding bracket footprint: </strong>Each set installs {bracket.panelsPerSet} panels, requiring approx. <strong>{areaPerSet} m²</strong> including row spacing, with PV output of approx. <strong>{calcPvKw(1, 'standard', bracketModel)} kW/set</strong> (using standard 655Wp panels). The system will automatically determine the maximum installable sets based on your site area.</>
          : <><strong>标准折叠支架占地参考：</strong>每套安装 {bracket.panelsPerSet} 块组件，含行间走道约需 <strong>{areaPerSet} m²</strong>，发电功率约 <strong>{calcPvKw(1, 'standard', bracketModel)} kW/套</strong>（以标准 655Wp 组件为例）。<br />系统将根据您的场地面积自动确定最大可安装套数，并在方案优化中筛选最优配置。</>}
      </div>

      {/* ── 快速选择 ─────────────────────────────────────────── */}
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
                border: `1px solid ${availableAreaM2 && Math.abs(availableAreaM2 - q.m2) < 50 ? '#1a365d' : '#e2e8f0'}`,
                borderRadius: '20px',
                cursor: 'pointer',
                background: availableAreaM2 && Math.abs(availableAreaM2 - q.m2) < 50 ? '#1a365d' : 'white',
                color: availableAreaM2 && Math.abs(availableAreaM2 - q.m2) < 50 ? 'white' : '#4a5568',
                transition: 'all 0.15s',
              }}
            >
              ~{q.m2.toLocaleString()} m²
              <span style={{ fontSize: '0.72rem', marginLeft: '0.3rem', opacity: 0.75 }}>
                ({lang === 'en' ? `≤${q.maxSets} sets` : `最多 ${q.maxSets} 套`})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 手动输入 ─────────────────────────────────────────── */}
      <div>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.6rem', fontSize: '0.95rem' }}>
          {lang === 'en' ? 'Enter available area (m²)' : '输入可安装面积（m²）'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            type="number"
            value={inputVal}
            onChange={e => handleInput(e.target.value)}
            placeholder={lang === 'en' ? 'e.g. 1100' : '如：1100'}
            min={100}
            step={50}
            style={{
              padding: '0.6rem 1rem',
              border: '1px solid #cbd5e0',
              borderRadius: '8px',
              fontSize: '1rem',
              width: '160px',
            }}
          />
          <span style={{ color: '#718096', fontSize: '0.9rem' }}>m²</span>
        </div>
      </div>

      {/* ── 结果预览 ─────────────────────────────────────────── */}
      {availableAreaM2 && availableAreaM2 > 0 && (
        <div style={{
          padding: '1rem 1.25rem',
          background: maxSets >= 1 ? '#f0fff4' : '#fff5f5',
          border: `1px solid ${maxSets >= 1 ? '#9ae6b4' : '#fed7d7'}`,
          borderRadius: '10px',
          borderLeft: `4px solid ${maxSets >= 1 ? '#38a169' : '#fc8181'}`,
        }}>
          <div style={{ fontWeight: 700, color: '#2d3748', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            {lang === 'en' ? 'Site Assessment Result' : '场地评估结果'}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
          }}>
            <div style={{ textAlign: 'center', background: 'white', borderRadius: '8px', padding: '0.65rem' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a365d' }}>{availableAreaM2.toLocaleString()}</div>
              <div style={{ fontSize: '0.72rem', color: '#718096' }}>{lang === 'en' ? 'Available Area (m²)' : '可用面积（m²）'}</div>
            </div>
            <div style={{ textAlign: 'center', background: 'white', borderRadius: '8px', padding: '0.65rem' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#276749' }}>{maxSets}</div>
              <div style={{ fontSize: '0.72rem', color: '#718096' }}>{lang === 'en' ? 'Max Installable Sets' : '最多可安装套数'}</div>
            </div>
            <div style={{ textAlign: 'center', background: 'white', borderRadius: '8px', padding: '0.65rem' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2b6cb0' }}>
                {(maxSets * areaPerSet).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#718096' }}>{lang === 'en' ? 'Estimated Footprint (m²)' : '预计占用面积（m²）'}</div>
            </div>
          </div>

          {/* 各套数预览 */}
          <div style={{ marginTop: '0.85rem', borderTop: '1px solid #c6f6d5', paddingTop: '0.85rem' }}>
            <div style={{ fontSize: '0.82rem', color: '#4a5568', marginBottom: '0.5rem', fontWeight: 600 }}>
              {lang === 'en' ? 'PV capacity per set count:' : '可选套数对应 PV 容量：'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {Array.from({ length: maxSets }, (_, i) => i + 1).map(n => (
                <span key={n} style={{
                  padding: '0.25rem 0.7rem',
                  background: '#e6fffa',
                  border: '1px solid #81e6d9',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  color: '#2c7a7b',
                }}>
                  {n} {lang === 'en' ? 'sets' : '套'} → {calcPvKw(n, '655W', bracketModel).toFixed(1)} kW
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#718096' }}>
            {lang === 'en'
              ? `Optimization will automatically search for the best configuration within 1 ~ ${maxSets} sets`
              : `优化计算将在 1 ~ ${maxSets} 套范围内自动寻找最佳配置方案`}
          </div>
        </div>
      )}

    </div>
  );
}
