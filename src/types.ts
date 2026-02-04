// 配置场景类型
export type ScenarioType = 'known-load' | 'diy' | 'no-load';

// 电压等级
export type VoltageLevel = '120V/240V' | '120V/208V' | '277V/480V';

// EMS控制方式
export type EMSControlMethod = 'edge' | 'cloud' | 'prediction';

// 储能容量支撑天数
export type StorageDays = 1 | 2 | 3;

// 光储一体化托盘容量大小
export type TrayCapacity = 'small' | 'medium' | 'large';

// 发电机容量（无负载情况）
export type GeneratorCapacity = 'small' | 'medium' | 'large';

// 配置数据接口
export interface ConfigData {
  scenario: ScenarioType;
  // 折叠支架相关
  bracketSets: number;
  componentModel?: string;
  bracketCapacity?: number;
  footprint?: number; // 占地面积（平方米）
  
  // 柴油发电机
  hasGenerator: boolean;
  generatorCapacity?: GeneratorCapacity;
  
  // 电压等级
  voltageLevel: VoltageLevel;
  
  // 电流（仅DIY场景）
  requiredCurrent?: number;
  
  // 逆变器数量（仅DIY场景）
  inverterCount?: number;
  
  // 储能容量支撑天数
  storageDays: StorageDays;
  
  // EMS控制方式
  emsControlMethod: EMSControlMethod;
  
  // 光储一体化托盘容量（仅无负载场景）
  trayCapacity?: TrayCapacity;
  
  // 投资回报年限（输出）
  roiYears?: number;
}
