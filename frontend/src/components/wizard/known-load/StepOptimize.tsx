/**
 * StepOptimize.tsx
 * ──────────────────────────────────────────────────────────────
 * 自动定容优化步骤。
 *
 * 柴发信息来自 Step 3（已在前面选择），此处只读显示，不重复输入。
 * 唯一可调约束：场地面积（影响最大 PV 套数）。
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ConfigData, OptimizeOption } from '@/types/index';
import { optimizeMicrogrid } from '@/api/client';
import { type AreaUnit, formatAreaDual, formatAreaSingle, sqftToSqm, sqmToSqft } from '@/utils/unitFormat';

// ── 常量 ─────────────────────────────────────────────────────
const AREA_PER_SET_M2 = 260;   // 每套标准支架占地 ≈ 260 m²

function formatAreaInputValue(areaM2?: number | null, unit: AreaUnit = 'm2'): string {
  if (!areaM2 || areaM2 <= 0) return '';
  const displayValue = unit === 'm2' ? areaM2 : sqmToSqft(areaM2);
  const rounded = Math.round(displayValue * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function parseAreaInputValue(area: string, unit: AreaUnit): number | null {
  const numeric = parseFloat(area);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return unit === 'm2' ? numeric : sqftToSqm(numeric);
}

function getInputWidth(value: string, minimumChars = 8): string {
  return `${Math.max(minimumChars, value.trim().length + 2)}ch`;
}

// ── 三者协同原理 ──────────────────────────────────────────────
function DesignLogic() {
  return (
    <div style={{
      background: '#fffde7', borderRadius: '12px', padding: '0.9rem 1.1rem',
      marginBottom: '1.1rem', borderLeft: '4px solid #f6c343',
      fontSize: '0.83rem', lineHeight: 1.7, color: '#744210',
    }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
        三者协同：柴发覆峰值 · 光伏主供电 · 储能缓波动
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.6rem' }}>
        {[
          { icon: '', t: '柴发', r: '峰值×1.2', n: '减→省钱/增风险' },
          { icon: '', t: '光伏', r: 'PV年发≈负荷×80%', n: '增→省油/CAPEX↑' },
          { icon: '', t: '储能', r: 'PV×3h×储能天', n: '增→SF↑/成本↑' },
        ].map(i => (
          <div key={i.t} style={{ background: '#fff8dc', borderRadius: '7px', padding: '0.45rem 0.7rem' }}>
            <div style={{ fontWeight: 700 }}>{i.t}</div>
            <code style={{ fontSize: '0.76rem' }}>{i.r}</code>
            <div style={{ fontSize: '0.75rem', color: '#92400e' }}>{i.n}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '0.55rem', paddingTop: '0.4rem', borderTop: '1px solid #fde68a', fontSize: '0.82rem' }}>
        最优区间：太阳能占比 <strong>70~90%</strong>，回本 <strong>4~6 年</strong>，10年NPV &gt; 0
      </div>
    </div>
  );
}

// ── 约束条件面板（仅场地面积）────────────────────────────────
interface ConstraintPanelProps {
  // 柴发信息（只读，来自 Step 3）
  hasGenerator:     boolean;
  dieselCapacityKw: number;
  dieselIsNew:      boolean;
  // 场地面积约束
  hasAreaLimit:    boolean;
  availableArea:   string;
  areaInputUnit:   AreaUnit;
  onHasAreaLimit:  (v: boolean) => void;
  onAreaInput:     (v: string)  => void;
  onAreaUnitInput: (v: AreaUnit) => void;
}

function ConstraintPanel({
  hasGenerator, dieselCapacityKw, dieselIsNew,
  hasAreaLimit, availableArea, areaInputUnit, onHasAreaLimit, onAreaInput, onAreaUnitInput,
}: ConstraintPanelProps) {
  const areaM2 = parseAreaInputValue(availableArea, areaInputUnit) ?? 0;
  const maxSetsFromArea = areaM2 > 0 ? Math.max(1, Math.floor(areaM2 / AREA_PER_SET_M2)) : 0;

  // 柴发状态描述
  let dieselStatusText = '';
  let dieselStatusColor = '';
  if (!hasGenerator) {
    dieselStatusText  = '无柴发（系统自动定容）';
    dieselStatusColor = '#718096';
  } else if (!dieselIsNew) {
    dieselStatusText  = `已有 ${dieselCapacityKw} kW 柴发 → 不计入报价（CAPEX 节省约 $${(dieselCapacityKw * 500).toLocaleString()}）`;
    dieselStatusColor = '#276749';
  } else {
    dieselStatusText  = `新购 ${dieselCapacityKw > 0 ? dieselCapacityKw + ' kW' : '（自动定容）'} 柴发 → 计入 CAPEX`;
    dieselStatusColor = '#92400e';
  }

  return (
    <div style={{
      background: '#f7fafc', borderRadius: '12px', padding: '1rem 1.25rem',
      marginBottom: '1.1rem', border: '1px solid #e2e8f0',
    }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#2d3748', marginBottom: '0.75rem' }}>
        优化约束条件
      </div>

      {/* 柴发状态（只读，来自 Step 3） */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        marginBottom: '0.75rem', padding: '0.5rem 0.75rem',
        background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0',
      }}>
        <span style={{ fontSize: '0.75rem', color: '#a0aec0', fontWeight: 600, letterSpacing: '0.03em' }}>柴发</span>
        <div>
          <div style={{ fontSize: '0.82rem', color: '#718096' }}>
            柴油发电机
            <span style={{
              marginLeft: '0.5rem', fontSize: '0.73rem', background: '#edf2f7',
              borderRadius: '4px', padding: '1px 6px', color: '#4a5568',
            }}>
              已在第3步选择
            </span>
          </div>
          <div style={{ fontSize: '0.87rem', fontWeight: 600, color: dieselStatusColor }}>
            {dieselStatusText}
          </div>
        </div>
      </div>

      {/* 场地面积约束 */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={hasAreaLimit}
            onChange={e => onHasAreaLimit(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 600, color: '#4a5568', fontSize: '0.88rem' }}>
            场地面积有限（限制最大光伏套数）
          </span>
        </label>

        {hasAreaLimit && (
          <div style={{ marginLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                background: '#edf2f7',
                borderRadius: '999px',
                padding: '0.15rem',
                gap: '0.15rem',
              }}
            >
              {(['m2', 'ft2'] as const).map(unit => {
                const active = areaInputUnit === unit;
                return (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => onAreaUnitInput(unit)}
                    style={{
                      border: 'none',
                      borderRadius: '999px',
                      padding: '0.28rem 0.7rem',
                      background: active ? '#1a365d' : 'transparent',
                      color: active ? '#fff' : '#4a5568',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    {unit === 'm2' ? 'm²' : 'ft²'}
                  </button>
                );
              })}
            </div>
            <input
              type="number"
              value={availableArea}
              onChange={e => onAreaInput(e.target.value)}
              placeholder={areaInputUnit === 'm2' ? '如 600' : '如 6460'}
              min={1}
              style={{
                width: getInputWidth(availableArea, 8), padding: '0.35rem 0.6rem', borderRadius: '6px',
                border: '1px solid #cbd5e0', fontSize: '0.9rem',
              }}
            />
            <span style={{ color: '#718096', fontSize: '0.85rem' }}>{areaInputUnit === 'm2' ? 'm²' : 'ft²'}</span>
            {areaM2 > 0 && (
              <span style={{
                background: '#ebf8ff', color: '#2b6cb0', borderRadius: '6px',
                padding: '3px 10px', fontSize: '0.82rem', fontWeight: 600,
              }}>
                最多可装 {maxSetsFromArea} 套支架
                <span style={{ color: '#718096', fontWeight: 400 }}>
                  （每套约 {formatAreaDual(AREA_PER_SET_M2, 'zh').combined}）
                </span>
              </span>
            )}
            <div style={{ width: '100%', fontSize: '0.78rem', color: '#718096' }}>
              当前按 {areaInputUnit === 'm2' ? 'm²' : 'ft²'} 输入，内部统一换算为 m²。
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 最优/次优/第三 对比卡 ───────────────────────────────────────
interface TopCardProps {
  opt:      OptimizeOption;
  kind:     'best' | 'runner' | 'third';
  selected: boolean;
  onSelect: () => void;
}

function TopCard({ opt, kind, selected, onSelect }: TopCardProps) {
  const accent   = kind === 'best' ? '#2b6cb0' : kind === 'runner' ? '#276749' : '#744210';
  const bgLight  = kind === 'best' ? '#ebf8ff'  : kind === 'runner' ? '#f0fff4' : '#fffde7';
  const badge    = kind === 'best' ? '方案1  最优推荐' : kind === 'runner' ? '方案2  次优推荐' : '方案3  备选方案';
  const payColor = opt.paybackYears <= 5 ? '#276749' : opt.paybackYears <= 7 ? '#92400e' : '#c53030';

  return (
    <div
      onClick={onSelect}
      style={{
        border: `2px solid ${selected ? accent : '#cbd5e0'}`,
        borderRadius: '14px', padding: '1rem 1.15rem',
        background: selected ? bgLight : '#fff',
        cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: selected ? `0 0 0 3px ${accent}44` : '0 1px 3px #0002',
        flex: 1, minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <span style={{
          background: accent, color: '#fff', borderRadius: '999px',
          padding: '2px 10px', fontSize: '0.76rem', fontWeight: 700,
        }}>
          {badge}
        </span>
        {selected && (
          <span style={{
            background: accent, color: '#fff', borderRadius: '999px',
            padding: '2px 8px', fontSize: '0.74rem', fontWeight: 700,
          }}>
            已选
          </span>
        )}
        {!opt.dieselIsNew && opt.dieselKw > 0 && (
          <span style={{ color: '#718096', fontSize: '0.75rem', marginLeft: 'auto' }}>
            柴发已有
          </span>
        )}
      </div>

      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#2d3748', marginBottom: '0.4rem' }}>
        {opt.bracketSets} 套支架 · {opt.numPacks} 包储能 · {opt.dieselKw} kW 柴发
      </div>
      <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '0.65rem' }}>
        PV {opt.pvKw.toFixed(1)} kWp &nbsp;|&nbsp; {opt.batteryKwh} kWh 储能
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
        {[
          { l: '系统售价',   v: `$${opt.sellingPriceUsd.toLocaleString()}`,        c: '#2d3748' },
          { l: '静态回本',   v: `${opt.paybackYears} 年`,                           c: payColor },
          { l: '太阳能占比', v: `${opt.solarFractionPct}%`,                          c: opt.solarFractionPct >= 70 ? '#276749' : '#92400e' },
          { l: '10年NPV',   v: `$${(opt.npv10yrUsd / 1000).toFixed(0)}k`,         c: opt.npv10yrUsd > 0 ? '#276749' : '#c53030' },
          { l: '年均节省',   v: `$${opt.annualSavingsUsd.toLocaleString()}/年`,     c: '#2b6cb0' },
          { l: '微网耗油',   v: `${opt.annualDieselLiters.toLocaleString()} L/年`, c: '#718096' },
        ].map(m => (
          <div key={m.l} style={{
            background: '#f7fafc', borderRadius: '6px',
            padding: '0.3rem 0.55rem', fontSize: '0.8rem',
          }}>
            <div style={{ color: '#718096' }}>{m.l}</div>
            <div style={{ fontWeight: 700, color: m.c, fontSize: '0.9rem' }}>{m.v}</div>
          </div>
        ))}
      </div>

      <button
        onClick={e => { e.stopPropagation(); onSelect(); }}
        style={{
          marginTop: '0.65rem', width: '100%', padding: '0.45rem',
          borderRadius: '7px', border: 'none',
          background: selected ? accent : '#e2e8f0',
          color: selected ? '#fff' : '#4a5568',
          fontWeight: 700, cursor: 'pointer', fontSize: '0.86rem',
        }}
      >
        {selected ? '已选此方案' : '选择此方案'}
      </button>
    </div>
  );
}

// ── 其余方案行 ────────────────────────────────────────────────
function OtherRow({ opt, selected, onSelect }: {
  opt: OptimizeOption; selected: boolean; onSelect: () => void;
}) {
  const pc = opt.paybackYears <= 5 ? '#276749'
    : opt.paybackYears <= 7 ? '#92400e' : '#c53030';
  const rowBg = selected ? '#dbeafe'
    : opt.isRecommended ? '#ebf8ff'
    : opt.isRunnerUp     ? '#f0fff4'
    : opt.isThird        ? '#fffde7'
    : undefined;

  return (
    <tr onClick={onSelect} style={{ cursor: 'pointer', background: rowBg, transition: 'background 0.1s' }}>
      <td style={{ padding: '0.45rem 0.7rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {opt.isRecommended ? '▲' : opt.isRunnerUp ? '△' : opt.isThird ? '○' : ''} {opt.bracketSets} 套
        {selected && <span style={{ color: '#2b6cb0', marginLeft: '4px', fontSize: '0.75rem', fontWeight: 700 }}>(已选)</span>}
      </td>
      <td style={{ padding: '0.45rem 0.7rem' }}>{opt.pvKw.toFixed(1)} kWp</td>
      <td style={{ padding: '0.45rem 0.7rem' }}>{opt.numPacks}包 ({opt.batteryKwh} kWh)</td>
      <td style={{ padding: '0.45rem 0.7rem', color: opt.solarFractionPct >= 70 ? '#276749' : '#92400e', fontWeight: 600 }}>
        {opt.solarFractionPct}%
      </td>
      <td style={{ padding: '0.45rem 0.7rem' }}>${opt.sellingPriceUsd.toLocaleString()}</td>
      <td style={{ padding: '0.45rem 0.7rem', color: pc, fontWeight: 600 }}>{opt.paybackYears} 年</td>
      <td style={{ padding: '0.45rem 0.7rem', color: opt.npv10yrUsd > 0 ? '#276749' : '#c53030' }}>
        ${(opt.npv10yrUsd / 1000).toFixed(0)}k
      </td>
      <td style={{ padding: '0.45rem 0.7rem', color: '#2b6cb0', fontWeight: 600 }}>
        ${opt.annualSavingsUsd.toLocaleString()}
      </td>
    </tr>
  );
}

// ── 主组件 ───────────────────────────────────────────────────
interface StepOptimizeProps {
  annualLoadKwh:    number;
  dieselPriceUsd:   number;
  // 柴发信息（来自 Step 3，直接使用，不重复选择）
  hasGenerator:     boolean;
  dieselCapacityKw: number;
  dieselIsNew:      boolean;
  panelModel:       string;
  batteryPackModel: string;
  onSelect: (updates: Partial<ConfigData>) => void;
}

export default function StepOptimize({
  annualLoadKwh, dieselPriceUsd,
  hasGenerator, dieselCapacityKw, dieselIsNew,
  panelModel, batteryPackModel,
  onSelect,
}: StepOptimizeProps) {
  // ── 仅保留场地面积约束 ─────────────────────────────────
  const [hasAreaLimit,  setHasAreaLimit]  = useState(false);
  const [availableArea, setAvailableArea] = useState('');
  const [areaInputUnit, setAreaInputUnit] = useState<AreaUnit>('m2');

  // ── 结果状态 ──────────────────────────────────────────
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [options,     setOptions]     = useState<OptimizeOption[]>([]);
  const [dieselKw,    setDieselKw]    = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showAll,     setShowAll]     = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 柴发约束派生 ───────────────────────────────────────
  // 已有柴发（Step 3 选了"现有"）→ 告知优化器不新购、用已知容量
  // 新购柴发（Step 3 选了"新购"）→ 若容量已知则固定，否则自动定容
  // 无柴发 → existingDieselKw = 0（无柴发系统）
  const existingDieselKw = !hasGenerator
    ? undefined                                  // 自动定容（无柴发系统）
    : !dieselIsNew
      ? dieselCapacityKw                         // 已有柴发
      : undefined;                               // 新购 → 自动定容或固定容量
  const effectiveDieselIsNew = hasGenerator && dieselIsNew;

  const runOptimize = useCallback(async (areaLimit: boolean, areaStr: string, areaUnit: AreaUnit) => {
    if (annualLoadKwh <= 0) return;
    setLoading(true);
    setError(null);
    setOptions([]);
    setSelectedIdx(null);
    try {
      const areaM2 = areaLimit ? parseAreaInputValue(areaStr, areaUnit) : null;

      const resp = await optimizeMicrogrid({
        annualLoadKwh,
        dieselPriceUsdPerLiter: dieselPriceUsd,
        dieselIsNew:      effectiveDieselIsNew,
        panelModel,
        batteryPackModel,
        maxBracketSets:   8,
        objective:        'payback',
        availableAreaM2:  areaM2,
        existingDieselKw: existingDieselKw ?? null,
      });
      if (!resp.success) throw new Error(resp.error ?? '优化失败');
      const opts = resp.options ?? [];
      setOptions(opts);
      setDieselKw(resp.dieselKw ?? 0);
      const bestIdx = opts.findIndex(o => o.isRecommended);
      const idx = bestIdx >= 0 ? bestIdx : 0;
      if (opts.length > 0) {
        setSelectedIdx(idx);
        applyOption(opts[idx]);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        msg.includes('fetch') || msg.includes('Failed')
          ? 'API 未连接，请先启动后端：\n  cd Micro\\\\backend\n  python app/main.py'
          : msg,
      );
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annualLoadKwh, dieselPriceUsd, effectiveDieselIsNew, existingDieselKw, panelModel, batteryPackModel]);

  useEffect(() => {
    runOptimize(hasAreaLimit, availableArea, areaInputUnit);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleRerun = useCallback((al: boolean, aa: string, unit: AreaUnit) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runOptimize(al, aa, unit), 500);
  }, [runOptimize]);

  function handleAreaLimit(v: boolean) {
    setHasAreaLimit(v);
    scheduleRerun(v, availableArea, areaInputUnit);
  }
  function handleAreaInput(v: string) {
    setAvailableArea(v);
    scheduleRerun(hasAreaLimit, v, areaInputUnit);
  }
  function handleAreaUnitInput(nextUnit: AreaUnit) {
    if (nextUnit === areaInputUnit) return;
    const normalizedAreaM2 = parseAreaInputValue(availableArea, areaInputUnit);
    const nextArea = normalizedAreaM2 ? formatAreaInputValue(normalizedAreaM2, nextUnit) : '';
    setAreaInputUnit(nextUnit);
    setAvailableArea(nextArea);
    scheduleRerun(hasAreaLimit, nextArea, nextUnit);
  }

  function applyOption(opt: OptimizeOption) {
    onSelect({
      bracketSets:      opt.bracketSets,
      hasGenerator:     opt.dieselKw > 0,
      dieselCapacityKw: opt.dieselKw,
      dieselIsNew:      opt.dieselIsNew,
      batteryPackModel,
      storageDays: 1,
    });
  }
  function handleSelect(idx: number) {
    setSelectedIdx(idx);
    applyOption(options[idx]);
  }

  const bestOpt   = options.find(o => o.isRecommended);
  const runnerOpt = options.find(o => o.isRunnerUp);
  const thirdOpt  = options.find(o => o.isThird);

  // 约束标签
  const constraintTags: string[] = [];
  const constrainedAreaM2 = hasAreaLimit ? parseAreaInputValue(availableArea, areaInputUnit) : null;
  if (constrainedAreaM2) {
    const mx = Math.max(1, Math.floor(constrainedAreaM2 / AREA_PER_SET_M2));
    const areaDual = formatAreaDual(constrainedAreaM2, 'zh');
    const alternateArea = areaInputUnit === 'm2' ? areaDual.secondary : areaDual.primary;
    constraintTags.push(`面积 ${formatAreaSingle(constrainedAreaM2, areaInputUnit, 'zh')}（约 ${alternateArea}）→ 最多 ${mx} 套`);
  }

  return (
    <div>
      <DesignLogic />

      {/* ── 约束面板 ── */}
      <ConstraintPanel
        hasGenerator={hasGenerator}
        dieselCapacityKw={dieselCapacityKw}
        dieselIsNew={dieselIsNew}
        hasAreaLimit={hasAreaLimit}
        availableArea={availableArea}
        areaInputUnit={areaInputUnit}
        onHasAreaLimit={handleAreaLimit}
        onAreaInput={handleAreaInput}
        onAreaUnitInput={handleAreaUnitInput}
      />

      {/* 加载中 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#4a5568' }}>
          <div style={{ marginBottom: '0.4rem' }} />
          <div>
            正在{constraintTags.length ? `按约束（${constraintTags.join('、')}）` : ''}
            为 <strong>{annualLoadKwh.toLocaleString()} kWh/年</strong> 扫描最优方案…
          </div>
        </div>
      )}

      {/* 错误 */}
      {error && (
        <div style={{
          background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '10px',
          padding: '1rem', color: '#c53030', fontSize: '0.87rem',
          whiteSpace: 'pre-line', marginBottom: '1rem',
        }}>
          <strong>{error}</strong>
          <button
            onClick={() => runOptimize(hasAreaLimit, availableArea, areaInputUnit)}
            style={{
              marginTop: '0.6rem', padding: '4px 14px', borderRadius: '6px',
              background: '#e53e3e', color: '#fff', border: 'none',
              cursor: 'pointer', display: 'block',
            }}
          >
            重试
          </button>
        </div>
      )}

      {options.length > 0 && (
        <>
          {/* 结果摘要栏 */}
          <div style={{
            background: '#ebf8ff', borderRadius: '10px', padding: '0.6rem 0.9rem',
            marginBottom: '1rem', fontSize: '0.84rem', color: '#2c5282',
            display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center',
          }}>
            <span>年负荷 <strong>{annualLoadKwh.toLocaleString()} kWh</strong></span>
            <span>→ 柴发 <strong>{dieselKw} kW</strong>
              {!hasGenerator ? '' : dieselIsNew ? '（新购）' : '（已有）'}
            </span>
            <span>→ 共 <strong>{options.length}</strong> 套方案</span>
            {constraintTags.map((t, i) => (
              <span key={i} style={{
                background: '#bee3f8', borderRadius: '6px',
                padding: '2px 8px', fontSize: '0.78rem', color: '#2a4365',
              }}>
                {t}
              </span>
            ))}
          </div>

          {/* ── 方案1 / 方案2 / 方案3 对比卡 ── */}
          {(bestOpt || runnerOpt || thirdOpt) && (
            <div style={{ display: 'flex', gap: '0.9rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {bestOpt && (
                <TopCard opt={bestOpt} kind="best"
                  selected={selectedIdx === options.indexOf(bestOpt)}
                  onSelect={() => handleSelect(options.indexOf(bestOpt))} />
              )}
              {runnerOpt && (
                <TopCard opt={runnerOpt} kind="runner"
                  selected={selectedIdx === options.indexOf(runnerOpt)}
                  onSelect={() => handleSelect(options.indexOf(runnerOpt))} />
              )}
              {thirdOpt && (
                <TopCard opt={thirdOpt} kind="third"
                  selected={selectedIdx === options.indexOf(thirdOpt)}
                  onSelect={() => handleSelect(options.indexOf(thirdOpt))} />
              )}
            </div>
          )}

          {/* 对比提示 */}
          {bestOpt && runnerOpt && (
            <div style={{
              background: '#f7fafc', borderRadius: '8px', padding: '0.6rem 0.9rem',
              fontSize: '0.82rem', color: '#4a5568', marginBottom: '0.9rem',
              borderLeft: '3px solid #a0aec0',
            }}>
              <strong>方案对比：</strong>
              方案1 {bestOpt.bracketSets}套（回本 {bestOpt.paybackYears}yr，SF {bestOpt.solarFractionPct}%）
              <span style={{ margin: '0 0.4rem', color: '#cbd5e0' }}>|</span>
              方案2 {runnerOpt.bracketSets}套（回本 {runnerOpt.paybackYears}yr，SF {runnerOpt.solarFractionPct}%）
              {thirdOpt && (
                <>
                  <span style={{ margin: '0 0.4rem', color: '#cbd5e0' }}>|</span>
                  方案3 {thirdOpt.bracketSets}套（回本 {thirdOpt.paybackYears}yr，SF {thirdOpt.solarFractionPct}%）
                </>
              )}
              <span style={{ marginLeft: '0.6rem', color: '#a0aec0' }}>· 选中后可在后续步骤微调</span>
            </div>
          )}

          {/* ── 全部方案折叠表格 ── */}
          <div>
            <button
              onClick={() => setShowAll(v => !v)}
              style={{
                background: 'none', border: 'none', color: '#3182ce',
                cursor: 'pointer', fontSize: '0.84rem', padding: '0.2rem 0',
                marginBottom: '0.4rem',
              }}
            >
              {showAll ? '▲ 收起' : `▼ 查看全部 ${options.length} 套方案`}
            </button>
            {showAll && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse',
                  fontSize: '0.82rem', color: '#4a5568',
                }}>
                  <thead>
                    <tr style={{ background: '#edf2f7', textAlign: 'left' }}>
                      {['套数', 'PV', '储能', 'SF', '售价', '回本', 'NPV10', '年节省'].map(h => (
                        <th key={h} style={{ padding: '0.45rem 0.7rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {options.map((opt, idx) => (
                      <OtherRow key={opt.bracketSets} opt={opt}
                        selected={selectedIdx === idx}
                        onSelect={() => handleSelect(idx)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 已选提示 */}
          {selectedIdx !== null && options[selectedIdx] && (() => {
            const sel = options[selectedIdx];
            return (
              <div style={{
                background: '#f0fff4', borderRadius: '10px', padding: '0.7rem 0.9rem',
                marginTop: '0.75rem', fontSize: '0.86rem', color: '#276749',
                borderLeft: '4px solid #38a169',
              }}>
                已选 <strong>{sel.bracketSets} 套</strong>方案
                （{sel.pvKw.toFixed(1)} kWp PV + {sel.numPacks}包 {sel.batteryKwh} kWh储能 +&nbsp;
                {sel.dieselKw} kW 柴发{sel.dieselIsNew ? '（新购）' : '（已有）'}），
                回本 <strong>{sel.paybackYears} 年</strong>，SF <strong>{sel.solarFractionPct}%</strong>。
                <span style={{ color: '#2f855a', marginLeft: '0.4rem' }}>点击「下一步」继续微调。</span>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
