import OptionButton from '../OptionButton';
import type { EMSControlMethod } from '../../types';

interface Step8EMSProps {
  emsControlMethod: EMSControlMethod | null;
  onSelect: (method: EMSControlMethod) => void;
}

export default function Step8EMS({ emsControlMethod, onSelect }: Step8EMSProps) {
  return (
    <div>
      <OptionButton
        label="边端控制"
        description="本地边缘计算控制，响应速度快，适合实时性要求高的场景"
        selected={emsControlMethod === 'edge'}
        onClick={() => onSelect('edge')}
      />
      <OptionButton
        label="云端控制"
        description="基于云平台的集中控制，便于远程管理和数据分析"
        selected={emsControlMethod === 'cloud'}
        onClick={() => onSelect('cloud')}
      />
      <OptionButton
        label="基于预测"
        description="结合天气预报和负载预测的智能控制，优化能源使用效率"
        selected={emsControlMethod === 'prediction'}
        onClick={() => onSelect('prediction')}
      />
    </div>
  );
}
