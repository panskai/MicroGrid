import type { ConfigData } from '../types';
import type { ROICalculationResult } from '../utils/roiCalculator';
import ROIChart from './ROIChart';
import ComponentCard from './ComponentCard';
import './ResultPage.css';

interface ResultPageProps {
  config: ConfigData;
  roiResult: ROICalculationResult;
  onRestart: () => void;
}

export default function ResultPage({ config, roiResult, onRestart }: ResultPageProps) {
  // 检查数据有效性
  if (!roiResult || !config) {
    return (
      <div className="result-page">
        <div className="result-header">
          <h1>数据加载中...</h1>
        </div>
      </div>
    );
  }
  const getScenarioName = (scenario: string) => {
    switch (scenario) {
      case 'known-load':
        return '已知负载情况';
      case 'diy':
        return '任意DIY';
      case 'no-load':
        return '无负载情况';
      default:
        return scenario;
    }
  };

  const getVoltageName = (voltage: string) => {
    return voltage;
  };

  const getEMSName = (ems: string) => {
    switch (ems) {
      case 'edge':
        return '边端控制';
      case 'cloud':
        return '云端控制';
      case 'prediction':
        return '基于预测';
      default:
        return ems;
    }
  };

  return (
    <div className="result-page">
      <div className="result-header">
        <h1>配置完成</h1>
        <p className="subtitle">您的微电网系统配置如下</p>
      </div>

      <div className="result-content">
        {/* 投资回报卡片 */}
        <div className="result-card">
          <h2>投资回报分析</h2>
          <div className="roi-display">
            <span className="roi-value">{roiResult.roiYears.toFixed(1)}</span>
            <span className="roi-unit">年</span>
          </div>
          <div className="roi-details">
            <div className="roi-detail-item">
              <span className="detail-label">总投资：</span>
              <span className="detail-value">{(roiResult.totalCost / 10000).toFixed(2)} 万元</span>
            </div>
            <div className="roi-detail-item">
              <span className="detail-label">年节省：</span>
              <span className="detail-value">{(roiResult.annualSavings / 10000).toFixed(2)} 万元/年</span>
            </div>
          </div>
        </div>

        {/* 投资回报曲线图 */}
        <ROIChart yearData={roiResult.yearData} roiYears={roiResult.roiYears} />

        {/* 详细选型参数 */}
        <div className="config-summary">
          <h2>微电网选型参数</h2>
          <div className="summary-section">
            <h3 className="section-title">系统配置</h3>
          
          <div className="summary-item">
            <span className="label">配置场景：</span>
            <span className="value">{getScenarioName(config.scenario)}</span>
          </div>

          <div className="summary-item">
            <span className="label">折叠支架：</span>
            <span className="value">{config.bracketSets}套（{config.bracketSets * 32}块组件）</span>
          </div>

          {config.componentModel && (
            <div className="summary-item">
              <span className="label">组件型号：</span>
              <span className="value">{config.componentModel}</span>
            </div>
          )}

          <div className="summary-item">
            <span className="label">占地面积：</span>
            <span className="value">{config.bracketSets * 260}平方米（无阴影遮挡）</span>
          </div>

          <div className="summary-item">
            <span className="label">柴油发电机：</span>
            <span className="value">
              {config.hasGenerator 
                ? '是' + (config.generatorCapacity ? `（${config.generatorCapacity === 'small' ? '小' : config.generatorCapacity === 'medium' ? '中' : '大'}容量）` : '')
                : '否' + (config.generatorCapacity ? `（将配置${config.generatorCapacity === 'small' ? '小' : config.generatorCapacity === 'medium' ? '中' : '大'}容量）` : '')}
            </span>
          </div>

          <div className="summary-item">
            <span className="label">电压等级：</span>
            <span className="value">{getVoltageName(config.voltageLevel)}</span>
          </div>

          {config.scenario === 'diy' && (
            <>
              {config.requiredCurrent && (
                <div className="summary-item">
                  <span className="label">所需电流：</span>
                  <span className="value">{config.requiredCurrent}A</span>
                </div>
              )}
              {config.inverterCount && (
                <div className="summary-item">
                  <span className="label">逆变器数量：</span>
                  <span className="value">
                    {config.inverterCount}台（{config.inverterCount}套折叠支架，{config.inverterCount <= 2 ? 1 : 2}套托盘）
                  </span>
                </div>
              )}
            </>
          )}

          {config.scenario === 'no-load' && config.trayCapacity && (
            <div className="summary-item">
              <span className="label">光储一体化托盘容量：</span>
              <span className="value">
                {config.trayCapacity === 'small' ? '小' : config.trayCapacity === 'medium' ? '中' : '大'}容量
              </span>
            </div>
          )}

          <div className="summary-item">
            <span className="label">储能容量支撑天数：</span>
            <span className="value">{config.storageDays}天（{config.storageDays === 1 ? '容量1' : config.storageDays === 2 ? '容量2' : '容量3'}）</span>
          </div>

          <div className="summary-item">
            <span className="label">EMS控制方式：</span>
            <span className="value">{getEMSName(config.emsControlMethod)}</span>
          </div>
          </div>

          <div className="summary-section">
            <h3 className="section-title">系统容量</h3>
            <div className="summary-item">
              <span className="label">光伏装机容量：</span>
              <span className="value">{(config.bracketSets * 32 * 0.4).toFixed(1)} kW</span>
            </div>
            <div className="summary-item">
              <span className="label">储能容量：</span>
              <span className="value">
                {config.storageDays === 1 ? '容量1' : config.storageDays === 2 ? '容量2' : '容量3'} 
                （支撑{config.storageDays}天）
              </span>
            </div>
            {config.scenario === 'diy' && config.inverterCount && (
              <div className="summary-item">
                <span className="label">逆变器总功率：</span>
                <span className="value">{config.inverterCount * 50} kW（估算）</span>
              </div>
            )}
          </div>

          <div className="summary-section">
            <h3 className="section-title">成本分析</h3>
            <div className="summary-item">
              <span className="label">系统总投资：</span>
              <span className="value highlight-cost">{(roiResult.totalCost / 10000).toFixed(2)} 万元</span>
            </div>
            <div className="summary-item">
              <span className="label">预计年节省：</span>
              <span className="value highlight-savings">{(roiResult.annualSavings / 10000).toFixed(2)} 万元</span>
            </div>
            <div className="summary-item">
              <span className="label">投资回报年限：</span>
              <span className="value highlight-roi">{roiResult.roiYears.toFixed(1)} 年</span>
            </div>
            <div className="summary-item">
              <span className="label">20年累计收益：</span>
              <span className="value">
                {roiResult.yearData && roiResult.yearData.length > 20 
                  ? (roiResult.yearData[20].cumulativeSavings / 10000).toFixed(2)
                  : roiResult.yearData && roiResult.yearData.length > 0
                  ? (roiResult.yearData[roiResult.yearData.length - 1].cumulativeSavings / 10000).toFixed(2)
                  : '0.00'
                } 万元
              </span>
            </div>
          </div>
        </div>

        {/* 组件卡片展示 */}
        <div className="components-section">
          <h2>系统组件</h2>
          <p className="components-intro">点击每个组件查看详细信息</p>
          <div className="components-grid">
            <ComponentCard
              title="软件"
              description="VoltageEnergy 微电网系统包括先进的软件工具，支持标准化设计和持续系统优化。能源管理系统可以控制、预测、跟踪和优化能源资源。"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <path d="M8 21h8M12 17v4"/>
                </svg>
              }
              isVital={true}
              details="VoltageEnergy 提供基于云端的能源管理系统，能够动态监控、调度和控制现场能源资源，优化能源成本和绿色能源消耗，可以自动预测和优化何时消耗、生产和存储能源。"
            />
            <ComponentCard
              title="能源控制中心 (ECC)"
              description="ECC 是一个智能、预工程化、可配置的开关柜，将系统的分布式能源资源进行电气互连。VoltageEnergy 提供高质量的线缆和连接解决方案，确保 ECC 的可靠运行。"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 9h6v6H9z"/>
                  <path d="M9 3v6M15 3v6M9 21v-6M15 21v-6M3 9h6M3 15h6M15 9h6M15 15h6"/>
                </svg>
              }
              isVital={true}
              details="其先进的硬件将所有分布式能源资源连接到您的设施和系统，实现改进的电气控制和维护。VoltageEnergy 的工程团队提供技术支持和线缆解决方案，确保 ECC 系统的可靠连接。"
            />
            <ComponentCard
              title="电网"
              description="微电网与主电网协同工作，可以在电网停电期间提供备用电源，并通过整合可再生能源帮助降低能源成本。VoltageEnergy 提供可靠的电网连接线缆解决方案。"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6M12 17v6M23 12h-6M7 12H1"/>
                  <path d="M20.66 3.34l-4.24 4.24M7.58 16.42l-4.24 4.24M20.66 20.66l-4.24-4.24M7.58 7.58L3.34 3.34"/>
                </svg>
              }
              isVital={true}
              details="VoltageEnergy 提供高质量的工业电缆和连接解决方案，确保微电网与主电网之间的可靠连接，包括 THHN/THWN-2、RHH/RHW-2/USE-2 等系列线缆。"
            />
            {config.bracketSets > 0 && (
              <ComponentCard
                title="太阳能"
                description={`VoltageEnergy 微电网系统设计并预测试集成现场太阳能发电系统，容量为 ${(config.bracketSets * 32 * 0.4).toFixed(1)} kW。我们提供专业的太阳能线缆和线束解决方案。`}
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v4M12 19v4M23 12h-4M5 12H1M20.66 3.34l-2.83 2.83M6.17 17.83l-2.83 2.83M20.66 20.66l-2.83-2.83M6.17 6.17L3.34 3.34"/>
                  </svg>
                }
                isVital={true}
                details={`系统包含 ${config.bracketSets} 套折叠支架（${config.bracketSets * 32} 块组件），占地面积约 ${config.bracketSets * 260} 平方米。VoltageEnergy 提供 Voltage LYNX® 主干总线系统、Voltage ALEX、String Harness 和 Reel PNP 预组装线缆系统，确保太阳能组件的可靠连接和高效安装。`}
              />
            )}
            {config.hasGenerator && (
              <ComponentCard
                title="发电机"
                description="VoltageEnergy 微电网系统包括标准化架构，可以与现场备用发电配合使用，以提升系统韧性。我们提供可靠的工业电缆解决方案，确保发电机系统的稳定运行。"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="8"/>
                    <path d="M12 4v4M12 16v4M4 12h4M16 12h4"/>
                    <path d="M8.93 8.93l2.83 2.83M12.24 12.24l2.83 2.83M15.07 8.93l-2.83 2.83M11.76 12.24l-2.83 2.83"/>
                  </svg>
                }
                isVital={true}
                details={`系统已配置${config.generatorCapacity === 'small' ? '小' : config.generatorCapacity === 'medium' ? '中' : config.generatorCapacity === 'large' ? '大' : ''}容量发电机，可在电网故障时提供备用电源。VoltageEnergy 提供高质量的工业电缆，包括 XHHW-2、THHN/THWN-2 等系列，确保发电机系统的可靠连接。`}
              />
            )}
            {config.storageDays && config.storageDays > 0 && (
              <ComponentCard
                title="电池储能系统 (BESS)"
                description="BESS 是一个完全自包含的解决方案，基于灵活、可扩展和高效的架构，提供灵活性，帮助最小化能源成本并最大化可再生能源使用。VoltageEnergy 提供专业的线缆和连接解决方案。"
                icon={
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="12" height="16" rx="2"/>
                    <rect x="8" y="6" width="8" height="12" fill="white" opacity="0.3"/>
                    <path d="M9 2h6v2H9z"/>
                  </svg>
                }
                isVital={true}
                details={`系统配置了储能容量，可在阴天情况下支撑 ${config.storageDays} 天的能源需求。BESS 利用现场发电源优化整个系统，在最大化可再生能源使用的同时提供能源和成本节省。VoltageEnergy 的工程团队提供 3D 建模和技术支持，确保 BESS 系统的可靠连接和优化配置。`}
              />
            )}
          </div>
        </div>

        {/* VoltageEnergy公司联系信息 */}
        <div className="company-info">
          <h2>联系我们</h2>
          <div className="company-details">
            <div className="company-logo">
              <div className="logo-placeholder">VoltageEnergy</div>
            </div>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">—</span>
                <div className="contact-content">
                  <div className="contact-label">公司名称</div>
                  <div className="contact-value">VoltageEnergy 能源科技有限公司</div>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">—</span>
                <div className="contact-content">
                  <div className="contact-label">公司地址</div>
                  <div className="contact-value">浙江省宁波市镇海区蛟川街道东生路666号</div>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">—</span>
                <div className="contact-content">
                  <div className="contact-label">联系电话</div>
                  <div className="contact-value">
                    <a href="tel:+86-400-888-8888">400-888-8888</a>
                  </div>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">—</span>
                <div className="contact-content">
                  <div className="contact-label">电子邮箱</div>
                  <div className="contact-value">
                    <a href="mailto:info@voltageenergy.com">info@voltageenergy.com</a>
                  </div>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">—</span>
                <div className="contact-content">
                  <div className="contact-label">官方网站</div>
                  <div className="contact-value">
                    <a href="https://www.voltageenergy.com" target="_blank" rel="noopener noreferrer">
                      www.voltageenergy.com
                    </a>
                  </div>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">—</span>
                <div className="contact-content">
                  <div className="contact-label">业务咨询</div>
                  <div className="contact-value">
                    <a href="mailto:sales@voltageenergy.com">sales@voltageenergy.com</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="company-description">
            <p>
              VoltageEnergy 专注于微电网解决方案的设计、开发与实施，为客户提供一站式能源管理服务。
              我们拥有专业的技术团队和丰富的项目经验，致力于推动清洁能源的普及与应用。
            </p>
          </div>
        </div>
      </div>

      <div className="result-footer">
        <button className="btn btn-secondary" onClick={() => window.print()}>
          打印报告
        </button>
        <button className="btn btn-primary" onClick={onRestart}>
          重新配置
        </button>
      </div>
    </div>
  );
}
