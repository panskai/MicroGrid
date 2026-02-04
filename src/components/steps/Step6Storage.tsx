import OptionButton from '../OptionButton';
import type { StorageDays } from '../../types';

interface Step6StorageProps {
  storageDays: StorageDays | null;
  onSelect: (days: StorageDays) => void;
}

export default function Step6Storage({ storageDays, onSelect }: Step6StorageProps) {
  const getCapacityLabel = (days: StorageDays) => {
    return days === 1 ? '容量1' : days === 2 ? '容量2' : '容量3';
  };

  return (
    <div>
      <OptionButton
        label="一天"
        description={`阴天情况下储能容量支撑1天（${getCapacityLabel(1)}）`}
        selected={storageDays === 1}
        onClick={() => onSelect(1)}
      />
      <OptionButton
        label="两天"
        description={`阴天情况下储能容量支撑2天（${getCapacityLabel(2)}）`}
        selected={storageDays === 2}
        onClick={() => onSelect(2)}
      />
      <OptionButton
        label="三天"
        description={`阴天情况下储能容量支撑3天（${getCapacityLabel(3)}）`}
        selected={storageDays === 3}
        onClick={() => onSelect(3)}
      />
    </div>
  );
}
