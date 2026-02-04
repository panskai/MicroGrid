import OptionButton from '../OptionButton';
import type { VoltageLevel } from '../../types';

interface Step4VoltageProps {
  voltageLevel: VoltageLevel | null;
  onSelect: (voltage: VoltageLevel) => void;
}

export default function Step4Voltage({ voltageLevel, onSelect }: Step4VoltageProps) {
  return (
    <div>
      <OptionButton
        label="120V/240V"
        selected={voltageLevel === '120V/240V'}
        onClick={() => onSelect('120V/240V')}
      />
      <OptionButton
        label="120V/208V"
        selected={voltageLevel === '120V/208V'}
        onClick={() => onSelect('120V/208V')}
      />
      <OptionButton
        label="277V/480V"
        selected={voltageLevel === '277V/480V'}
        onClick={() => onSelect('277V/480V')}
      />
    </div>
  );
}
