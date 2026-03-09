/**
 * StepDIYCurrent.tsx — DIY流程 Step 2: 电流输入 → 自动推算逆变器功率与数量
 *
 * 推算逻辑：
 *   单相 (120/240V): P = V × I = 240 × I (kVA → ÷ pf 0.9)
 *   三相低压 (120/208V): P = √3 × V_LL × I = 1.732 × 208 × I
 *   三相工业 (277/480V): P = √3 × V_LL × I = 1.732 × 480 × I
 *
 * 逆变器单台最大功率档位：
 *   单相：3 / 5 / 8 / 10 / 12 kW
 *   三相低压：10 / 15 / 20 / 30 kW
 *   三相工业：30 / 50 / 75 / 100 kW
 *
 * 台数 = ceil(总功率 / 单台最大)，建议不超过 6 台（超出时建议升压等级）
 */
import { useState } from 'react';
import type { ConfigData, VoltageLevel } from '@/types/index';
import { useLang } from '@/context/LangContext';

interface StepDIYCurrentProps {
  voltageLevel: VoltageLevel | null;
  requiredCurrent?: number;          // 用户输入电流 (A)
  inverterKw?: number;               // 推算出的单台逆变器功率
  inverterCount?: number;            // 推算出的逆变器台数
  totalInverterKw?: number;          // 推算出的总逆变器功率
  onUpdate: (data: Partial<ConfigData>) => void;
}

// ── 电压等级参数 ────────────────────────────────────────────────
const VOLTAGE_PARAMS: Record<VoltageLevel, {
  labelZh: string;
  labelEn: string;
  phaseFactor: number;
  ratedVoltage: number;
  isThreePhase: boolean;
  inverterSizes: number[];
}> = {
  '120V/240V': {
    labelZh: '单相 120/240V',
    labelEn: 'Single-phase 120/240V',
    phaseFactor: 1,
    ratedVoltage: 240,
    isThreePhase: false,
    inverterSizes: [3, 5, 8, 10, 12],
  },
  '120V/208V': {
    labelZh: '三相 120/208V',
    labelEn: 'Three-phase 120/208V',
    phaseFactor: Math.sqrt(3),
    ratedVoltage: 208,
    isThreePhase: true,
    inverterSizes: [10, 15, 20, 30],
  },
  '277V/480V': {
    labelZh: '三相 277/480V',
    labelEn: 'Three-phase 277/480V',
    phaseFactor: Math.sqrt(3),
    ratedVoltage: 480,
    isThreePhase: true,
    inverterSizes: [30, 50, 75, 100],
  },
};

const POWER_FACTOR = 0.9;
const MAX_RECOMMENDED_INVERTERS = 6;

/** 计算总需求功率 (kW) */
function calcTotalKw(voltageLevel: VoltageLevel, currentA: number): number {
  const p = VOLTAGE_PARAMS[voltageLevel];
  const kva = (p.ratedVoltage * currentA * (p.isThreePhase ? Math.sqrt(3) : 1)) / 1000;
  return +(kva * POWER_FACTOR).toFixed(2);
}

/** 从逆变器规格列表里选最佳单台规格（台数最少且不超过 MAX_RECOMMENDED_INVERTERS） */
function selectInverter(totalKw: number, sizes: number[]): { kw: number; count: number } {
  const sorted = [...sizes].sort((a, b) => b - a);  // 从大到小
  for (const size of sorted) {
    const count = Math.ceil(totalKw / size);
    if (count <= MAX_RECOMMENDED_INVERTERS) {
      return { kw: size, count };
    }
  }
  const maxSize = sorted[0];
  return { kw: maxSize, count: Math.ceil(totalKw / maxSize) };
}

export default function StepDIYCurrent({
  voltageLevel,
  requiredCurrent,
  onUpdate,
}: StepDIYCurrentProps) {
  const { t, lang } = useLang();
  const [inputVal, setInputVal] = useState(requiredCurrent ? String(requiredCurrent) : '');

  if (!voltageLevel) {
    return (
      <div style={{ color: '#e53e3e', padding: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
        {lang === 'en' ? 'Please go back to select a voltage level first.' : '请先返回上一步选择电压等级'}
      </div>
    );
  }

  const vp = VOLTAGE_PARAMS[voltageLevel];
  const vpLabel = lang === 'en' ? vp.labelEn : vp.labelZh;

  // ── 推算结果 ────────────────────────────────────────────────
  const currentA    = parseFloat(inputVal);
  const hasInput    = !isNaN(currentA) && currentA > 0;
  const totalKw     = hasInput ? calcTotalKw(voltageLevel, currentA) : 0;
  const { kw: invKw, count: invCount } = hasInput
    ? selectInverter(totalKw, vp.inverterSizes)
    : { kw: 0, count: 0 };
  const warning = hasInput && invCount > MAX_RECOMMENDED_INVERTERS;

  // ── 快速预设电流 ────────────────────────────────────────────
  const QUICK_CURRENTS = vp.isThreePhase
    ? [30, 60, 100, 150, 200]
    : [20, 30, 50, 80, 100];

  const handleInput = (val: string) => {
    setInputVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const total = calcTotalKw(voltageLevel, num);
      const { kw, count } = selectInverter(total, vp.inverterSizes);
      onUpdate({
        requiredCurrent:   num,
        inverterKw:        kw,
        inverterCount:     count,
        totalInverterKw:   total,
      });
    }
  };

  const handleQuick = (a: number) => {
    setInputVal(String(a));
    const total = calcTotalKw(voltageLevel, a);
    const { kw, count } = selectInverter(total, vp.inverterSizes);
    onUpdate({
      requiredCurrent:   a,
      inverterKw:        kw,
      inverterCount:     count,
      totalInverterKw:   total,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* 当前电压等级提示 */}
      <div style={{
        padding: '0.7rem 1rem',
        background: '#f0f8ff',
        borderLeft: '4px solid #3182ce',
        borderRadius: '8px',
        fontSize: '0.86rem',
        color: '#2c5282',
      }}>
        <strong>{lang === 'en' ? 'Selected Voltage: ' : '已选电压：'}</strong>{vpLabel}
        &nbsp;·&nbsp;{lang === 'en' ? 'Power formula: ' : '功率公式：'}
        {vp.isThreePhase
          ? `√3 × ${vp.ratedVoltage}V × I × PF(${POWER_FACTOR})`
          : `${vp.ratedVoltage}V × I × PF(${POWER_FACTOR})`}
      </div>

      {/* 快速预设 */}
      <div>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.5rem', fontSize: '0.93rem' }}>
          {t('diy.current.quick')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {QUICK_CURRENTS.map(a => {
            const isActive = Math.abs((parseFloat(inputVal) || 0) - a) < 0.5;
            return (
              <button
                key={a}
                onClick={() => handleQuick(a)}
                style={{
                  padding: '0.4rem 1rem',
                  fontSize: '0.88rem',
                  border: `1px solid ${isActive ? '#1a365d' : '#e2e8f0'}`,
                  borderRadius: '20px',
                  cursor: 'pointer',
                  background: isActive ? '#1a365d' : 'white',
                  color: isActive ? 'white' : '#4a5568',
                  transition: 'all 0.15s',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {a} A
              </button>
            );
          })}
        </div>
      </div>

      {/* 手动输入 */}
      <div>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.5rem', fontSize: '0.93rem' }}>
          {t('diy.current.manual')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            type="number"
            value={inputVal}
            onChange={e => handleInput(e.target.value)}
            placeholder={vp.isThreePhase ? (lang === 'en' ? 'e.g. 100' : '如：100') : (lang === 'en' ? 'e.g. 50' : '如：50')}
            min={1}
            step={1}
            style={{
              padding: '0.6rem 1rem',
              border: '1px solid #cbd5e0',
              borderRadius: '8px',
              fontSize: '1rem',
              width: '140px',
            }}
          />
          <span style={{ color: '#718096', fontSize: '0.9rem' }}>A ({lang === 'en' ? 'Amperes' : '安培'})</span>
        </div>
      </div>

      {/* ── 推算结果展示 ──────────────────────────────────────── */}
      {hasInput && (
        <div style={{
          padding: '1.1rem 1.25rem',
          background: warning ? '#fff5f5' : '#f0fff4',
          border: `1px solid ${warning ? '#fed7d7' : '#9ae6b4'}`,
          borderLeft: `4px solid ${warning ? '#fc8181' : '#38a169'}`,
          borderRadius: '10px',
        }}>
          <div style={{ fontWeight: 700, color: '#2d3748', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
            {t('diy.current.result')}
          </div>

          {/* 指标网格 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.65rem',
            marginBottom: '0.75rem',
          }}>
            {[
              { label: t('diy.current.rated'),     value: `${currentA} A`,           color: '#2b6cb0' },
              { label: t('diy.current.total_kw'),  value: `${totalKw.toFixed(1)} kW`, color: '#276749' },
              { label: t('diy.current.inv_kw'),    value: `${invKw} kW/${lang === 'en' ? 'unit' : '台'}`, color: '#276749' },
              { label: t('diy.current.inv_count'), value: `${invCount} ${lang === 'en' ? 'units' : '台'}`, color: invCount > 4 ? '#c05621' : '#276749' },
            ].map(m => (
              <div key={m.label} style={{
                textAlign: 'center', background: 'white',
                borderRadius: '8px', padding: '0.6rem',
              }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: m.color }}>
                  {m.value}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#718096' }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* 逆变器可选规格说明 */}
          <div style={{ fontSize: '0.8rem', color: '#4a5568', lineHeight: 1.6 }}>
            <strong>{t('diy.current.sizes')}</strong>
            {vp.inverterSizes.map(s => (
              <span
                key={s}
                style={{
                  display: 'inline-block',
                  marginLeft: '0.4rem',
                  padding: '0.1rem 0.5rem',
                  borderRadius: '10px',
                  background: s === invKw ? '#276749' : '#e2e8f0',
                  color: s === invKw ? 'white' : '#4a5568',
                  fontWeight: s === invKw ? 700 : 400,
                  fontSize: '0.78rem',
                }}
              >
                {s} kW{s === invKw ? ` ${t('diy.current.recommended')}` : ''}
              </span>
            ))}
          </div>

          {/* 警告：台数过多 */}
          {warning && (
            <div style={{
              marginTop: '0.65rem',
              padding: '0.6rem 0.9rem',
              background: '#fff5f5',
              border: '1px solid #fed7d7',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: '#c53030',
            }}>
              {t('diy.current.warning').replace('{count}', String(invCount))}
              {/* fallback for older translation without placeholder */}
              {!t('diy.current.warning').includes('{count}') && ` (${invCount} ${lang === 'en' ? 'units' : '台'})`}
            </div>
          )}
        </div>
      )}

      {/* 参考说明 */}
      <div style={{
        padding: '0.75rem 1rem',
        background: '#fffaf0',
        borderLeft: '3px solid #ed8936',
        borderRadius: '6px',
        fontSize: '0.81rem',
        color: '#744210',
        lineHeight: 1.6,
      }}>
        {t('info.diy.current')}
      </div>

    </div>
  );
}
