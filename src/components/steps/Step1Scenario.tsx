import OptionButton from '../OptionButton';
import type { ScenarioType } from '../../types';

interface Step1ScenarioProps {
  selectedScenario: ScenarioType | null;
  onSelect: (scenario: ScenarioType) => void;
}

export default function Step1Scenario({ selectedScenario, onSelect }: Step1ScenarioProps) {
  return (
    <div>
      <OptionButton
        label="已知负载情况"
        description="当您已经了解具体的负载需求时，系统将根据负载情况自动配置合适的设备"
        selected={selectedScenario === 'known-load'}
        onClick={() => onSelect('known-load')}
      />
      <OptionButton
        label="任意DIY"
        description="您可以自由配置各种参数，包括逆变器数量、电流等详细参数"
        selected={selectedScenario === 'diy'}
        onClick={() => onSelect('diy')}
      />
      <OptionButton
        label="无负载情况"
        description="适用于新建项目或容量规划，系统将根据光储一体化托盘容量进行配置"
        selected={selectedScenario === 'no-load'}
        onClick={() => onSelect('no-load')}
      />
    </div>
  );
}
