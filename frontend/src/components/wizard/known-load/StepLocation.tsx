/**
 * StepLocation.tsx — 安装地点 & 日照评估
 * 通过城市/地区名称获取经纬度，再查询年均峰值日照小时数
 * 同时让客户选择光伏组件型号（影响发电成本与回本计算）
 */
import { useState } from 'react';
import type { ConfigData } from '@/types/index';
import { fetchSolarHours } from '@/api/client';
import { useProducts } from '@/context/ProductsContext';
import { useLang } from '@/context/LangContext';
import { formatIrradianceDual } from '@/utils/unitFormat';

interface StepLocationProps {
  locationName?: string;
  latitude?: number;
  longitude?: number;
  peakSunHoursPerDay?: number;
  annualEffHours?: number;
  panelModel?: string;
  onUpdate: (data: Partial<ConfigData>) => void;
}

// 常用安装地参考（美国各气候区典型地点）
const PRESET_LOCATIONS = [
  { name: 'Phoenix, AZ',         lat: 33.4,  lon: -112.1 },
  { name: 'Los Angeles, CA',     lat: 34.1,  lon: -118.2 },
  { name: 'Las Vegas, NV',       lat: 36.2,  lon: -115.1 },
  { name: 'Dallas, TX',          lat: 32.8,  lon: -96.8  },
  { name: 'Miami, FL',           lat: 25.8,  lon: -80.2  },
  { name: 'Houston, TX',         lat: 29.8,  lon: -95.4  },
  { name: 'Albuquerque, NM',     lat: 35.1,  lon: -106.7 },
  { name: 'Atlanta, GA',         lat: 33.7,  lon: -84.4  },
  { name: 'New York, NY',        lat: 40.7,  lon: -74.0  },
  { name: 'Chicago, IL',         lat: 41.9,  lon: -87.6  },
];

export default function StepLocation({
  locationName = '',
  latitude,
  longitude,
  peakSunHoursPerDay,
  annualEffHours,
  panelModel: initPanelModel,
  onUpdate,
}: StepLocationProps) {
  const { pvPanels: panels, defaultPanelModel } = useProducts();
  const { t, lang } = useLang();

  // Translate climate zone strings returned by backend (which are always in Chinese)
  const translateClimateZone = (zone: string): string => {
    if (lang !== 'en') return zone;
    const map: Record<string, string> = {
      '热带（日照充足）':         'Tropical (Abundant Solar)',
      '亚热带/干旱带（日照良好）': 'Subtropical / Arid (Good Solar)',
      '温带（日照中等）':         'Temperate (Moderate Solar)',
      '高纬度（日照偏少）':       'High Latitude (Limited Solar)',
      '离线估算':                  'Offline Estimate',
    };
    return map[zone] ?? zone;
  };

  const translateSolarNote = (note: string): string => {
    if (lang !== 'en') return note;
    if (note.includes('基于纬度工程估算')) {
      return 'Engineering estimate based on latitude. Suitable for initial project assessment. Historical weather data can be provided for higher accuracy.';
    }
    if (note.includes('离线估算')) return 'Offline estimate';
    return note;
  };
  const [searchText, setSearchText]     = useState(locationName);
  const [manualLat, setManualLat]       = useState(latitude  != null ? String(latitude)  : '');
  const [manualLon, setManualLon]       = useState(longitude != null ? String(longitude) : '');
  const [geocoding, setGeocoding]       = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [loadingSolar, setLoadingSolar] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState(initPanelModel ?? defaultPanelModel);
  const [solarResult, setSolarResult]   = useState<{
    peakSunHoursPerDay: number;
    annualEffHours: number;
    annualKwhPerM2: number;
    climateZone: string;
    note: string;
  } | null>(
    peakSunHoursPerDay != null && annualEffHours != null
      ? { peakSunHoursPerDay, annualEffHours, annualKwhPerM2: (peakSunHoursPerDay * 365) || 0, climateZone: '', note: '' }
      : null
  );

  // ── 地名搜索（OpenStreetMap Nominatim，无需 API key）──────────
  const handleGeocode = async () => {
    if (!searchText.trim()) return;
    setGeocoding(true);
    setGeocodeError('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=json&limit=1`;
      const res  = await fetch(url, { headers: { 'Accept-Language': 'zh,en' } });
      const data = await res.json() as { lat: string; lon: string; display_name: string }[];
      if (!data.length) {
        setGeocodeError(t('loc.not_found'));
        return;
      }
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      setManualLat(lat.toFixed(4));
      setManualLon(lon.toFixed(4));
      onUpdate({ locationName: searchText, latitude: lat, longitude: lon });
      await querySolarHours(lat, lon);
    } catch {
      setGeocodeError(t('loc.network_err'));
    } finally {
      setGeocoding(false);
    }
  };

  // ── 选取预置地点 ───────────────────────────────────────────────
  const handlePreset = async (p: typeof PRESET_LOCATIONS[0]) => {
    setSearchText(p.name);
    setManualLat(String(p.lat));
    setManualLon(String(p.lon));
    setGeocodeError('');
    onUpdate({ locationName: p.name, latitude: p.lat, longitude: p.lon });
    await querySolarHours(p.lat, p.lon);
  };

  // ── 手动经纬度 + 获取日照 ───────────────────────────────────────
  const handleManualQuery = async () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon)) return;
    onUpdate({ latitude: lat, longitude: lon });
    await querySolarHours(lat, lon);
  };

  const querySolarHours = async (lat: number, lon: number) => {
    setLoadingSolar(true);
    try {
      const r = await fetchSolarHours(lat, lon);
      const sr = {
        peakSunHoursPerDay: r.peak_sun_hours_per_day,
        annualEffHours:     r.annual_eff_hours,
        annualKwhPerM2:     r.annual_kwh_per_m2,
        climateZone:        r.climate_zone,
        note:               r.note,
      };
      setSolarResult(sr);
      onUpdate({
        peakSunHoursPerDay: sr.peakSunHoursPerDay,
        annualEffHours:     sr.annualEffHours,
        annualKwhPerM2:     sr.annualKwhPerM2,
      } as any);
    } catch {
      // 后端不可用时，用简单公式估算
      const psh = Math.max(2.5, parseFloat((5.8 * Math.cos(Math.abs(lat) * Math.PI / 180) ** 0.5 * 1.08).toFixed(2)));
      const eff  = Math.round(psh * 365 * 0.75);
      setSolarResult({ peakSunHoursPerDay: psh, annualEffHours: eff, annualKwhPerM2: psh * 365, climateZone: '', note: '离线估算' });
      onUpdate({ peakSunHoursPerDay: psh, annualEffHours: eff, annualKwhPerM2: psh * 365 } as any);
    } finally {
      setLoadingSolar(false);
    }
  };

  const hasCoords = manualLat !== '' && manualLon !== '' &&
    !isNaN(parseFloat(manualLat)) && !isNaN(parseFloat(manualLon));

  // ── 光伏组件选择处理 ────────────────────────────────────────
  const handlePanelSelect = (model: string) => {
    setSelectedPanel(model);
    onUpdate({ panelModel: model });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── 快速选择常用地区 ──────────────────────────────────── */}
      <div>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.6rem', fontSize: '0.95rem' }}>
          {t('loc.preset_label')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
          {PRESET_LOCATIONS.map(p => (
            <button
              key={p.name}
              onClick={() => handlePreset(p)}
              style={{
                padding: '0.3rem 0.8rem',
                fontSize: '0.8rem',
                border: `1px solid ${locationName === p.name ? '#1a365d' : '#e2e8f0'}`,
                borderRadius: '20px',
                cursor: 'pointer',
                background: locationName === p.name ? '#1a365d' : 'white',
                color: locationName === p.name ? 'white' : '#4a5568',
                transition: 'all 0.15s',
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── 地名搜索 ──────────────────────────────────────────── */}
      <div>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.6rem', fontSize: '0.95rem' }}>
          {t('loc.search_label')}
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGeocode()}
            placeholder={t('loc.search_placeholder')}
            style={{
              flex: 1,
              padding: '0.6rem 0.9rem',
              border: '1px solid #cbd5e0',
              borderRadius: '8px',
              fontSize: '0.95rem',
            }}
          />
          <button
            onClick={handleGeocode}
            disabled={geocoding || !searchText.trim()}
            style={{
              padding: '0.6rem 1.1rem',
              background: '#1a365d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: geocoding ? 'wait' : 'pointer',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap',
              opacity: geocoding ? 0.7 : 1,
            }}
          >
            {geocoding ? t('loc.searching') : t('loc.search_btn')}
          </button>
        </div>
        {geocodeError && (
          <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#c53030' }}>
            {geocodeError}
          </div>
        )}
      </div>

      {/* ── 手动经纬度输入 ─────────────────────────────────────── */}
      <div>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.6rem', fontSize: '0.95rem' }}>
          {t('loc.coords_label')}
          <span style={{ fontWeight: 400, fontSize: '0.78rem', color: '#718096', marginLeft: '0.4rem' }}>
            {t('loc.coords_note')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.88rem', color: '#4a5568', whiteSpace: 'nowrap' }}>{t('loc.lat')}</label>
            <input
              type="number"
              value={manualLat}
              onChange={e => setManualLat(e.target.value)}
              placeholder="-90 ~ 90"
              min={-90} max={90} step={0.01}
              style={{ padding: '0.45rem 0.7rem', border: '1px solid #cbd5e0', borderRadius: '6px', width: '110px', fontSize: '0.9rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.88rem', color: '#4a5568', whiteSpace: 'nowrap' }}>{t('loc.lon')}</label>
            <input
              type="number"
              value={manualLon}
              onChange={e => setManualLon(e.target.value)}
              placeholder="-180 ~ 180"
              min={-180} max={180} step={0.01}
              style={{ padding: '0.45rem 0.7rem', border: '1px solid #cbd5e0', borderRadius: '6px', width: '120px', fontSize: '0.9rem' }}
            />
          </div>
          <button
            onClick={handleManualQuery}
            disabled={!hasCoords || loadingSolar}
            style={{
              padding: '0.45rem 1rem',
              background: hasCoords ? '#2b6cb0' : '#a0aec0',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: hasCoords && !loadingSolar ? 'pointer' : 'not-allowed',
              fontSize: '0.88rem',
            }}
          >
            {loadingSolar ? t('loc.querying') : t('loc.get_solar')}
          </button>
        </div>
      </div>

      {/* ── 日照评估结果 ───────────────────────────────────────── */}
      {solarResult && (
        <div style={{
          padding: '1rem 1.25rem',
          background: '#f0fff4',
          border: '1px solid #9ae6b4',
          borderRadius: '10px',
          borderLeft: '4px solid #38a169',
        }}>
          <div style={{ fontWeight: 700, color: '#276749', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
            {t('loc.solar_result')}
                {solarResult.climateZone && (
              <span style={{
                marginLeft: '0.6rem', fontSize: '0.75rem', fontWeight: 600,
                padding: '0.1rem 0.5rem', borderRadius: '10px',
                background: '#c6f6d5', color: '#276749',
              }}>
                {translateClimateZone(solarResult.climateZone)}
              </span>
            )}
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem',
            textAlign: 'center', marginBottom: '0.75rem',
          }}>
            <div style={{ background: 'white', borderRadius: '8px', padding: '0.7rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#276749' }}>
                {solarResult.peakSunHoursPerDay}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#48bb78', fontWeight: 600 }}>{t('loc.peak_sun')}</div>
              <div style={{ fontSize: '0.7rem', color: '#718096' }}>{t('loc.peak_sun_unit')}</div>
            </div>
            <div style={{ background: 'white', borderRadius: '8px', padding: '0.7rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2b6cb0' }}>
                {solarResult.annualEffHours.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#63b3ed', fontWeight: 600 }}>{t('loc.annual_hrs')}</div>
              <div style={{ fontSize: '0.7rem', color: '#718096' }}>{t('loc.annual_hrs_unit')}</div>
            </div>
            <div style={{ background: 'white', borderRadius: '8px', padding: '0.7rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#d69e2e', lineHeight: 1.25 }}>
                {formatIrradianceDual(solarResult.annualKwhPerM2, lang).combined}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#ecc94b', fontWeight: 600 }}>{t('loc.irradiance')}</div>
              <div style={{ fontSize: '0.7rem', color: '#718096' }}>
                {lang === 'en' ? 'metric + imperial' : '公制 + 英制'}
              </div>
            </div>
          </div>
          {solarResult.note && (
            <div style={{ fontSize: '0.75rem', color: '#718096', borderTop: '1px solid #c6f6d5', paddingTop: '0.5rem' }}>
              {translateSolarNote(solarResult.note)}
            </div>
          )}
        </div>
      )}

      {/* ── 光伏组件型号选择 ──────────────────────────────────── */}
      <div>
        <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.4rem', fontSize: '0.95rem' }}>
          {t('loc.panel_label')}
          <span style={{ fontWeight: 400, fontSize: '0.78rem', color: '#718096', marginLeft: '0.5rem' }}>
            {t('loc.panel_note')}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.65rem' }}>
          {panels.map(p => {
            const isSelected = selectedPanel === p.model;
            // 每套标准32块支架的装机量
            const kwPerSet = +(32 * p.watts / 1000).toFixed(2);
            return (
              <div
                key={p.model}
                onClick={() => handlePanelSelect(p.model)}
                style={{
                  border: `2px solid ${isSelected ? '#2b6cb0' : '#e2e8f0'}`,
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  background: isSelected ? '#ebf8ff' : '#fff',
                  transition: 'all 0.15s',
                  boxShadow: isSelected ? '0 2px 8px rgba(43,108,176,0.18)' : 'none',
                }}
              >
                {/* 型号标题行 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ fontWeight: 700, color: isSelected ? '#2b6cb0' : '#2d3748', fontSize: '0.95rem' }}>
                    {p.watts}Wp
                  </div>
                  {isSelected && (
                    <div style={{
                      background: '#2b6cb0', color: '#fff',
                      borderRadius: '999px', padding: '1px 8px',
                      fontSize: '0.7rem', fontWeight: 700,
                    }}>
                      {t('loc.panel_selected')}
                    </div>
                  )}
                  {p.model === defaultPanelModel && !isSelected && (
                    <div style={{
                      background: '#e2e8f0', color: '#4a5568',
                      borderRadius: '999px', padding: '1px 8px',
                      fontSize: '0.7rem', fontWeight: 600,
                    }}>
                      {t('loc.panel_default')}
                    </div>
                  )}
                </div>
                {/* 型号描述 */}
                <div style={{ fontSize: '0.78rem', color: '#4a5568', marginBottom: '0.5rem' }}>
                  {p.displayName.replace(`${p.watts}Wp `, '')}
                </div>
                {/* 关键参数行 */}
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{
                    background: isSelected ? '#bee3f8' : '#f7fafc',
                    color: isSelected ? '#2b6cb0' : '#718096',
                    borderRadius: '4px', padding: '2px 7px', fontSize: '0.75rem', fontWeight: 600,
                  }}>
                    {kwPerSet} {t('loc.kw_per_set')}
                  </span>
                  <span style={{
                    background: isSelected ? '#bee3f8' : '#f7fafc',
                    color: isSelected ? '#2b6cb0' : '#718096',
                    borderRadius: '4px', padding: '2px 7px', fontSize: '0.75rem',
                  }}>
                    {t('loc.efficiency')} {p.efficiencyPct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {/* 当前所选组件发电能力提示 */}
        {(() => {
          const cur = panels.find(p => p.model === selectedPanel);
          if (!cur || !solarResult) return null;
          const kwPerSet = +(32 * cur.watts / 1000).toFixed(2);
          const annualKwhPerSet = +(kwPerSet * solarResult.annualEffHours).toFixed(0);
          return (
            <div style={{
              marginTop: '0.65rem',
              padding: '0.6rem 1rem',
              background: '#fffde7',
              border: '1px solid #f6e05e',
              borderRadius: '8px',
              fontSize: '0.82rem',
              color: '#744210',
            }}>
              {t('loc.panel_selected')}: <strong>{cur.watts}Wp</strong> — {Math.round(kwPerSet * 10) / 10} kW/set,{' '}
              ~{annualKwhPerSet.toLocaleString()} kWh/yr per set
            </div>
          );
        })()}
      </div>

    </div>
  );
}
