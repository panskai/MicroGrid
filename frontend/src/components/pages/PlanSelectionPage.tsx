import { useState, type ReactNode } from 'react';
import type { OptimizeOption } from '@/types/index';
import { useLang } from '@/context/LangContext';
import { formatVolumeDual } from '@/utils/unitFormat';

interface PlanSelectionPageProps {
  options: OptimizeOption[];
  dieselKw: number;
  annualLoadKwh: number;
  isLoadingDetail: boolean;
  onSelect: (opt: OptimizeOption) => void;
  onBack: () => void;
}

function MetricBox({ label, value, color }: { label: string; value: ReactNode; color?: string }) {
  return (
    <div
      style={{
        background: '#f7fafc',
        borderRadius: '10px',
        padding: '0.75rem 0.9rem',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: color ?? '#2d3748' }}>{value}</div>
    </div>
  );
}

export default function PlanSelectionPage({
  options,
  dieselKw,
  annualLoadKwh,
  isLoadingDetail,
  onSelect,
  onBack,
}: PlanSelectionPageProps) {
  const { t, lang } = useLang();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [pendingIdx, setPendingIdx] = useState<number | null>(null);

  const topOptions = options
    .filter(o => o.isRecommended || o.isRunnerUp || o.isThird)
    .slice(0, 3);

  const displayOptions = topOptions.length >= 3
    ? topOptions
    : options.slice(0, Math.min(3, options.length));

  const planStyles = [
    { accent: '#2b6cb0', bg: '#ebf8ff', badgeLabel: t('plan.badge.best') },
    { accent: '#276749', bg: '#f0fff4', badgeLabel: t('plan.badge.second') },
    { accent: '#744210', bg: '#fffde7', badgeLabel: t('plan.badge.third') },
  ];

  function getStyle(opt: OptimizeOption, idx: number) {
    if (opt.isRecommended) return planStyles[0];
    if (opt.isRunnerUp) return planStyles[1];
    if (opt.isThird) return planStyles[2];
    return planStyles[idx] ?? planStyles[2];
  }

  function handleSelect(opt: OptimizeOption, idx: number) {
    if (isLoadingDetail) return;
    setPendingIdx(idx);
    onSelect(opt);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #e8f4fd 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          background: '#1a365d',
          padding: '0.85rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <button
          onClick={onBack}
          disabled={isLoadingDetail}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            borderRadius: '8px',
            padding: '0.4rem 1rem',
            cursor: isLoadingDetail ? 'not-allowed' : 'pointer',
            fontSize: '0.87rem',
            opacity: isLoadingDetail ? 0.5 : 1,
          }}
        >
          {t('btn.back_modify')}
        </button>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.04em' }}>
          {t('plan.title')}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
          {lang === 'en' ? 'Annual Load' : '年用电量'} {annualLoadKwh.toLocaleString()} kWh · {lang === 'en' ? 'Diesel' : '柴发'} {dieselKw} kW
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: '2rem 2.5rem',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a365d', margin: '0 0 0.5rem' }}>
            {lang === 'en'
              ? `System Recommends ${displayOptions.length} Plans for You`
              : `系统为您推荐以下 ${displayOptions.length} 套方案`}
          </h2>
          <p style={{ color: '#718096', fontSize: '0.97rem', margin: 0 }}>
            {t('plan.subtitle')}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${displayOptions.length}, 1fr)`,
            gap: '1.5rem',
            marginBottom: '2rem',
            alignItems: 'stretch',
          }}
        >
          {displayOptions.map((opt, idx) => {
            const style = getStyle(opt, idx);
            const isHover = hoveredIdx === idx;
            const isPending = pendingIdx === idx && isLoadingDetail;
            const payColor = opt.paybackYears <= 5 ? '#276749' : opt.paybackYears <= 7 ? '#92400e' : '#c53030';
            const dieselUse = formatVolumeDual(opt.annualDieselLiters, lang);

            return (
              <div
                key={opt.bracketSets}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  background: '#fff',
                  borderRadius: '18px',
                  border: `2px solid ${isHover ? style.accent : '#e2e8f0'}`,
                  boxShadow: isHover ? `0 12px 40px ${style.accent}40` : '0 3px 12px rgba(0,0,0,0.09)',
                  overflow: 'hidden',
                  transition: 'all 0.22s',
                  transform: isHover ? 'translateY(-6px)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ background: style.accent, padding: '1.3rem 1.5rem', color: '#fff' }}>
                  <div
                    style={{
                      display: 'inline-block',
                      background: 'rgba(255,255,255,0.22)',
                      borderRadius: '999px',
                      padding: '4px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      marginBottom: '0.65rem',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {style.badgeLabel}
                  </div>
                  <div style={{ fontSize: '1.55rem', fontWeight: 800, marginBottom: '0.3rem' }}>
                    {opt.bracketSets} {lang === 'en' ? 'Bracket Sets' : '套折叠支架'}
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.88 }}>
                    {opt.pvKw.toFixed(1)} kWp PV · {opt.batteryKwh} kWh {lang === 'en' ? 'Storage' : '储能'} · {opt.dieselKw} kW {lang === 'en' ? 'Diesel' : '柴发'}
                  </div>
                </div>

                <div style={{ padding: '1.3rem 1.5rem', flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.1rem' }}>
                    <MetricBox label={t('plan.payback')} value={`${opt.paybackYears} ${lang === 'en' ? 'yr' : '年'}`} color={payColor} />
                    <MetricBox label={t('plan.solar_frac')} value={`${opt.solarFractionPct}%`} color={opt.solarFractionPct >= 70 ? '#276749' : '#92400e'} />
                    <MetricBox label={t('plan.npv')} value={`$${(opt.npv10yrUsd / 1000).toFixed(0)}k`} color={opt.npv10yrUsd > 0 ? '#276749' : '#c53030'} />
                    <MetricBox label={t('plan.annual_saving')} value={`$${opt.annualSavingsUsd.toLocaleString()}`} color="#2b6cb0" />
                    <MetricBox
                      label={t('plan.diesel_usage')}
                      value={
                        <>
                          <div>{dieselUse.primary}</div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#718096' }}>{dieselUse.secondary}</div>
                        </>
                      }
                      color="#718096"
                    />
                    <MetricBox label={t('plan.fuel_saving')} value={`${Math.round((1 - opt.annualDieselLiters / opt.annualDieselOnlyLiters) * 100)}%`} color="#276749" />
                  </div>

                  <div
                    style={{
                      background: opt.dieselIsNew ? '#fff5f5' : '#f0fff4',
                      border: `1px solid ${opt.dieselIsNew ? '#fed7d7' : '#9ae6b4'}`,
                      borderRadius: '8px',
                      padding: '0.55rem 0.9rem',
                      fontSize: '0.85rem',
                      color: opt.dieselIsNew ? '#c53030' : '#276749',
                      marginBottom: '1.1rem',
                    }}
                  >
                    {lang === 'en' ? 'Diesel' : '柴发'} {opt.dieselKw} kW · {opt.dieselIsNew ? t('plan.diesel.new') : t('plan.diesel.existing')}
                  </div>

                  <div style={{ fontSize: '0.83rem', color: '#718096', borderTop: '1px solid #edf2f7', paddingTop: '0.75rem' }}>
                    {lang === 'en' ? 'Diesel-only annual cost ~' : '纯柴油年费用约 '}
                    ${opt.annualDieselOnlyCostUsd.toLocaleString()}
                    {lang === 'en' ? ', microgrid saves ~ ' : '，微电网可节省约 '}
                    <strong style={{ color: '#276749' }}>
                      ${opt.annualSavingsUsd.toLocaleString()}{lang === 'en' ? '/yr' : '/年'}
                    </strong>
                  </div>
                </div>

                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                  <button
                    onClick={() => handleSelect(opt, idx)}
                    disabled={isLoadingDetail}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: isPending || isHover ? style.accent : style.bg,
                      color: isPending || isHover ? '#fff' : style.accent,
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: isLoadingDetail ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: isLoadingDetail && !isPending ? 0.6 : 1,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {isPending ? t('plan.loading_detail') : t('plan.select_btn')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '14px',
            padding: '1.25rem 1.75rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          }}
        >
          <div style={{ fontWeight: 700, color: '#2d3748', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
            {t('plan.notes.title')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', fontSize: '0.87rem', color: '#4a5568' }}>
            <div><span style={{ fontWeight: 600, color: '#2b6cb0' }}>{t('plan.note1.title')}</span>{t('plan.note1')}</div>
            <div><span style={{ fontWeight: 600, color: '#276749' }}>{t('plan.note2.title')}</span>{t('plan.note2')}</div>
            <div><span style={{ fontWeight: 600, color: '#744210' }}>{t('plan.note3.title')}</span>{t('plan.note3')}</div>
          </div>
          <div style={{ marginTop: '0.85rem', fontSize: '0.82rem', color: '#a0aec0', borderTop: '1px solid #f0f0f0', paddingTop: '0.7rem' }}>
            {t('plan.auto_report')}
          </div>
        </div>
      </div>
    </div>
  );
}
