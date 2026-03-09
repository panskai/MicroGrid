import { useLang } from '@/context/LangContext';
import './WelcomePage.css';

interface WelcomePageProps {
  onStart?: () => void;
}

export default function WelcomePage({ onStart }: WelcomePageProps) {
  const { t, lang, setLang } = useLang();

  const handleGetStarted = () => {
    if (onStart) {
      onStart();
    } else {
      window.postMessage({ type: 'START_CONFIG' }, '*');
      window.dispatchEvent(new CustomEvent('startConfig'));
    }
  };

  return (
    <div className="welcome-page">
      {/* Header Banner */}
      <div className="welcome-header">
        <div className="header-content">

          {/* 左侧：VOLTAGE Logo */}
          <div className="header-logo-section">
            <img
              src={`${import.meta.env.BASE_URL}voltage-full-logo-white.png`}
              alt="VOLTAGE"
              className="voltage-logo-img"
            />
          </div>

          {/* 中间弹性空白 */}
          <div style={{ flex: 1 }} />

          {/* 右侧：品牌文字 + 语言切换 */}
          <div className="header-right">
            <div className="header-brand-section">
              <span className="header-slogan">{t('welcome.slogan')}</span>
              <div className="header-brand">
                <span className="brand-text">{t('welcome.brand')}</span>
                <span className="brand-subtitle">{t('welcome.subtitle')}</span>
              </div>
            </div>
            {/* 语言切换按钮 */}
            <button
              className="lang-toggle"
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              title={lang === 'zh' ? '切换为英文 / Switch to English' : '切换为中文 / Switch to Chinese'}
            >
              <span className="lang-toggle-label">
                {lang === 'zh' ? '中' : 'EN'}
              </span>
              <span className="lang-toggle-divider">⇄</span>
              <span className="lang-toggle-label lang-toggle-target">
                {lang === 'zh' ? 'EN' : '中'}
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Content */}
      <div className="welcome-content">
        <div className="content-wrapper">
          <h1 className="welcome-title">
            <span className="title-prefix">{t('welcome.prefix')}</span>
            <span className="title-main">{t('welcome.title')}</span>
          </h1>

          <div className="welcome-description">
            <p className="description-text">{t('welcome.desc1')}</p>
            <p className="description-text">{t('welcome.desc2')}</p>
          </div>

          <button className="welcome-cta" onClick={handleGetStarted}>
            {t('welcome.cta')}
            <span className="cta-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
