import { useState } from 'react';
import OptionButton from '../OptionButton';
import './Step2Brackets.css';

interface Step2BracketsProps {
  bracketSets: number;
  componentModel?: string;
  bracketCapacity?: number;
  onUpdate: (data: { bracketSets: number; componentModel?: string; bracketCapacity?: number }) => void;
}

export default function Step2Brackets({ bracketSets, componentModel, bracketCapacity, onUpdate }: Step2BracketsProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleBracketSetsChange = (sets: number) => {
    const footprint = sets * 260; // 每套260平方米
    onUpdate({ bracketSets: sets, bracketCapacity: sets * 32 });
  };

  return (
    <div>
      <div className="bracket-sets-selector">
        {[1, 2, 3, 4, 5].map((sets) => (
          <OptionButton
            key={sets}
            label={`${sets}套折叠支架`}
            description={`${sets * 32}块组件，占地面积约${sets * 260}平方米（无阴影遮挡）`}
            selected={bracketSets === sets}
            onClick={() => handleBracketSetsChange(sets)}
          />
        ))}
      </div>
      
      {bracketSets > 0 && (
        <div className="bracket-details">
          <button 
            className="toggle-details-btn"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '隐藏' : '显示'}详细信息
          </button>
          
          {showDetails && (
            <div className="details-form">
              <div className="form-group">
                <label>组件型号：</label>
                <input
                  type="text"
                  value={componentModel || ''}
                  onChange={(e) => onUpdate({ bracketSets, componentModel: e.target.value, bracketCapacity })}
                  placeholder="请输入组件型号"
                />
              </div>
              <div className="info-display">
                <p><strong>折叠支架容量：</strong>{bracketSets * 32}块组件</p>
                <p><strong>占地面积：</strong>{bracketSets * 260}平方米（无阴影遮挡）</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
