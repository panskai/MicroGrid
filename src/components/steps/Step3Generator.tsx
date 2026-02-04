import OptionButton from '../OptionButton';
import type { ConfigData, GeneratorCapacity } from '../../types';

interface Step3GeneratorProps {
  config: ConfigData;
  onUpdate: (data: Partial<ConfigData>) => void;
}

export default function Step3Generator({ config, onUpdate }: Step3GeneratorProps) {
  const handleGeneratorChange = (hasGenerator: boolean) => {
    if (hasGenerator) {
      if (config.scenario === 'no-load' && !config.hasGenerator) {
        // 无负载场景，如果之前没有发电机，需要选择容量
        onUpdate({ hasGenerator: true, generatorCapacity: 'medium' });
      } else {
        onUpdate({ hasGenerator: true });
      }
    } else {
      if (config.scenario === 'no-load') {
        // 无负载场景，没有发电机时需要选择容量
        onUpdate({ hasGenerator: false, generatorCapacity: 'medium' });
      } else {
        onUpdate({ hasGenerator: false });
      }
    }
  };

  return (
    <div>
      <OptionButton
        label="是，原场地具备柴油发电机"
        description="系统将集成现有的柴油发电机，提升系统韧性"
        selected={config.hasGenerator}
        onClick={() => handleGeneratorChange(true)}
      />
      <OptionButton
        label="否，原场地没有柴油发电机"
        description={config.scenario === 'no-load' 
          ? "系统将根据负载情况配置合适的发电机容量" 
          : "系统将根据负载情况配置发电机"}
        selected={!config.hasGenerator}
        onClick={() => handleGeneratorChange(false)}
      />
      
      {config.scenario === 'no-load' && !config.hasGenerator && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
          <p style={{ marginBottom: '1rem', fontWeight: 600 }}>请选择发电机容量：</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {(['small', 'medium', 'large'] as GeneratorCapacity[]).map((capacity) => (
              <OptionButton
                key={capacity}
                label={capacity === 'small' ? '小容量' : capacity === 'medium' ? '中容量' : '大容量'}
                selected={config.generatorCapacity === capacity}
                onClick={() => onUpdate({ generatorCapacity: capacity })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
