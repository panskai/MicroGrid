import { useState, useEffect, useMemo } from 'react';
import { useLang } from '@/context/LangContext';
import StepIndicator from '@/components/ui/StepIndicator';
import QuestionCard from '@/components/ui/QuestionCard';
import SideNav, { type NavPage } from './components/layout/SideNav';
import StandardProductPage from './components/pages/StandardProductPage';
import StepLocation from './components/wizard/known-load/StepLocation';
import Step2Brackets from './components/wizard/known-load/Step2Brackets';
import Step3Generator from './components/wizard/known-load/Step3Generator';
import Step4Voltage from './components/wizard/known-load/Step4Voltage';
import Step5LoadInput from './components/wizard/known-load/Step5LoadInput';
import StepArea from './components/wizard/known-load/StepArea';
import Step6Storage from './components/wizard/known-load/Step6Storage';
import Step7Tray from './components/wizard/known-load/Step7Tray';
import Step8EMS from './components/wizard/known-load/Step8EMS';
import StepOptimize from './components/wizard/known-load/StepOptimize';
// DIY专用步骤
import StepDIYSetup from './components/wizard/diy/StepDIYSetup';
import StepDIYAreaSetup from './components/wizard/diy/StepDIYAreaSetup';
import StepDIYInverter from './components/wizard/diy/StepDIYInverter';
import StepDIYStorage from './components/wizard/diy/StepDIYStorage';
import StepDIYGenerator from './components/wizard/diy/StepDIYGenerator';
import ResultPage from './components/result/ResultPage';
import PlanSelectionPage from './components/pages/PlanSelectionPage';
import ConfigTopology from './components/topology/ConfigTopology';
import ConfigSummaryPanel from './components/ui/ConfigSummaryPanel';
import { configToTopologyData } from './utils/configToTopology';
import WelcomePage from './components/pages/WelcomePage';
import type { ConfigData, CalculateResponse, OptimizeOption } from './types/index';
import { calculateFull, checkHealth, optimizeMicrogrid } from '@/api/client';
import { DEFAULT_PANEL_MODEL, DEFAULT_BRACKET_MODEL, DEFAULT_BATTERY_MODEL, getBatteryByModel } from '@/data/products';
import { useProducts } from '@/context/ProductsContext';
import './App.css';

// 默认配置值
const DEFAULT_CONFIG: ConfigData = {
  scenario:            'known-load',
  bracketSets:         0,
  panelModel:          DEFAULT_PANEL_MODEL,
  bracketModel:        DEFAULT_BRACKET_MODEL,
  hasGenerator:        false,
  dieselCapacityKw:    0,
  dieselIsNew:         false,
  voltageLevel:        null as any,
  storageDays:         null as any,
  batteryPackModel:    DEFAULT_BATTERY_MODEL,
  emsControlMethod:    'edge',
  emsAddons:           [],
  loadType:            'residential',
  electricityPriceUsd: 0.35,
  dieselPriceUsd:      0.95,
  latitude:            25.0,
};

function App() {
  const { t, lang } = useLang();
  const [showWelcome, setShowWelcome]         = useState(true);
  // navPage is always a valid NavPage (never null) — default to first standard product
  const [navPage, setNavPage]                 = useState<NavPage>('standard-small');
  const [currentStep, setCurrentStep]         = useState(1);
  const [selectedOption, setSelectedOption]   = useState<string>('');
  const [config, setConfig]                   = useState<ConfigData>({ ...DEFAULT_CONFIG });
  const [apiResult, setApiResult]             = useState<CalculateResponse | null>(null);
  const [isCalculating, setIsCalculating]     = useState(false);
  const [apiError, setApiError]               = useState<string | null>(null);
  const [apiAvailable, setApiAvailable]       = useState<boolean | null>(null);

  // 方案选择页状态
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [planOptions, setPlanOptions]             = useState<OptimizeOption[]>([]);
  const [planDieselKw, setPlanDieselKw]           = useState(0);
  const [isLoadingDetail, setIsLoadingDetail]     = useState(false);

  // PyPSA 精算状态（后台升级）
  const [isPypsaRunning, setIsPypsaRunning]       = useState(false);

  // 当前是否处于 wizard 流程中（已知负载 / DIY）
  const inWizard = navPage === 'custom-known' || navPage === 'custom-diy';
  const scenario = navPage === 'custom-known' ? 'known-load' : navPage === 'custom-diy' ? 'diy' : null;

  // 产品目录
  const { calcPvKw, isFromAPI: productsFromAPI, isLoading: productsLoading } = useProducts();

  useEffect(() => {
    checkHealth().then(ok => setApiAvailable(ok));
  }, []);

  const topology = useMemo(() => configToTopologyData(config, lang), [config, lang]);

  const updateConfig = (updates: Partial<ConfigData>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // ── 切换导航页 ────────────────────────────────────────────────
  const handleNavigate = (page: NavPage) => {
    setNavPage(page);
    // 重置 wizard 状态
    setCurrentStep(1);
    setApiResult(null);
    setApiError(null);
    setShowPlanSelection(false);
    setPlanOptions([]);
    setIsCalculating(false);
    setIsPypsaRunning(false);
    if (page === 'custom-known') {
      setConfig({ ...DEFAULT_CONFIG, scenario: 'known-load' });
    } else if (page === 'custom-diy') {
      setConfig({ ...DEFAULT_CONFIG, scenario: 'diy' });
    } else {
      setConfig({ ...DEFAULT_CONFIG });
    }
  };

  // ── 步骤类型映射 ─────────────────────────────────────────────
  const getStepType = (step: number): string => {
    if (scenario === 'known-load') {
      if (step === 1) return 'location';
      if (step === 2) return 'load-input';
      if (step === 3) return 'area';
      if (step === 4) return 'generator';
      if (step === 5) return 'voltage';
      if (step === 6) return 'ems';
    } else if (scenario === 'diy') {
      // DIY流程: 场地面积+组件 → 逆变器选型 → 储能电池 → 柴发 → EMS
      if (step === 1) return 'diy-area-setup';
      if (step === 2) return 'diy-inverter';
      if (step === 3) return 'diy-storage';
      if (step === 4) return 'diy-generator';
      if (step === 5) return 'ems';
    }
    return '';
  };

  const getTotalSteps = () => {
    if (scenario === 'known-load') return 6;
    if (scenario === 'diy') return 5;  // 场地面积 → 逆变器 → 储能 → 柴发 → EMS
    return 6;
  };

  // ── 能否继续到下一步 ──────────────────────────────────────────
  const canProceed = (): boolean => {
    const stepType = getStepType(currentStep);
    switch (stepType) {
      case 'location':    return !!(config.latitude && config.peakSunHoursPerDay);
      case 'load-input':  return !!(config.annualLoadKwh && config.annualLoadKwh > 0);
      case 'area':        return !!(config.availableAreaM2 && config.availableAreaM2 > 0);
      case 'brackets':    return config.bracketSets > 0;
      case 'generator':   return true;
      case 'voltage':     return !!config.voltageLevel;
      // DIY 专用步骤
      case 'diy-area-setup': return !!(config.availableAreaM2 && config.availableAreaM2 > 0);
      case 'diy-inverter':   return !!(config.inverterCount && config.inverterCount > 0 && config.inverterKw && config.inverterKw > 0);
      case 'diy-storage':    return !!(config.batteryPackCount && config.batteryPackCount > 0);
      case 'diy-generator':  return true;   // 柴发可选
      case 'diy-setup':      return !!config.voltageLevel;  // 电流可选，仅电压必填
      case 'tray':        return !!config.trayCapacity;
      case 'storage':     return !!config.storageDays;
      case 'ems':         return true;
      default:            return false;
    }
  };

  // ── 导航 ─────────────────────────────────────────────────────
  const handleNext = async () => {
    const total = getTotalSteps();
    if (currentStep < total) {
      setCurrentStep(currentStep + 1);
    } else {
      await runCalculation();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const runCalculation = async () => {
    setIsCalculating(true);
    setApiError(null);
    setApiResult(null);
    setShowPlanSelection(false);

    try {
      if (apiAvailable === false) {
        throw new Error(t('app.api_unavailable'));
      }

      if (scenario === 'known-load' && config.annualLoadKwh && config.annualLoadKwh > 0) {
        const bracket = config.bracketModel || DEFAULT_BRACKET_MODEL;
        const areaPerSet = 260;
        const maxSets = config.availableAreaM2
          ? Math.max(1, Math.floor(config.availableAreaM2 / areaPerSet))
          : 8;

        const optRes = await optimizeMicrogrid({
          annualLoadKwh:          config.annualLoadKwh,
          peakSunHours:           config.peakSunHoursPerDay ?? 4.5,
          dieselPriceUsdPerLiter: config.dieselPriceUsd,
          dieselIsNew:            config.dieselIsNew,
          panelModel:             config.panelModel,
          bracketModel:           bracket,
          batteryPackModel:       config.batteryPackModel,
          availableAreaM2:        config.availableAreaM2 ?? null,
          existingDieselKw:       config.hasGenerator ? (config.dieselCapacityKw || null) : null,
          maxBracketSets:         maxSets,
          objective:              'payback',
        });

        if (!optRes.success || !optRes.options?.length) {
          throw new Error(optRes.error || t('app.opt_failed'));
        }

        setPlanOptions(optRes.options);
        setPlanDieselKw(optRes.dieselKw ?? 0);
        setShowPlanSelection(true);
        return;

      } else {
        // diy 场景：用户在向导中已确定逆变器数量、电池包数量、柴发选择
        // bracketSets 已在 diy-area 步骤中通过 updateConfig 写入 config
        const packModel = config.batteryPackModel ?? DEFAULT_BATTERY_MODEL;
        const packKwh   = getBatteryByModel(packModel).capacityKwh;
        const batteryKwh = (config.batteryPackCount ?? 1) * packKwh;
        // 将电池容量/逆变器功率 转换为 storageDays 估算（向上取整）
        const invKw = config.totalInverterKw ?? (config.inverterKw ?? 10) * (config.inverterCount ?? 1);
        const backupHCalc = invKw > 0 ? batteryKwh / invKw : 8;
        const storageDaysCalc: 1 | 2 | 3 = backupHCalc <= 12 ? 1 : backupHCalc <= 30 ? 2 : 3;
        const diyConfig = {
          ...config,
          storageDays:  storageDaysCalc,
          // DIY流程不要求用户选择电压，发送默认值给后端
          voltageLevel: config.voltageLevel ?? '120V/240V',
          // bracketSets already set in config by diy-area step
          // hasGenerator / dieselCapacityKw / dieselIsNew set by diy-generator step
        };
        setCurrentStep(getTotalSteps() + 1);
        setIsPypsaRunning(true);
        const result = await calculateFull(diyConfig);
        if (!result.success) {
          throw new Error(result.error || t('app.pypsa_failed'));
        }
        setApiResult(result);
        setIsPypsaRunning(false);
      }
    } catch (err: any) {
      const msg: string = err.message || String(err);
      // 网络层错误（后端未启动）→ 显示友好提示
      const isNetworkErr = msg.includes('fetch') || msg.includes('Failed') ||
        msg.includes('ECONNREFUSED') || msg.includes('Errno') ||
        msg.includes('NetworkError') || msg.includes('Load failed') ||
        msg.includes('仿真请求失败') || msg.includes('计算请求失败');
      setApiError(isNetworkErr ? t('app.api_unavailable') : msg);
      setCurrentStep(getTotalSteps() + 1);
      setIsPypsaRunning(false);
    } finally {
      setIsCalculating(false);
    }
  };

  const handlePlanSelect = async (opt: OptimizeOption) => {
    setIsLoadingDetail(true);
    setApiError(null);
    setApiResult(null);
    setIsPypsaRunning(false);
    setIsCalculating(true);   // ← show loading spinner immediately on ResultPage

    const updatedConfig: ConfigData = {
      ...config,
      bracketSets:      opt.bracketSets,
      dieselCapacityKw: opt.dieselKw,
      dieselIsNew:      opt.dieselIsNew,
      storageDays:      1,
      emsControlMethod: 'edge',
    };
    setConfig(updatedConfig);
    setShowPlanSelection(false);
    setCurrentStep(getTotalSteps() + 1);

    // 直接运行 PyPSA 精算（8760h 逐小时仿真），不使用快速估算
    setIsPypsaRunning(true);
    try {
      const fullResult = await calculateFull(updatedConfig);
      if (!fullResult.success) throw new Error(fullResult.error || t('app.pypsa_detail_failed'));
      setApiResult(fullResult);
    } catch (err: any) {
      const msg: string = err.message || String(err);
      const isNetworkErr = msg.includes('fetch') || msg.includes('Failed') ||
        msg.includes('ECONNREFUSED') || msg.includes('Errno') ||
        msg.includes('NetworkError') || msg.includes('Load failed') ||
        msg.includes('仿真请求失败') || msg.includes('计算请求失败');
      setApiError(isNetworkErr ? t('app.api_unavailable') : msg);
    } finally {
      setIsPypsaRunning(false);
      setIsLoadingDetail(false);
      setIsCalculating(false);  // ← clear loading state after result arrives
    }
  };

  const getStepTitle = (): string => {
    const titleMap: Record<string, string> = {
      location:        t('step.location.title'),
      'load-input':    t('step.load.title'),
      area:            t('step.area.title'),
      brackets:        t('step.area.title'),
      generator:       t('step.generator.title'),
      voltage:         t('step.voltage.title'),
      'diy-setup':       t('step.diy.voltage.title'),
      'diy-area-setup':  t('step.diy.area.setup.title'),
      'diy-inverter':    t('step.diy.inverter.title'),
      'diy-storage':   t('step.diy.storage.title'),
      'diy-generator': t('step.diy.generator.title'),
      ems:             t('step.ems.title'),
    };
    return titleMap[getStepType(currentStep)] || t('step.default.title');
  };

  const getStepDescription = (): string => {
    const descMap: Record<string, string> = {
      location:        t('step.location.desc'),
      'load-input':    t('step.load.desc'),
      area:            t('step.area.desc'),
      generator:       t('step.generator.desc'),
      voltage:         t('step.voltage.desc'),
      'diy-setup':       t('step.diy.voltage.desc'),
      'diy-area-setup':  t('step.diy.area.setup.desc'),
      'diy-inverter':    t('step.diy.inverter.desc'),
      'diy-storage':   t('step.diy.storage.desc'),
      'diy-generator': t('step.diy.generator.desc'),
      ems:             t('step.ems.desc'),
    };
    return descMap[getStepType(currentStep)] || '';
  };

  const getStepInfoMessage = (): string => {
    const infoMap: Record<string, string> = {
      location:        t('info.location'),
      'load-input':    t('info.load'),
      area:            t('info.area'),
      generator:       t('info.generator'),
      voltage:         t('info.voltage'),
      ems:             t('info.ems'),
      'diy-setup':       t('info.diy.voltage'),
      'diy-area-setup':  t('info.diy.area.setup'),
      'diy-inverter':    t('info.diy.inverter'),
      'diy-storage':   t('info.diy.storage'),
      'diy-generator': t('info.diy.generator'),
    };
    return infoMap[getStepType(currentStep)] || '';
  };

  // ── 渲染步骤内容 ──────────────────────────────────────────────
  const renderStepContent = () => {
    if (currentStep === getTotalSteps() + 1) return null;
    const stepType = getStepType(currentStep);
    const pvKw = calcPvKw(config.bracketSets, config.panelModel, config.bracketModel);

    switch (stepType) {
      case 'location':
        return (
          <StepLocation
            locationName={config.locationName}
            latitude={config.latitude}
            longitude={config.longitude}
            peakSunHoursPerDay={config.peakSunHoursPerDay}
            annualEffHours={config.annualEffHours}
            panelModel={config.panelModel}
            onUpdate={data => updateConfig(data)}
          />
        );
      case 'load-input':
        return (
          <Step5LoadInput
            annualLoadKwh={config.annualLoadKwh}
            loadType={config.loadType}
            loadInputMode={config.loadInputMode}
            peakLoadKw={config.peakLoadKw}
            onUpdate={data => updateConfig(data)}
          />
        );
      case 'area':
        return (
          <StepArea
            availableAreaM2={config.availableAreaM2}
            bracketModel={config.bracketModel}
            onUpdate={data => updateConfig(data)}
          />
        );
      case 'brackets':
        return (
          <Step2Brackets
            bracketSets={config.bracketSets}
            panelModel={config.panelModel}
            bracketModel={config.bracketModel}
            onUpdate={data => { updateConfig(data); setSelectedOption(String(data.bracketSets ?? '')); }}
          />
        );
      case 'generator':
        return (
          <Step3Generator
            config={config}
            onUpdate={data => { updateConfig(data); setSelectedOption(data.hasGenerator ? 'yes' : 'no'); }}
          />
        );
      case 'voltage':
        return (
          <Step4Voltage
            voltageLevel={config.voltageLevel}
            onSelect={v => { updateConfig({ voltageLevel: v }); setSelectedOption(v); }}
          />
        );
      case 'optimize':
        return (
          <StepOptimize
            annualLoadKwh={config.annualLoadKwh ?? 0}
            dieselPriceUsd={config.dieselPriceUsd}
            hasGenerator={config.hasGenerator}
            dieselCapacityKw={config.dieselCapacityKw}
            dieselIsNew={config.dieselIsNew}
            panelModel={config.panelModel}
            batteryPackModel={config.batteryPackModel}
            onSelect={updates => updateConfig(updates)}
          />
        );
      // ── DIY 专用步骤 ──────────────────────────────────────
      case 'diy-setup':
        return (
          <StepDIYSetup
            voltageLevel={config.voltageLevel}
            requiredCurrent={config.requiredCurrent}
            inverterKw={config.inverterKw}
            inverterCount={config.inverterCount}
            onUpdate={data => updateConfig(data)}
          />
        );
      case 'diy-area-setup':
        return (
          <StepDIYAreaSetup
            availableAreaM2={config.availableAreaM2}
            panelModel={config.panelModel}
            bracketModel={config.bracketModel}
            onUpdate={data => {
              const bModel = (data as any).bracketModel ?? config.bracketModel ?? 'standard_32';
              const pModel = (data as any).panelModel  ?? config.panelModel  ?? '655W';
              const area   = (data as any).availableAreaM2 ?? config.availableAreaM2 ?? 0;
              const sets   = area > 0 ? Math.max(1, Math.floor(area / 260)) : 0;
              const pvKwComputed = calcPvKw(sets, pModel, bModel);
              updateConfig({ ...data, bracketSets: sets, pvCapacityKw: pvKwComputed } as any);
            }}
          />
        );
      case 'diy-inverter':
        return (
          <StepDIYInverter
            inverterKw={config.inverterKw}
            inverterCount={config.inverterCount}
            totalInverterKw={config.totalInverterKw}
            pvCapacityKw={(config as any).pvCapacityKw ?? 0}
            onUpdate={data => {
              updateConfig(data);
              if ((data as any).inverterCount) setSelectedOption(String((data as any).inverterCount));
            }}
          />
        );
      case 'diy-storage':
        return (
          <StepDIYStorage
            trayCount={(config as any).trayCount ?? 1}
            batteryPackModel={config.batteryPackModel}
            batteryPackCount={config.batteryPackCount}
            totalInverterKw={config.totalInverterKw}
            onUpdate={data => updateConfig(data)}
          />
        );
      case 'diy-generator':
        return (
          <StepDIYGenerator
            hasGenerator={config.hasGenerator}
            dieselIsNew={config.dieselIsNew}
            dieselCapacityKw={config.dieselCapacityKw}
            dieselMaxVoltageV={(config as any).dieselMaxVoltageV}
            dieselMaxCurrentA={(config as any).dieselMaxCurrentA}
            dieselMaxPowerKw={(config as any).dieselMaxPowerKw}
            onUpdate={data => { updateConfig(data); setSelectedOption((data as any).hasGenerator ? 'yes' : 'no'); }}
          />
        );
      case 'tray':
        return (
          <Step7Tray
            trayCapacity={config.trayCapacity || null}
            onSelect={cap => { updateConfig({ trayCapacity: cap }); setSelectedOption(cap); }}
          />
        );
      case 'storage':
        return (
          <Step6Storage
            storageDays={config.storageDays}
            batteryPackModel={config.batteryPackModel}
            dieselCapacityKw={config.dieselCapacityKw}
            pvCapacityKw={pvKw}
            bracketSets={config.bracketSets}
            panelModel={config.panelModel}
            annualLoadKwh={config.annualLoadKwh ?? 0}
            onUpdate={data => { updateConfig(data); setSelectedOption(String(data.storageDays ?? '')); }}
          />
        );
      case 'ems':
        return (
          <Step8EMS
            emsAddons={config.emsAddons ?? []}
            onUpdate={data => updateConfig(data)}
          />
        );
      default:
        return null;
    }
  };

  // ── 欢迎页 ───────────────────────────────────────────────────
  if (showWelcome) {
    return <WelcomePage onStart={() => setShowWelcome(false)} />;
  }

  // ── 方案选择页 ────────────────────────────────────────────────
  if (showPlanSelection) {
    return (
      <div className="app">
        <div className="app-body">
          <SideNav activePage={navPage} onNavigate={handleNavigate} apiAvailable={apiAvailable} />
          <div className="app-main-content">
            <PlanSelectionPage
              options={planOptions}
              dieselKw={planDieselKw}
              annualLoadKwh={config.annualLoadKwh ?? 0}
              isLoadingDetail={isLoadingDetail}
              onSelect={handlePlanSelect}
              onBack={() => {
                setShowPlanSelection(false);
                setIsCalculating(false);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── 结果页 ────────────────────────────────────────────────────
  if (inWizard && currentStep === getTotalSteps() + 1) {
    return (
      <div className="app">
        <div className="app-body">
          <SideNav activePage={navPage} onNavigate={handleNavigate} apiAvailable={apiAvailable} />
          <div className="app-main-content">
            <ResultPage
              config={config}
              apiResult={apiResult}
              isCalculating={isCalculating}
              apiError={apiError}
              isPypsaRunning={isPypsaRunning}
              onRetry={runCalculation}
              onRestart={() => {
                setCurrentStep(1);
                setApiResult(null);
                setApiError(null);
                setConfig({ ...DEFAULT_CONFIG, scenario: scenario ?? 'known-load' });
                setShowPlanSelection(false);
                setPlanOptions([]);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── 标准化产品页 ─────────────────────────────────────────────
  if (!inWizard) {
    const sizeMap: Record<NavPage, 'small' | 'medium' | 'large'> = {
      'standard-small':  'small',
      'standard-medium': 'medium',
      'standard-large':  'large',
      'custom-known':    'small',
      'custom-diy':      'small',
    };
    return (
      <div className="app">
        <div className="app-body">
          <SideNav activePage={navPage} onNavigate={handleNavigate} apiAvailable={apiAvailable} />
          <div className="app-main-content app-main-scroll">
            <StandardProductPage size={sizeMap[navPage]} />
          </div>
        </div>
      </div>
    );
  }

  // ── 配置流程 Wizard ──────────────────────────────────────────
  return (
    <div className="app">
      <div className="app-body">
        <SideNav activePage={navPage} onNavigate={handleNavigate} apiAvailable={apiAvailable} />
        <div className="app-main-content app-main-flow">
          {/* Step Indicator */}
          <div className="step-indicator-container">
            <StepIndicator currentStep={currentStep} totalSteps={getTotalSteps()} />
          </div>

          {/* Main Content */}
          <div className="app-layout">
            <div className="layout-left">
              <ConfigTopology data={topology.data} visibility={topology.visibility} pvFullFields={topology.pvFullFields} />
              {(scenario === 'known-load' || scenario === 'diy') && (
                <ConfigSummaryPanel config={config} scenario={scenario} />
              )}
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
                canProceed={canProceed() && !isCalculating}
                nextLabel={
                  isCalculating
                    ? t('btn.calculating')
                    : currentStep === getTotalSteps()
                    ? t('app.generate_plans')
                    : t('btn.next')
                }
              >
                {renderStepContent()}
              </QuestionCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
