import './WelcomePage.css';

interface WelcomePageProps {
  onStart?: () => void;
}

export default function WelcomePage({ onStart }: WelcomePageProps) {
  const handleGetStarted = () => {
    if (onStart) {
      onStart();
    } else {
      // 触发开始配置的事件，由父组件处理
      window.postMessage({ type: 'START_CONFIG' }, '*');
      // 如果直接调用，触发自定义事件
      window.dispatchEvent(new CustomEvent('startConfig'));
    }
  };

  return (
    <div className="welcome-page">
      {/* Header Banner */}
      <div className="welcome-header">
        <div className="header-content">
          <div className="header-logo-section">
            <img 
              src="/voltage-full-logo-white.png" 
              alt="VOLTAGE" 
              className="voltage-logo-img"
            />
          </div>
          <div className="header-brand-section">
            <span className="header-slogan">Energy For Future</span>
            <div className="header-brand">
              <span className="brand-text">VoltageEnergy</span>
              <span className="brand-subtitle">能源科技</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="welcome-content">
        <div className="content-wrapper">
          <h1 className="welcome-title">
            <span className="title-prefix">体验</span>
            <span className="title-main">VoltageEnergy™ 微电网配置系统</span>
          </h1>

          <div className="welcome-description">
            <p className="description-text">
              VoltageEnergy 微电网配置系统是一个简单、标准化、经过验证且可扩展的解决方案，
              旨在加速微电网的部署，实现更高的韧性、能源成本优化和可持续性。
            </p>
            <p className="description-text">
              通过此配置工具，体验 VoltageEnergy 如何以速度和简洁性交付微电网解决方案。
            </p>
          </div>

          <button className="welcome-cta" onClick={handleGetStarted}>
            开始体验 VoltageEnergy 微电网配置系统！
            <span className="cta-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
