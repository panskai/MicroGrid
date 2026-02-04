import { useState } from 'react';
import OptionButton from '../OptionButton';
import './Step5DIY.css';

interface Step5DIYProps {
  requiredCurrent?: number;
  inverterCount?: number;
  onUpdate: (data: { requiredCurrent?: number; inverterCount?: number }) => void;
}

export default function Step5DIY({ requiredCurrent, inverterCount, onUpdate }: Step5DIYProps) {
  const [currentInput, setCurrentInput] = useState(requiredCurrent?.toString() || '');

  const handleInverterSelect = (count: number) => {
    onUpdate({ inverterCount: count });
  };

  const handleCurrentChange = (value: string) => {
    setCurrentInput(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      onUpdate({ requiredCurrent: numValue });
    }
  };

  return (
    <div>
      <div className="diy-section">
        <h3 style={{ marginBottom: '1rem' }}>所需电流（A）</h3>
        <input
          type="number"
          className="current-input"
          value={currentInput}
          onChange={(e) => handleCurrentChange(e.target.value)}
          placeholder="请输入所需电流"
          min="0"
          step="0.1"
        />
      </div>

      <div className="diy-section">
        <h3 style={{ marginBottom: '1rem' }}>逆变器数量</h3>
        {[1, 2, 3].map((count) => {
          const bracketSets = count;
          const traySets = count <= 2 ? 1 : 2;
          return (
            <OptionButton
              key={count}
              label={`${count}台逆变器`}
              description={`${bracketSets}套折叠支架，${traySets}套托盘`}
              selected={inverterCount === count}
              onClick={() => handleInverterSelect(count)}
            />
          );
        })}
      </div>
    </div>
  );
}
