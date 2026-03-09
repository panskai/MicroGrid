/**
 * StepDIYVoltage.tsx — DIY流程 Step 1: 电压等级选择
 */
import { useLang } from '@/context/LangContext';
import type { VoltageLevel } from '@/types/index';

interface StepDIYVoltageProps {
  voltageLevel: VoltageLevel | null;
  onSelect: (voltage: VoltageLevel) => void;
}

export default function StepDIYVoltage({ voltageLevel, onSelect }: StepDIYVoltageProps) {
  const { t, lang } = useLang();

  const VOLTAGE_OPTIONS: {
    value: VoltageLevel;
    label: string;
    badge: string;
    desc: string;
    use: string;
    inverterNote: string;
  }[] = [
    {
      value: '120V/240V',
      label: '120V / 240V',
      badge: lang === 'en' ? 'Residential/Small Commercial' : '住宅/小商业',
      desc:  lang === 'en' ? 'North American standard single-phase split supply' : '北美标准单相分裂电源',
      use:   lang === 'en' ? 'Residential, small shops, light commercial, mainly single-phase loads' : '住宅、小型商店、轻型商业，单相负载为主',
      inverterNote: lang === 'en' ? 'Single-phase inverter, common range 3kW–12kW' : '单相逆变器，常见规格 3kW–12kW',
    },
    {
      value: '120V/208V',
      label: '120V / 208V',
      badge: lang === 'en' ? 'Medium Commercial' : '中型商业',
      desc:  lang === 'en' ? 'North American standard 3-phase 4-wire (low voltage)' : '北美标准三相四线制（低压）',
      use:   lang === 'en' ? 'Medium commercial buildings, offices, multi-family housing with 3-phase equipment' : '中型商业建筑、办公楼、多户住宅，有三相设备',
      inverterNote: lang === 'en' ? '3-phase inverter, common range 10kW–30kW' : '三相逆变器，常见规格 10kW–30kW',
    },
    {
      value: '277V/480V',
      label: '277V / 480V',
      badge: lang === 'en' ? 'Industrial' : '工业',
      desc:  lang === 'en' ? 'North American industrial 3-phase 4-wire (high voltage)' : '北美工业三相四线制（高压）',
      use:   lang === 'en' ? 'Factories, large warehouses, industrial parks with high-power 3-phase motors' : '工厂、大型仓库、工业园区，大功率三相电机设备',
      inverterNote: lang === 'en' ? 'Industrial 3-phase inverter, common range 30kW–200kW+' : '工业三相逆变器，常见规格 30kW–200kW+',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

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
        {t('info.diy.voltage')}
      </div>

      {/* 电压选项 */}
      {VOLTAGE_OPTIONS.map(opt => {
        const active = voltageLevel === opt.value;
        return (
          <div
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            style={{
              padding: '1rem 1.2rem',
              border: `2px solid ${active ? '#1a365d' : '#e2e8f0'}`,
              borderRadius: '12px',
              background: active ? '#ebf4ff' : 'white',
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${active ? '#1a365d' : '#cbd5e0'}`,
                background: active ? '#1a365d' : 'transparent',
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1a365d' }}>
                    {opt.label}
                  </span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700,
                    padding: '0.1rem 0.55rem', borderRadius: '10px',
                    background: active ? '#1a365d' : '#e2e8f0',
                    color: active ? 'white' : '#4a5568',
                  }}>
                    {opt.badge}
                  </span>
                </div>
                <div style={{ fontSize: '0.84rem', color: '#4a5568', marginTop: '0.25rem' }}>
                  {opt.desc}
                </div>
              </div>
            </div>

            {active && (
              <div style={{
                marginTop: '0.75rem', paddingTop: '0.75rem',
                borderTop: '1px solid #bee3f8',
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem', fontSize: '0.82rem',
              }}>
                <div style={{ background: '#f0f8ff', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
                  <div style={{ fontWeight: 600, color: '#2b6cb0', marginBottom: '0.2rem' }}>
                    {lang === 'en' ? 'Use Cases' : '适用场景'}
                  </div>
                  <div style={{ color: '#4a5568', lineHeight: 1.5 }}>{opt.use}</div>
                </div>
                <div style={{ background: '#f0f8ff', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
                  <div style={{ fontWeight: 600, color: '#2b6cb0', marginBottom: '0.2rem' }}>
                    {lang === 'en' ? 'Inverter Reference' : '逆变器参考'}
                  </div>
                  <div style={{ color: '#4a5568', lineHeight: 1.5 }}>{opt.inverterNote}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
