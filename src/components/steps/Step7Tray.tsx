import OptionButton from '../OptionButton';
import type { TrayCapacity } from '../../types';

interface Step7TrayProps {
  trayCapacity: TrayCapacity | null;
  onSelect: (capacity: TrayCapacity) => void;
}

export default function Step7Tray({ trayCapacity, onSelect }: Step7TrayProps) {
  return (
    <div>
      <OptionButton
        label="小容量"
        description="适用于小型项目，对应较小的电池包配置"
        selected={trayCapacity === 'small'}
        onClick={() => onSelect('small')}
      />
      <OptionButton
        label="中容量"
        description="适用于中型项目，平衡容量和成本"
        selected={trayCapacity === 'medium'}
        onClick={() => onSelect('medium')}
      />
      <OptionButton
        label="大容量"
        description="适用于大型项目，提供更大的储能容量"
        selected={trayCapacity === 'large'}
        onClick={() => onSelect('large')}
      />
    </div>
  );
}
