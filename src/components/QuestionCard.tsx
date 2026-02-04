import InfoBox from './InfoBox';
import './QuestionCard.css';

interface QuestionCardProps {
  title: string;
  description?: string;
  infoMessage?: string;
  children: React.ReactNode;
  stepNumber: number;
  totalSteps: number;
  onPrevious?: () => void;
  onNext?: () => void;
  canProceed: boolean;
}

export default function QuestionCard({
  title,
  description,
  infoMessage,
  children,
  stepNumber,
  totalSteps,
  onPrevious,
  onNext,
  canProceed,
}: QuestionCardProps) {
  return (
    <div className="question-card">
      <div className="question-header">
        <h2 className="question-title">{title}</h2>
        {description && <p className="question-description">{description}</p>}
      </div>
      
      {infoMessage && (
        <div className="question-info-section">
          <InfoBox message={infoMessage} />
        </div>
      )}
      <div className="question-content">
        {children}
      </div>
      
      <div className="question-footer">
        {onPrevious && (
          <button className="btn btn-secondary" onClick={onPrevious}>
            上一步
          </button>
        )}
        {onNext && (
          <button 
            className="btn btn-primary" 
            onClick={onNext}
            disabled={!canProceed}
          >
            {stepNumber === totalSteps ? '完成配置' : '下一步'}
          </button>
        )}
      </div>
    </div>
  );
}
