/**
 * StepDIYBackup.tsx — DIY流程 Step 4: 备电时间选择 → 自动推算储能容量
 *
 * 推算逻辑：
 *   目标储能容量 = 逆变器总功率(kW) × 备电时间(h) ÷ 放电深度(0.9)
 *   电池包数量 = ceil(目标容量 ÷ 单包容量)
 *
 * 备电时间选项：
 *   2h / 4h / 6h / 8h / 12h / 24h（一天）/ 48h（两天）
 */
import { useState } from 'react';
import type { ConfigData } from '@/types/index';
import { useProducts } from '@/context/ProductsContext';
import { useLang } from '@/context/LangContext';

interface StepDIYBackupProps {
  backupHours?: number;           // 用户选择的备电时长（h）
  totalInverterKw?: number;       // 来自Step2推算的总逆变器功率
  batteryPackModel?: string;
  onUpdate: (data: Partial<ConfigData>) => void;
}

const DOD = 0.9;  // 放电深度
const RECOMMENDED_PACK = 'LFP-16kWh';

export default function StepDIYBackup({
  backupHours,
  totalInverterKw = 0,
  batteryPackModel,
  onUpdate,
}: StepDIYBackupProps) {
  const { t, lang } = useLang();
  const { batteryPacks, getBatteryByModel } = useProducts();
  const [customHours, setCustomHours] = useState('');

  const currentPackModel = batteryPackModel ?? RECOMMENDED_PACK;
  const currentPack = getBatteryByModel(currentPackModel);

  // backup options with both zh/en labels
  const BACKUP_OPTIONS: { hours: number; labelZh: string; labelEn: string; descZh: string; descEn: string; badge?: string }[] = [
    { hours: 2,  labelZh: '2 小时',  labelEn: '2 Hours',  descZh: '短暂停电保障，适合市电可靠区域的应急补充',    descEn: 'Short emergency backup, for reliable grid areas' },
    { hours: 4,  labelZh: '4 小时',  labelEn: '4 Hours',  descZh: '半天备用，适合日常市电偶发中断场景',          descEn: 'Half-day backup for occasional grid interruptions' },
    { hours: 6,  labelZh: '6 小时',  labelEn: '6 Hours',  descZh: '夜间覆盖，适合白天光伏发电、夜间用电储备',    descEn: 'Night coverage for daytime PV generation & evening use' },
    { hours: 8,  labelZh: '8 小时',  labelEn: '8 Hours',  badge: t('diy.backup.recommended'), descZh: '工作日全覆盖（8h工作时段），常用工商业选择', descEn: 'Full business-day coverage (8h shift), common commercial choice' },
    { hours: 12, labelZh: '12 小时', labelEn: '12 Hours', descZh: '半昼夜备用，适合对可靠性要求较高的场景',      descEn: 'Semi-day backup for high-reliability requirements' },
    { hours: 24, labelZh: '24 小时', labelEn: '24 Hours', descZh: '完整一天自主供电，离网或高可靠性场景',        descEn: 'Full-day autonomous supply, off-grid or high reliability' },
    { hours: 48, labelZh: '48 小时', labelEn: '48 Hours', descZh: '两天自主供电，极端恶劣天气或高安全级别要求',  descEn: '2-day autonomous supply, extreme weather or high-security use' },
  ];

  /** 根据备电时长和逆变器功率推算电池包数 */
  const calcPacks = (hours: number, packModel: string): { packs: number; kwh: number } => {
    if (totalInverterKw <= 0 || hours <= 0) return { packs: 0, kwh: 0 };
    const pack   = getBatteryByModel(packModel);
    const target = (totalInverterKw * hours) / DOD;
    const packs  = Math.max(1, Math.ceil(target / pack.capacityKwh));
    return { packs, kwh: packs * pack.capacityKwh };
  };

  const handleHoursSelect = (hours: number) => {
    const { packs, kwh } = calcPacks(hours, currentPackModel);
    onUpdate({
      backupHours:      hours,
      batteryPackCount: packs,
      batteryCapacityKwh: kwh,
    } as any);
  };

  const handleCustom = (val: string) => {
    setCustomHours(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const { packs, kwh } = calcPacks(num, currentPackModel);
      onUpdate({
        backupHours:      num,
        batteryPackCount: packs,
        batteryCapacityKwh: kwh,
      } as any);
    }
  };

  const handlePackChange = (model: string) => {
    const hours = backupHours ?? 8;
    const { packs, kwh } = calcPacks(hours, model);
    onUpdate({
      batteryPackModel:   model,
      batteryPackCount:   packs,
      batteryCapacityKwh: kwh,
    } as any);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* 逆变器功率参考 */}
      {totalInverterKw > 0 && (
        <div style={{
          padding: '0.75rem 1rem',
          background: '#f0f8ff',
          borderLeft: '4px solid #3182ce',
          borderRadius: '8px',
          fontSize: '0.86rem',
          color: '#2c5282',
        }}>
          <strong>{t('diy.backup.inv_ref')}{totalInverterKw.toFixed(1)} kW</strong>
          &nbsp;·&nbsp;
          {lang === 'en'
            ? `Storage target = ${totalInverterKw.toFixed(1)} kW × backup hrs ÷ ${DOD} (DoD)`
            : `目标储能 = ${totalInverterKw.toFixed(1)} kW × 备电时长 ÷ ${DOD} (DoD)`}
        </div>
      )}

      {/* 备电时长选项 */}
      <div>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.6rem', fontSize: '0.93rem' }}>
          {t('diy.backup.select')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {BACKUP_OPTIONS.map(opt => {
            const active = backupHours !== undefined && Math.abs(backupHours - opt.hours) < 0.5;
            const { packs, kwh } = calcPacks(opt.hours, currentPackModel);
            const label = lang === 'en' ? opt.labelEn : opt.labelZh;
            const desc  = lang === 'en' ? opt.descEn  : opt.descZh;
            return (
              <div
                key={opt.hours}
                onClick={() => handleHoursSelect(opt.hours)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.85rem 1.1rem',
                  border: `2px solid ${active ? '#1a365d' : '#e2e8f0'}`,
                  borderRadius: '10px', cursor: 'pointer',
                  background: active ? '#ebf4ff' : 'white',
                  transition: 'all 0.18s',
                }}
              >
                {/* 单选圆点 */}
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${active ? '#1a365d' : '#cbd5e0'}`,
                  background: active ? '#1a365d' : 'transparent',
                }} />

                {/* 文字 */}
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, color: '#2d3748', marginRight: '0.5rem' }}>{label}</span>
                  {opt.badge && (
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700,
                      padding: '0.1rem 0.45rem', borderRadius: '8px',
                      background: '#c6f6d5', color: '#276749', marginRight: '0.4rem',
                    }}>{opt.badge}</span>
                  )}
                  <span style={{ fontSize: '0.81rem', color: '#718096' }}>{desc}</span>
                </div>

                {/* 推算容量（仅当有逆变器功率时显示） */}
                {totalInverterKw > 0 && packs > 0 && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, color: '#1a365d', fontSize: '0.95rem' }}>
                      {packs} {lang === 'en' ? 'packs' : '包'} · {kwh} kWh
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#a0aec0' }}>
                      ({currentPack.capacityKwh} kWh/{lang === 'en' ? 'pack' : '包'})
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 自定义小时数 */}
        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.88rem', color: '#718096' }}>
            {lang === 'en' ? 'Custom: ' : '自定义：'}
          </span>
          <input
            type="number"
            value={customHours}
            onChange={e => handleCustom(e.target.value)}
            placeholder={lang === 'en' ? 'e.g. 16' : '如：16'}
            min={1}
            max={168}
            step={1}
            style={{
              padding: '0.45rem 0.8rem',
              border: '1px solid #cbd5e0',
              borderRadius: '8px',
              fontSize: '0.9rem',
              width: '100px',
            }}
          />
          <span style={{ fontSize: '0.88rem', color: '#718096' }}>
            {lang === 'en' ? 'hours' : '小时'}
          </span>
        </div>
      </div>

      {/* 电池包型号选择 */}
      <div style={{ padding: '1.1rem', background: '#f8f9fa', borderRadius: '10px' }}>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.75rem', fontSize: '0.93rem' }}>
          {t('diy.backup.pack_label')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.6rem' }}>
          {batteryPacks.map(pack => {
            const isSelected    = currentPackModel === pack.model;
            const isRecommended = pack.model === RECOMMENDED_PACK;
            const { packs: n, kwh } = backupHours ? calcPacks(backupHours, pack.model) : { packs: 0, kwh: 0 };
            return (
              <div
                key={pack.model}
                onClick={() => handlePackChange(pack.model)}
                style={{
                  padding: '0.8rem 0.85rem',
                  border: `2px solid ${isSelected ? '#1a365d' : isRecommended ? '#90cdf4' : '#e2e8f0'}`,
                  borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
                  background: isSelected ? '#ebf4ff' : isRecommended ? '#f0f8ff' : 'white',
                  position: 'relative', transition: 'all 0.18s',
                }}
              >
                {isRecommended && (
                  <div style={{
                    position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)',
                    fontSize: '0.63rem', fontWeight: 700, padding: '0.1rem 0.4rem',
                    background: '#3182ce', color: 'white', borderRadius: '8px', whiteSpace: 'nowrap',
                  }}>{t('diy.backup.recommended')}</div>
                )}
                <div style={{ fontWeight: 800, color: '#1a365d', fontSize: '1.0rem' }}>
                  {pack.capacityKwh} kWh
                </div>
                <div style={{ fontSize: '0.7rem', color: '#718096', marginTop: '0.1rem' }}>
                  {pack.displayName.replace('磷酸铁锂', 'LFP')}
                </div>
                {backupHours && n > 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#276749', fontWeight: 700, marginTop: '0.3rem' }}>
                    → {n} {lang === 'en' ? 'packs' : '包'}（{kwh} kWh）
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 当前推算汇总 */}
      {backupHours && backupHours > 0 && totalInverterKw > 0 && (() => {
        const { packs, kwh } = calcPacks(backupHours, currentPackModel);
        return (
          <div style={{
            padding: '0.9rem 1.1rem',
            background: '#f0fff4',
            border: '1px solid #9ae6b4',
            borderLeft: '4px solid #38a169',
            borderRadius: '10px',
            fontSize: '0.88rem', color: '#22543d', lineHeight: 1.8,
          }}>
            <strong>{t('diy.backup.summary')}</strong>
            {lang === 'en'
              ? `${totalInverterKw.toFixed(1)} kW × ${backupHours}h = `
              : `${totalInverterKw.toFixed(1)} kW 逆变器 × ${backupHours} h 备电 = `}
            <strong>{(totalInverterKw * backupHours).toFixed(1)} kWh</strong>
            {lang === 'en' ? ' target → ' : ' 目标容量 → '}
            {packs} {lang === 'en' ? 'packs × ' : '包 × '}{currentPack.capacityKwh} kWh =&nbsp;
            <strong>{kwh} kWh</strong>
          </div>
        );
      })()}

    </div>
  );
}
