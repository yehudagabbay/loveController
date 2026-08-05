import MainMenu from '../layout/MainMenu'
import FlowerRoulette from '../animations/FlowerRoulette'
import { useLanguage } from '../../localization/languageStore'
import LanguageSwitcher from '../../localization/components/LanguageSwitcher'
import './Welcom.css'

export default function Welcom({
  user,
  activePage = 'home',
  onNavigate,
  onLogout,
  children,
}) {
  const { t } = useLanguage()

  const displayName = user?.nickname || 'LIBA'

  const statusText =
    user?.entryType === 'google'
      ? t('welcome.googleSuccess')
      : user?.entryType === 'login'
        ? t('welcome.loginSuccess')
        : t('welcome.registerSuccess')

  return (
    <main className="welcome-page">
      <LanguageSwitcher />

      <MainMenu
        activeItem={activePage}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {children ? (
        children
      ) : (
        <section className="welcome-shell" aria-labelledby="welcome-title">
          <div className="welcome-flower-quadrant">
            <FlowerRoulette
              size="clamp(220px, 22vw, 440px)"
              tapToSpin
              className="welcome-main-flower"
            />
          </div>

          <div className="welcome-content-quadrant">
            <div className="welcome-brand">{t('common.brand')}</div>

            <p className="welcome-created">{statusText}</p>

            <h1 id="welcome-title">{t('welcome.title')}</h1>

            <p className="welcome-message">
              {t('welcome.greetingPrefix')}, {displayName}. {t('welcome.next')}
            </p>

            <button
              type="button"
              className="welcome-games-button"
              onClick={() => onNavigate?.('games')}
            >
              {t('welcome.startGames')}
            </button>
          </div>
        </section>
      )}
    </main>
  )
}
