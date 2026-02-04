import { useState, useEffect } from 'react';
import StepIndicator from './components/StepIndicator';
import QuestionCard from './components/QuestionCard';
import Step1Scenario from './components/steps/Step1Scenario';
import Step2Brackets from './components/steps/Step2Brackets';
import Step3Generator from './components/steps/Step3Generator';
import Step4Voltage from './components/steps/Step4Voltage';
import Step5DIY from './components/steps/Step5DIY';
import Step6Storage from './components/steps/Step6Storage';
import Step7Tray from './components/steps/Step7Tray';
import Step8EMS from './components/steps/Step8EMS';
import ResultPage from './components/ResultPage';
import MicrogridVisualization from './components/MicrogridVisualization';
import WelcomePage from './components/WelcomePage';
import type { ConfigData } from './types';
import { calculateROI, type ROICalculationResult } from './utils/roiCalculator';
import './App.css';

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [config, setConfig] = useState<ConfigData>({
    scenario: null as any,
    bracketSets: 0,
    hasGenerator: false,
    voltageLevel: null as any,
    storageDays: null as any,
    emsControlMethod: null as any,
  });

  // 监听开始配置的事件
  useEffect(() => {
    const handleStartConfig = () => {
      setShowWelcome(false);
    };
    window.addEventListener('startConfig', handleStartConfig);
    return () => window.removeEventListener('startConfig', handleStartConfig);
  }, []);

  const updateConfig = (updates: Partial<ConfigData>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    const stepType = getStepType(currentStep);
    
    switch (stepType) {
      case 'scenario':
        return config.scenario !== null;
      case 'brackets':
        return config.bracketSets > 0;
      case 'generator':
        return true; // 发电机选项总是可选的
      case 'voltage':
        return config.voltageLevel !== null;
      case 'diy-config':
        return config.inverterCount !== undefined && config.inverterCount > 0;
      case 'tray':
        return config.trayCapacity !== null && config.trayCapacity !== undefined;
      case 'storage':
        return config.storageDays !== null;
      case 'ems':
        return config.emsControlMethod !== null;
      default:
        return false;
    }
  };

  const [roiResult, setRoiResult] = useState<ROICalculationResult | null>(null);

  const handleNext = () => {
    if (currentStep < getTotalSteps()) {
      setCurrentStep(currentStep + 1);
    } else {
      // 计算投资回报年限和详细数据
      const result = calculateROI(config);
      setRoiResult(result);
      updateConfig({ roiYears: result.roiYears });
      setCurrentStep(getTotalSteps() + 1); // 跳转到结果页
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 获取当前步骤对应的实际配置步骤类型
  const getStepType = (step: number): string => {
    // 第一步总是场景选择
    if (step === 1) {
      return 'scenario';
    }
    
    // 如果还没有选择场景，其他步骤无法确定
    if (!config.scenario) {
      return '';
    }
    
    // 所有场景的共同步骤：2-支架, 3-发电机, 4-电压
    if (step === 2) return 'brackets';
    if (step === 3) return 'generator';
    if (step === 4) return 'voltage';
    
    // 根据场景确定后续步骤
    if (config.scenario === 'known-load') {
      // 已知负载：5-储能, 6-EMS
      if (step === 5) return 'storage';
      if (step === 6) return 'ems';
    } else if (config.scenario === 'diy') {
      // DIY：5-逆变器/电流, 6-储能, 7-EMS
      if (step === 5) return 'diy-config';
      if (step === 6) return 'storage';
      if (step === 7) return 'ems';
    } else if (config.scenario === 'no-load') {
      // 无负载：5-托盘容量, 6-储能, 7-EMS
      if (step === 5) return 'tray';
      if (step === 6) return 'storage';
      if (step === 7) return 'ems';
    }
    
    return '';
  };

  const getTotalSteps = () => {
    // 第一步总是场景选择
    if (!config.scenario) {
      return 1;
    }
    
    if (config.scenario === 'known-load') {
      return 6; // 场景、支架、发电机、电压、储能、EMS
    } else {
      return 7; // 场景、支架、发电机、电压、特殊步骤、储能、EMS
    }
  };

  const getStepTitle = () => {
    if (currentStep === getTotalSteps() + 1) {
      return '';
    }
    
    const stepType = getStepType(currentStep);
    const titleMap: { [key: string]: string } = {
      scenario: '选择配置场景',
      brackets: '折叠支架配置',
      generator: '柴油发电机',
      voltage: '电压等级',
      'diy-config': '逆变器与电流配置',
      tray: '光储一体化托盘容量',
      storage: '储能容量配置',
      ems: 'EMS控制方式',
    };
    
    // 如果 stepType 为空，说明逻辑有问题，返回默认标题
    if (!stepType) {
      console.warn('Step type is empty for step:', currentStep);
      return '配置步骤';
    }
    
    return titleMap[stepType] || '配置步骤';
  };

  const getStepDescription = () => {
    const stepType = getStepType(currentStep);
    const descMap: { [key: string]: string } = {
      scenario: '请选择适合您项目的配置场景',
      brackets: '一套折叠支架包含32块组件，占地面积约260平方米（无阴影遮挡）',
      generator: '请选择原场地是否具备柴油发电机',
      voltage: '请选择系统所需的电压等级',
      'diy-config': '配置逆变器数量和所需电流',
      tray: '选择光储一体化托盘容量大小',
      storage: '选择阴天情况下储能容量支撑天数',
      ems: '选择EMS能源管理系统的控制方式',
    };
    
    return descMap[stepType] || '';
  };

  const getStepInfoMessage = () => {
    const stepType = getStepType(currentStep);
    const infoMap: { [key: string]: string } = {
      scenario: 'VoltageEnergy 微电网配置系统采用经过测试和验证的架构，适用于各种业务场景和用例。',
      brackets: '折叠支架系统采用标准化设计，每套支架可容纳32块组件，占地面积约260平方米（无阴影遮挡）。',
      generator: '系统可以集成现有的柴油发电机，提升系统韧性和可靠性。',
      voltage: '请根据您的实际需求选择合适的电压等级，这将影响系统的整体配置。',
      'diy-config': 'DIY配置允许您根据具体需求自定义电流和逆变器数量，实现更灵活的微电网设计。',
      tray: '光储一体化托盘提供标准化的储能解决方案，简化系统集成和安装过程。',
      storage: '电池储能系统可以帮助降低需求费用，并在停电时提供备用电源支持。',
      ems: '能源管理系统可以控制、预测、跟踪和优化能源资源，实现能源成本优化和绿色能源消耗。'
    };
    
    return infoMap[stepType] || '';
  };

  const renderStepContent = () => {
    // 结果页面在主return中处理，这里不需要处理
    if (currentStep === getTotalSteps() + 1) {
      return null;
    }

    const stepType = getStepType(currentStep);
    
    // 调试信息
    if (!stepType) {
      console.error('Step type is empty for step:', currentStep, 'config.scenario:', config.scenario);
    }
    
    switch (stepType) {
      case 'scenario':
        return (
          <Step1Scenario
            selectedScenario={config.scenario}
            onSelect={(scenario) => {
              updateConfig({ scenario });
              setSelectedOption(scenario);
            }}
          />
        );
      case 'brackets':
        return (
          <Step2Brackets
            bracketSets={config.bracketSets}
            componentModel={config.componentModel}
            bracketCapacity={config.bracketCapacity}
            onUpdate={(data) => {
              updateConfig(data);
              setSelectedOption(data.bracketSets?.toString() || '');
            }}
          />
        );
      case 'generator':
        return (
          <Step3Generator
            config={config}
            onUpdate={(data) => {
              updateConfig(data);
              setSelectedOption(data.hasGenerator?.toString() || '');
            }}
          />
        );
      case 'voltage':
        return (
          <Step4Voltage
            voltageLevel={config.voltageLevel}
            onSelect={(voltage) => {
              updateConfig({ voltageLevel: voltage });
              setSelectedOption(voltage);
            }}
          />
        );
      case 'diy-config':
        return (
          <Step5DIY
            requiredCurrent={config.requiredCurrent}
            inverterCount={config.inverterCount}
            onUpdate={(data) => {
              updateConfig(data);
              setSelectedOption(data.inverterCount?.toString() || '');
            }}
          />
        );
      case 'tray':
        return (
          <Step7Tray
            trayCapacity={config.trayCapacity || null}
            onSelect={(capacity) => {
              updateConfig({ trayCapacity: capacity });
              setSelectedOption(capacity);
            }}
          />
        );
      case 'storage':
        return (
          <Step6Storage
            storageDays={config.storageDays}
            onSelect={(days) => {
              updateConfig({ storageDays: days });
              setSelectedOption(days.toString());
            }}
          />
        );
      case 'ems':
        return (
          <Step8EMS
            emsControlMethod={config.emsControlMethod}
            onSelect={(method) => {
              updateConfig({ emsControlMethod: method });
              setSelectedOption(method);
            }}
          />
        );
      default:
        return null;
    }
  };

  if (currentStep === getTotalSteps() + 1) {
    // 确保有计算结果
    let finalRoiResult = roiResult;
    if (!finalRoiResult) {
      try {
        finalRoiResult = calculateROI(config);
        setRoiResult(finalRoiResult);
        updateConfig({ roiYears: finalRoiResult.roiYears });
      } catch (error) {
        console.error('计算ROI时出错:', error);
        // 创建一个默认结果
        finalRoiResult = {
          totalCost: 0,
          annualSavings: 0,
          roiYears: 0,
          yearData: [{
            year: 0,
            cumulativeCost: 0,
            cumulativeSavings: 0,
            netValue: 0,
            roi: 0,
          }],
        };
      }
    }
    
    return (
      <div className="app">
        <ResultPage 
          config={config} 
          roiResult={finalRoiResult}
          onRestart={() => { 
            setCurrentStep(1); 
            setRoiResult(null);
            setConfig({ scenario: null as any, bracketSets: 0, hasGenerator: false, voltageLevel: null as any, storageDays: null as any, emsControlMethod: null as any }); 
          }} 
        />
      </div>
    );
  }

  // 显示欢迎页面
  if (showWelcome) {
    return <WelcomePage onStart={() => setShowWelcome(false)} />;
  }

  return (
    <div className="app">
      {/* Top Header Bar */}
      <div className="app-top-header">
        <div className="top-header-content">
          <div className="top-header-left">
            <div className="top-header-logo">
              <img 
                src="/voltage-full-logo-white.png" 
                alt="VOLTAGE" 
                className="top-header-logo-img"
              />
            </div>
            <span className="top-header-slogan">Energy For Future</span>
          </div>
          <div className="top-header-right">
            <div className="top-header-company">
              <span className="top-header-company-name">VoltageEnergy</span>
              <span className="top-header-company-subtitle">能源科技</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="step-indicator-container">
        <StepIndicator currentStep={currentStep} totalSteps={getTotalSteps()} />
      </div>
      
      {/* Main Content */}
      <div className="app-layout">
        <div className="layout-left">
          <MicrogridVisualization 
            config={config} 
            currentStep={currentStep}
            selectedOption={selectedOption}
          />
        </div>
        <div className="layout-right">
          <QuestionCard
            title={getStepTitle()}
            description={getStepDescription()}
            infoMessage={getStepInfoMessage()}
            stepNumber={currentStep}
            totalSteps={getTotalSteps()}
            onPrevious={currentStep > 1 ? handlePrevious : undefined}
            onNext={handleNext}
            canProceed={canProceed()}
          >
            {renderStepContent()}
          </QuestionCard>
        </div>
      </div>
    </div>
  );
}

export default App;
