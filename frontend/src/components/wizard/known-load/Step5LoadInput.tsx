/**
 * Step5LoadInput.tsx — 用电负载信息（已知负载路径）
 */
import { useState, useRef } from 'react';
import type { ConfigData, LoadType, LoadInputMode } from '@/types/index';
import { useLang } from '@/context/LangContext';

interface Step5LoadInputProps {
  annualLoadKwh?: number;
  loadType?: LoadType;
  loadInputMode?: LoadInputMode;
  peakLoadKw?: number;
  onUpdate: (data: Partial<ConfigData>) => void;
}

interface TimeSlot { label: string; hours: number; loadKw: number }

export default function Step5LoadInput({ annualLoadKwh, loadType, loadInputMode = 'annual', peakLoadKw, onUpdate }: Step5LoadInputProps) {
  const { lang, t } = useLang();
  const [mode,      setMode]      = useState<LoadInputMode>(loadInputMode);
  const [inputVal,  setInputVal]  = useState(annualLoadKwh ? String(annualLoadKwh) : '');
  const [csvError,  setCsvError]  = useState('');
  const [csvLoaded, setCsvLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // time slots - labels built from t() at render time
  const [slots, setSlots] = useState<TimeSlot[]>(() => [
    { label: 'midnight', hours: 6,  loadKw: 0 },
    { label: 'morning',  hours: 3,  loadKw: 0 },
    { label: 'forenoon', hours: 3,  loadKw: 0 },
    { label: 'afternoon',hours: 6,  loadKw: 0 },
    { label: 'evening',  hours: 4,  loadKw: 0 },
    { label: 'night',    hours: 2,  loadKw: 0 },
  ]);

  const LOAD_TYPES: { value: LoadType; label: string; desc: string; }[] = [
    { value: 'residential', label: t('load.type.residential'), desc: t('load.type.res.desc') },
    { value: 'commercial',  label: t('load.type.commercial'),  desc: t('load.type.comm.desc') },
    { value: 'industrial',  label: t('load.type.industrial'),  desc: t('load.type.ind.desc') },
  ];

  const EXAMPLES = [
    { labelKey: 'load.ex.small_res',   descKey: 'load.ex.small_res.desc',   kwh: 5_000 },
    { labelKey: 'load.ex.medium_res',  descKey: 'load.ex.medium_res.desc',  kwh: 18_000 },
    { labelKey: 'load.ex.commercial',  descKey: 'load.ex.commercial.desc',  kwh: 50_000 },
    { labelKey: 'load.ex.industrial',  descKey: 'load.ex.industrial.desc',  kwh: 131_400 },
  ];

  const MODE_TABS = [
    { key: 'annual'  as LoadInputMode, labelKey: 'load.mode.annual.label',  hintKey: 'load.mode.annual.hint' },
    { key: 'hourly'  as LoadInputMode, labelKey: 'load.mode.hourly.label',  hintKey: 'load.mode.hourly.hint' },
    { key: 'import'  as LoadInputMode, labelKey: 'load.mode.import.label',  hintKey: 'load.mode.import.hint' },
  ];

  const handleModeChange = (m: LoadInputMode) => { setMode(m); onUpdate({ loadInputMode: m }); };

  const handleKwhInput = (val: string) => {
    setInputVal(val);
    const num = parseFloat(val.replace(/,/g, ''));
    if (!isNaN(num) && num > 0) {
      const peak = Math.round(num / 365 / 8 * 10) / 10;
      onUpdate({ annualLoadKwh: num, peakLoadKw: peak });
    }
  };
  const handleExample = (kwh: number) => {
    setInputVal(String(kwh));
    const peak = Math.round(kwh / 365 / 8 * 10) / 10;
    onUpdate({ annualLoadKwh: kwh, peakLoadKw: peak });
  };

  const handleSlotChange = (idx: number, val: string) => {
    const updated = slots.map((s, i) => i === idx ? { ...s, loadKw: parseFloat(val) || 0 } : s);
    setSlots(updated);
    const annualKwh = updated.reduce((sum, s) => sum + s.loadKw * s.hours * 365, 0);
    const peakKw    = Math.max(...updated.map(s => s.loadKw));
    onUpdate({ annualLoadKwh: Math.round(annualKwh), peakLoadKw: peakKw });
  };
  const slotAnnual = slots.reduce((s, r) => s + r.loadKw * r.hours * 365, 0);
  const slotPeak   = Math.max(...slots.map(s => s.loadKw), 0);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError('');
    setCsvLoaded(false);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text  = ev.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const values: number[] = [];
        for (const line of lines) {
          const cols = line.split(/[,;\t]+/);
          const last = parseFloat(cols[cols.length - 1]);
          if (!isNaN(last) && last >= 0) values.push(last);
        }
        if (values.length < 8) {
          setCsvError(t('load.csv_err_rows'));
          return;
        }
        const annualKwh = values.length >= 8760
          ? values.reduce((s, v) => s + v, 0)
          : values.reduce((s, v) => s + v, 0) * (8760 / values.length);
        const peakKw = Math.max(...values);
        onUpdate({ annualLoadKwh: Math.round(annualKwh), peakLoadKw: Math.round(peakKw * 10) / 10 });
        setCsvLoaded(true);
      } catch {
        setCsvError(t('load.csv_err_parse'));
      }
    };
    reader.readAsText(file);
  };

  const handleLoadType = (lt: LoadType) => onUpdate({ loadType: lt });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── 输入精度提示 */}
      <div style={{ padding: '0.7rem 1rem', background: '#fffbeb', border: '1px solid #f6e05e', borderRadius: '8px', fontSize: '0.82rem', color: '#744210', lineHeight: 1.6 }}>
        {t('load.hint')}
      </div>

      {/* ── 模式切换 Tab */}
      <div>
        <div style={{ display: 'flex', gap: '0', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {MODE_TABS.map((tab, idx) => (
            <button
              key={tab.key}
              onClick={() => handleModeChange(tab.key)}
              style={{
                flex: 1, padding: '0.7rem 0.5rem',
                background: mode === tab.key ? '#1a365d' : 'white',
                color: mode === tab.key ? 'white' : '#4a5568',
                border: 'none',
                borderRight: idx < MODE_TABS.length - 1 ? '1px solid #e2e8f0' : 'none',
                cursor: 'pointer', fontSize: '0.85rem',
                fontWeight: mode === tab.key ? 700 : 400,
                transition: 'all 0.15s',
              }}
            >
              <div>{t(tab.labelKey)}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.75, marginTop: '0.15rem' }}>{t(tab.hintKey)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 模式一：年总用电量 */}
      {mode === 'annual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.6rem' }}>
              {t('load.quick_select')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {EXAMPLES.map(ex => (
                <button
                  key={ex.kwh}
                  onClick={() => handleExample(ex.kwh)}
                  style={{
                    padding: '0.4rem 0.85rem', fontSize: '0.82rem',
                    border: `1px solid ${annualLoadKwh === ex.kwh ? '#1a365d' : '#e2e8f0'}`,
                    borderRadius: '20px', cursor: 'pointer',
                    background: annualLoadKwh === ex.kwh ? '#1a365d' : 'white',
                    color: annualLoadKwh === ex.kwh ? 'white' : '#4a5568',
                    transition: 'all 0.15s',
                  }}
                >
                  {t(ex.labelKey)} — {ex.kwh.toLocaleString()} kWh
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.6rem' }}>
              {t('load.annual_kwh_label')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="text"
                value={inputVal}
                onChange={e => handleKwhInput(e.target.value)}
                placeholder={t('load.placeholder')}
                style={{ flex: 1, padding: '0.65rem 1rem', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '1rem', maxWidth: '260px' }}
              />
              <span style={{ color: '#718096', fontSize: '0.9rem' }}>{t('load.annual_kwh_unit')}</span>
            </div>
            {annualLoadKwh && annualLoadKwh > 0 && (
              <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '6px', fontSize: '0.88rem', color: '#276749' }}>
                {t('load.daily_avg')} <strong>{(annualLoadKwh / 365).toFixed(1)} kWh</strong>
                {lang === 'en' ? ', ' : '，'}
                {t('load.monthly_avg')} <strong>{Math.round(annualLoadKwh / 12).toLocaleString()} kWh</strong>
                {lang === 'en' ? ', ' : '，'}
                {t('load.est_peak')} <strong>~{peakLoadKw?.toFixed(1) ?? '—'} kW</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 模式二：时段电流 */}
      {mode === 'hourly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: 1.6 }}>
            {t('load.hourly_desc')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {slots.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: i % 2 === 0 ? '#f8f9fa' : 'white', borderRadius: '8px' }}>
                <span style={{ flex: 1, fontSize: '0.88rem', color: '#4a5568', minWidth: '160px' }}>
                  {t(`load.slot.${s.label}`)}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#a0aec0', minWidth: '40px' }}>
                  {s.hours}h
                </span>
                <input
                  type="number"
                  value={s.loadKw || ''}
                  onChange={e => handleSlotChange(i, e.target.value)}
                  placeholder="0"
                  min={0} step={0.5}
                  style={{ width: '90px', padding: '0.4rem 0.6rem', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '0.95rem', textAlign: 'right' }}
                />
                <span style={{ fontSize: '0.82rem', color: '#718096' }}>kW</span>
                <span style={{ fontSize: '0.78rem', color: '#a0aec0', minWidth: '90px', textAlign: 'right' }}>
                  = {(s.loadKw * s.hours).toFixed(0)} {t('load.kwh_per_day')}
                </span>
              </div>
            ))}
          </div>
          {slotAnnual > 0 && (
            <div style={{ padding: '0.75rem 1rem', background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '8px', fontSize: '0.88rem', color: '#276749', lineHeight: 1.7 }}>
              {t('load.slot.daily_avg')} <strong>{(slotAnnual / 365).toFixed(1)} kWh</strong>
              {lang === 'en' ? ', ' : '，'}
              {t('load.slot.annual')} <strong>{Math.round(slotAnnual).toLocaleString()} kWh</strong>
              {lang === 'en' ? ', ' : '，'}
              {t('load.slot.peak')} <strong>{slotPeak.toFixed(1)} kW</strong>
            </div>
          )}
        </div>
      )}

      {/* ── 模式三：导入用电表格 */}
      {mode === 'import' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '0.8rem 1rem', background: '#ebf8ff', borderLeft: '4px solid #3182ce', borderRadius: '8px', fontSize: '0.84rem', color: '#2c5282', lineHeight: 1.7 }}>
            <strong>{t('load.csv_format')}</strong>{t('load.csv_format_desc')}
          </div>

          <div
            style={{ border: '2px dashed #cbd5e0', borderRadius: '10px', padding: '2rem', textAlign: 'center', cursor: 'pointer', background: csvLoaded ? '#f0fff4' : '#fafafa', transition: 'all 0.2s' }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{ display: 'none' }} />
            {csvLoaded ? (
              <>
                <div style={{ fontSize: '1.5rem', color: '#38a169', marginBottom: '0.4rem' }}>{t('load.csv_imported')}</div>
                <div style={{ fontSize: '0.85rem', color: '#276749' }}>
                  {lang === 'en' ? 'Annual load ' : '年总用电量 '}
                  <strong>{annualLoadKwh?.toLocaleString()} kWh</strong>
                  {lang === 'en' ? ', Peak ' : '，峰值 '}
                  <strong>{peakLoadKw?.toFixed(1)} kW</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#718096', marginTop: '0.3rem' }}>{t('load.csv_reupload')}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '0.95rem', color: '#4a5568', marginBottom: '0.3rem' }}>{t('load.csv_click')}</div>
                <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>{t('load.csv_drag')}</div>
              </>
            )}
          </div>

          {csvError && (
            <div style={{ padding: '0.6rem 0.9rem', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '6px', fontSize: '0.84rem', color: '#c53030' }}>
              {csvError}
            </div>
          )}
        </div>
      )}

      {/* ── 负载类型 */}
      <div>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.6rem', fontSize: '0.95rem' }}>
          {t('load.type.label')}
          <span style={{ fontWeight: 400, fontSize: '0.78rem', color: '#718096', marginLeft: '0.4rem' }}>
            {t('load.type.label_note')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {LOAD_TYPES.map(lt => (
            <div
              key={lt.value}
              onClick={() => handleLoadType(lt.value)}
              style={{
                flex: '1 1 auto', minWidth: '140px',
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.65rem 0.9rem',
                border: `2px solid ${loadType === lt.value ? '#1a365d' : '#e2e8f0'}`,
                borderRadius: '8px', cursor: 'pointer',
                background: loadType === lt.value ? '#ebf4ff' : 'white',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${loadType === lt.value ? '#1a365d' : '#cbd5e0'}`, background: loadType === lt.value ? '#1a365d' : 'transparent' }} />
              <div>
                <div style={{ fontWeight: 600, color: '#2d3748', fontSize: '0.9rem' }}>{lt.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#718096' }}>{lt.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
