import type { NavPage } from '@/components/layout/SideNav';
import { useLang } from '@/context/LangContext';
import StandardProductTopology from '@/components/topology/StandardProductTopology';
import type { TopologyData } from './MicrogridTopology';
import './StandardProductPage.css';

const TITLE_KEYS: Record<string, { zh: string; en: string }> = {
  'standard-small':  { zh: '小型光储柴发一体', en: 'Small PV-Storage-Diesel' },
  'standard-medium': { zh: '中型光储柴发一体', en: 'Medium PV-Storage-Diesel' },
  'standard-large':  { zh: '大型光储柴发一体', en: 'Large PV-Storage-Diesel' },
};

const SIZE_TO_KEY: Record<string, string> = {
  small:  'standard-small',
  medium: 'standard-medium',
  large:  'standard-large',
};

interface StandardProductPageProps {
  size: 'small' | 'medium' | 'large';
  onStartConfig?: (view: NavPage) => void;
}

/** 数据参考已知负载解决方案典型优化输出（4/8/16套支架对应规模） */
const SIZE_TOPOLOGY_DATA: Record<StandardProductPageProps['size'], Partial<TopologyData>> = {
  small: {
    pv: {
      title: 'PV',
      capacity: { name: 'Max PV Capacity', value: 83.8, unit: 'kW' },
      sets: { name: 'Max Bracket Sets', value: 4, unit: 'sets' },
      panelModel: '655Wp',
      areaM2: 1040,
    },
    load: {
      title: 'Load',
      annualKwh: { name: 'Annual Load', value: 131400, unit: 'kWh' },
      loadType: 'Industrial',
      peakKw: 50,
    },
    diesel: {
      title: 'Diesel',
      capacity: { name: 'Generator Capacity', value: 40, unit: 'kW' },
      isNew: false,
    },
    ess: {
      title: 'ESS',
      capacity: { name: 'Battery Capacity', value: 256, unit: 'kWh' },
      storageDays: { name: 'Storage Days', value: 1, unit: 'day' },
      packModel: 'LFP-16kWh',
    },
  },
  medium: {
    pv: {
      title: 'PV',
      capacity: { name: 'Max PV Capacity', value: 167.7, unit: 'kW' },
      sets: { name: 'Bracket Sets', value: 8, unit: 'sets' },
      panelModel: '655Wp',
      areaM2: 2080,
    },
    load: {
      title: 'Load',
      annualKwh: { name: 'Annual Load', value: 262800, unit: 'kWh' },
      loadType: 'Industrial',
      peakKw: 100,
    },
    diesel: {
      title: 'Diesel',
      capacity: { name: 'Generator Capacity', value: 80, unit: 'kW' },
      isNew: false,
    },
    ess: {
      title: 'ESS',
      capacity: { name: 'Battery Capacity', value: 512, unit: 'kWh' },
      storageDays: { name: 'Storage Days', value: 1, unit: 'day' },
      packModel: 'LFP-16kWh',
    },
  },
  large: {
    pv: {
      title: 'PV',
      capacity: { name: 'Max PV Capacity', value: 335.4, unit: 'kW' },
      sets: { name: 'Bracket Sets', value: 16, unit: 'sets' },
      panelModel: '655Wp',
      areaM2: 4160,
    },
    load: {
      title: 'Load',
      annualKwh: { name: 'Annual Load', value: 525600, unit: 'kWh' },
      loadType: 'Industrial',
      peakKw: 200,
    },
    diesel: {
      title: 'Diesel',
      capacity: { name: 'Generator Capacity', value: 150, unit: 'kW' },
      isNew: false,
    },
    ess: {
      title: 'ESS',
      capacity: { name: 'Battery Capacity', value: 1024, unit: 'kWh' },
      storageDays: { name: 'Storage Days', value: 1, unit: 'day' },
      packModel: 'LFP-16kWh',
    },
  },
};

export default function StandardProductPage({ size }: StandardProductPageProps) {
  const { lang } = useLang();
  const titleData = TITLE_KEYS[SIZE_TO_KEY[size]];
  const title = lang === 'en' ? titleData.en : titleData.zh;

  return (
    <section className="standard-product-page">
      <div className="standard-product-page__grid-bg" aria-hidden="true" />
      <div className="standard-product-page__topology-wrap">
        <StandardProductTopology size={size} data={SIZE_TOPOLOGY_DATA[size]} />
      </div>
      <div className="standard-product-page__content">
        <header className="standard-product-page__header">
          <h2 className="standard-product-page__title">{title}</h2>
        </header>
      </div>
    </section>
  );
}
