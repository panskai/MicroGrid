import type { ConfigData } from '@/types/index';
import { useLang } from '@/context/LangContext';
import './MicrogridVisualization.css';

interface MicrogridVisualizationProps {
  config: ConfigData;
  currentStep?: number;
  selectedOption?: string;
}

export default function MicrogridVisualization({ config, currentStep, selectedOption }: MicrogridVisualizationProps) {
  const { t, lang } = useLang();
  const hasSolar    = config.bracketSets > 0;
  const hasBattery  = config.storageDays !== null && config.storageDays > 0;
  const hasGenerator = config.hasGenerator;
  const derCount    = [hasSolar, hasBattery, hasGenerator].filter(Boolean).length;

  const getInfoMessage = () => {
    if (!currentStep || !selectedOption) return null;
    const stepType = getStepType(currentStep);

    const infoMap: Record<string, Record<string, { zh: string; en: string }>> = {
      scenario: {
        'known-load': { zh: '已知负载场景：系统将根据您提供的负载需求自动配置合适的设备，包括光伏、储能和控制系统，确保满足您的能源需求。', en: 'Known-Load scenario: The system will automatically configure suitable equipment based on your load requirements, including PV, storage, and control systems.' },
        'diy':        { zh: 'DIY场景：您可以自由配置各种参数，包括逆变器数量、电流等详细参数，实现完全自定义的微电网解决方案。', en: 'DIY scenario: Freely configure all parameters including inverter count and current ratings for a fully customized microgrid.' },
        'no-load':    { zh: '无负载场景：适用于新建项目或容量规划，系统将根据光储一体化托盘容量进行配置，为未来扩展预留空间。', en: 'No-Load scenario: For new projects or capacity planning. System is configured based on integrated PV-storage tray capacity.' },
      },
      brackets: {
        '1': { zh: '1套折叠支架：包含32块组件，占地面积约260平方米，适合小型项目或试点应用。', en: '1 bracket set: 32 panels, ~260 m², suitable for small projects or pilots.' },
        '2': { zh: '2套折叠支架：包含64块组件，占地面积约520平方米，适合中型商业或工业应用。', en: '2 bracket sets: 64 panels, ~520 m², suitable for medium commercial or industrial use.' },
        '3': { zh: '3套折叠支架：包含96块组件，占地面积约780平方米，适合大型商业或工业项目。', en: '3 bracket sets: 96 panels, ~780 m², suitable for large commercial or industrial projects.' },
        '4': { zh: '4套折叠支架：包含128块组件，占地面积约1040平方米，适合大型工业或园区应用。', en: '4 bracket sets: 128 panels, ~1040 m², suitable for large industrial or campus use.' },
        '5': { zh: '5套折叠支架：包含160块组件，占地面积约1300平方米，适合超大型工业或园区项目。', en: '5 bracket sets: 160 panels, ~1300 m², suitable for very large industrial or campus projects.' },
      },
      generator: {
        'true':  { zh: '已配置柴油发电机：系统将集成现有柴油发电机，提升韧性和可靠性，在电网故障或高负载时提供备用电源。', en: 'Diesel generator configured: The system integrates the existing generator to improve resilience and provide backup power during outages or high loads.' },
        'false': { zh: '未配置柴油发电机：系统将根据负载情况配置合适的发电机容量，确保在紧急情况下有足够的备用电源。', en: 'No diesel generator: The system will recommend an appropriate generator capacity based on load analysis.' },
      },
      voltage: {
        '120V/240V': { zh: '120V/240V电压等级：适用于北美住宅/小型商业的标准电压。', en: '120V/240V: Standard North American residential/small commercial voltage.' },
        '120V/208V': { zh: '120V/208V电压等级：适用于北美商业和工业，提供三相电力供应。', en: '120V/208V: North American commercial/industrial, three-phase power supply.' },
        '277V/480V': { zh: '277V/480V电压等级：适用于大型商业和工业，提供更高的电压和功率容量。', en: '277V/480V: Large commercial/industrial, higher voltage and power capacity.' },
      },
      storage: {
        '1': { zh: '1天储能容量：在阴天情况下可以提供1天的电力支撑，适合电网稳定性较好的地区。', en: '1-day storage: Provides 1 day of support during cloudy weather. Suitable for regions with good grid stability.' },
        '2': { zh: '2天储能容量：可提供2天的电力支撑，提供更好的能源安全性和成本优化。', en: '2-day storage: Provides 2 days of support for better energy security and cost optimization.' },
        '3': { zh: '3天储能容量：提供最佳能源安全性，适合光照较差或高可靠性要求场景。', en: '3-day storage: Best energy security for poor solar regions or high-reliability requirements.' },
      },
      ems: {
        'edge':       { zh: '边缘控制：本地边缘计算控制，响应速度快（毫秒级），适合对实时性要求高的场景。', en: 'Edge control: Local edge computing, millisecond response, ideal for real-time applications.' },
        'cloud':      { zh: '云端控制：基于云端的能源管理系统，可以实现远程监控和优化，适合多站点管理。', en: 'Cloud control: Cloud-based EMS for remote monitoring and multi-site management.' },
        'prediction': { zh: '预测控制：接入气象预报数据，提前优化充放电策略，实现更优的能源调度与成本控制。', en: 'Predictive control: Integrates weather forecast data to pre-optimize charge/discharge strategies.' },
      },
    };

    const entry = infoMap[stepType]?.[selectedOption];
    return entry ? (lang === 'en' ? entry.en : entry.zh) : null;
  };

  const getStepType = (step: number): string => {
    if (step === 1) return 'scenario';
    if (!config.scenario) return '';
    if (step === 2) return 'brackets';
    if (step === 3) return 'generator';
    if (step === 4) return 'voltage';
    if (config.scenario === 'known-load') {
      if (step === 5) return 'storage';
      if (step === 6) return 'ems';
    } else if (config.scenario === 'diy') {
      if (step === 5) return 'diy-config';
      if (step === 6) return 'storage';
      if (step === 7) return 'ems';
    } else if (config.scenario === 'no-load') {
      if (step === 5) return 'tray';
      if (step === 6) return 'storage';
      if (step === 7) return 'ems';
    }
    return '';
  };

  const infoMessage = getInfoMessage();

  return (
    <div className="microgrid-visualization">
      <div className="visualization-container">
        <div className="visual-title">{lang === 'en' ? 'System Architecture Preview' : '系统架构预览'}</div>

        {infoMessage && (
          <div className="visualization-info-box">
            <div className="info-box-icon">i</div>
            <div className="info-box-content"><p>{infoMessage}</p></div>
          </div>
        )}

        {(hasSolar || hasBattery || hasGenerator) && (
          <div className="ecc-box">
            <div className="ecc-icon">
              <img src={`${import.meta.env.BASE_URL}images/ecc.svg`} alt={lang === 'en' ? 'Energy Control Center' : '能源控制中心'} className="ecc-image" />
            </div>
            <div className="ecc-label">{lang === 'en' ? 'Energy Control Center' : '能源控制中心'}</div>
          </div>
        )}

        <div className={`ders-container ${derCount === 0 ? 'empty' : ''}`}>
          {derCount === 0 ? (
            <div className="empty-state">
              <p>{lang === 'en' ? 'Select components to preview system architecture' : '选择组件以查看系统架构'}</p>
            </div>
          ) : (
            <>
              {hasSolar && (
                <div className="der-item solar">
                  <div className="der-icon">
                    <img src={`${import.meta.env.BASE_URL}images/solar-panel.svg`} alt={lang === 'en' ? 'PV Panels' : '光伏板'} className="der-image" />
                  </div>
                  <div className="der-label">{lang === 'en' ? 'PV' : '光伏'}</div>
                  <div className="der-detail">{config.bracketSets}{lang === 'en' ? ' sets' : '套'}</div>
                  <div className="der-capacity">{(config.bracketSets * 32 * 0.4).toFixed(1)} kW</div>
                </div>
              )}

              {hasBattery && (
                <div className="der-item battery">
                  <div className="der-icon">
                    <img src={`${import.meta.env.BASE_URL}images/battery-storage.svg`} alt={lang === 'en' ? 'Battery Storage' : '电池储能'} className="der-image" />
                  </div>
                  <div className="der-label">{lang === 'en' ? 'Battery' : '电池储能'}</div>
                  <div className="der-detail">{config.storageDays}{lang === 'en' ? '-day' : '天'}</div>
                  <div className="der-capacity">
                    {config.storageDays === 1 ? (lang === 'en' ? 'Cap. 1' : '容量1') : config.storageDays === 2 ? (lang === 'en' ? 'Cap. 2' : '容量2') : (lang === 'en' ? 'Cap. 3' : '容量3')}
                  </div>
                </div>
              )}

              {hasGenerator && (
                <div className="der-item generator">
                  <div className="der-icon">
                    <img src={`${import.meta.env.BASE_URL}images/generator.svg`} alt={lang === 'en' ? 'Diesel Generator' : '柴油发电机'} className="der-image" />
                  </div>
                  <div className="der-label">{lang === 'en' ? 'Diesel' : '柴发'}</div>
                  <div className="der-detail">
                    {(config as any).generatorCapacity === 'small'  ? (lang === 'en' ? 'Small'  : '小容量') :
                     (config as any).generatorCapacity === 'medium' ? (lang === 'en' ? 'Medium' : '中容量') :
                     (config as any).generatorCapacity === 'large'  ? (lang === 'en' ? 'Large'  : '大容量') :
                     (lang === 'en' ? 'Configured' : '已配置')}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {(hasSolar || hasBattery || hasGenerator) && (
          <div className="load-box">
            <div className="load-icon">
              <img src={`${import.meta.env.BASE_URL}images/load.svg`} alt={lang === 'en' ? 'Load' : '负载'} className="load-image" />
            </div>
            <div className="load-label">{lang === 'en' ? 'Load' : '负载'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
