import type { ConfigData } from '../types';
import './MicrogridVisualization.css';

interface MicrogridVisualizationProps {
  config: ConfigData;
  currentStep?: number;
  selectedOption?: string;
}

export default function MicrogridVisualization({ config, currentStep, selectedOption }: MicrogridVisualizationProps) {
  const hasSolar = config.bracketSets > 0;
  const hasBattery = config.storageDays !== null && config.storageDays > 0;
  const hasGenerator = config.hasGenerator;

  // 计算DERs数量
  const derCount = [hasSolar, hasBattery, hasGenerator].filter(Boolean).length;

  // 根据当前步骤和选择获取信息提示
  const getInfoMessage = () => {
    if (!currentStep || !selectedOption) return null;

    const stepType = getStepType(currentStep);
    const infoMap: Record<string, Record<string, string>> = {
      scenario: {
        'known-load': '已知负载场景：系统将根据您提供的负载需求自动配置合适的设备，包括光伏、储能和控制系统，确保满足您的能源需求。',
        'diy': 'DIY场景：您可以自由配置各种参数，包括逆变器数量、电流等详细参数，实现完全自定义的微电网解决方案。',
        'no-load': '无负载场景：适用于新建项目或容量规划，系统将根据光储一体化托盘容量进行配置，为未来扩展预留空间。'
      },
      brackets: {
        '1': '1套折叠支架：包含32块组件，占地面积约260平方米（无阴影遮挡），适合小型项目或试点应用。',
        '2': '2套折叠支架：包含64块组件，占地面积约520平方米，适合中型商业或工业应用。',
        '3': '3套折叠支架：包含96块组件，占地面积约780平方米，适合大型商业或工业项目。',
        '4': '4套折叠支架：包含128块组件，占地面积约1040平方米，适合大型工业或园区应用。',
        '5': '5套折叠支架：包含160块组件，占地面积约1300平方米，适合超大型工业或园区项目。'
      },
      generator: {
        'true': '已配置柴油发电机：系统将集成现有的柴油发电机，提升系统韧性和可靠性，在电网故障或高负载时提供备用电源。',
        'false': '未配置柴油发电机：系统将根据负载情况配置合适的发电机容量，确保在紧急情况下有足够的备用电源。'
      },
      voltage: {
        '120V/240V': '120V/240V电压等级：适用于北美地区的标准电压，适合小型到中型商业和住宅应用。',
        '120V/208V': '120V/208V电压等级：适用于商业和工业应用，提供三相电力供应，适合中型到大型设施。',
        '277V/480V': '277V/480V电压等级：适用于大型商业和工业应用，提供更高的电压和功率容量，适合大型设施和园区。'
      },
      storage: {
        '1': '1天储能容量：在阴天情况下可以提供1天的电力支撑，适合电网稳定性较好的地区。',
        '2': '2天储能容量：在阴天情况下可以提供2天的电力支撑，提供更好的能源安全性和成本优化。',
        '3': '3天储能容量：在阴天情况下可以提供3天的电力支撑，提供最佳的能源安全性和需求费用管理。'
      },
      ems: {
        'edge': '边缘控制：本地边缘计算控制，响应速度快，适合对实时性要求高的应用场景。',
        'cloud': '云端控制：基于云端的能源管理系统，可以实现远程监控和优化，适合多站点管理。',
        'prediction': '预测控制：基于AI的预测控制，可以提前优化能源调度，实现最佳的能源成本优化和绿色能源消耗。'
      }
    };

    return infoMap[stepType]?.[selectedOption] || null;
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
        {/* 标题 */}
        <div className="visual-title">系统架构预览</div>

        {/* 信息提示框 - 显示在左侧 */}
        {infoMessage && (
          <div className="visualization-info-box">
            <div className="info-box-icon">i</div>
            <div className="info-box-content">
              <p>{infoMessage}</p>
            </div>
          </div>
        )}
        
        {/* 能源控制中心 - 当有组件配置时显示 */}
        {(hasSolar || hasBattery || hasGenerator) && (
          <div className="ecc-box">
            <div className="ecc-icon">
              <img src="/images/ecc.svg" alt="能源控制中心" className="ecc-image" />
            </div>
            <div className="ecc-label">能源控制中心</div>
          </div>
        )}

        {/* 分布式能源资源 */}
        <div className={`ders-container ${derCount === 0 ? 'empty' : ''}`}>
          {derCount === 0 ? (
            <div className="empty-state">
              <p>选择组件以查看系统架构</p>
            </div>
          ) : (
            <>
              {/* 光伏 - 左侧 */}
              {hasSolar && (
                <div className="der-item solar">
                  <div className="der-icon">
                    <img src="/images/solar-panel.svg" alt="光伏板" className="der-image" />
                  </div>
                  <div className="der-label">光伏</div>
                  <div className="der-detail">{config.bracketSets}套</div>
                  <div className="der-capacity">{(config.bracketSets * 32 * 0.4).toFixed(1)} kW</div>
                </div>
              )}

              {/* 电池储能 - 中间 */}
              {hasBattery && (
                <div className="der-item battery">
                  <div className="der-icon">
                    <img src="/images/battery-storage.svg" alt="电池储能" className="der-image" />
                  </div>
                  <div className="der-label">电池储能</div>
                  <div className="der-detail">支撑{config.storageDays}天</div>
                  <div className="der-capacity">
                    {config.storageDays === 1 ? '容量1' : config.storageDays === 2 ? '容量2' : '容量3'}
                  </div>
                </div>
              )}

              {/* 柴发 - 右侧 */}
              {hasGenerator && (
                <div className="der-item generator">
                  <div className="der-icon">
                    <img src="/images/generator.svg" alt="柴油发电机" className="der-image" />
                  </div>
                  <div className="der-label">柴发</div>
                  <div className="der-detail">
                    {config.generatorCapacity === 'small' ? '小容量' : 
                     config.generatorCapacity === 'medium' ? '中容量' : 
                     config.generatorCapacity === 'large' ? '大容量' : '已配置'}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 负载 - 当有组件配置时显示 */}
        {(hasSolar || hasBattery || hasGenerator) && (
          <div className="load-box">
            <div className="load-icon">
              <img src="/images/load.svg" alt="负载" className="load-image" />
            </div>
            <div className="load-label">负载</div>
          </div>
        )}
      </div>
    </div>
  );
}
