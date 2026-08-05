import { useLanguage } from '../../localization/languageStore'

const labels = {
  register: 'auth.switcher.register',
  login: 'auth.switcher.login',
}

export default function AuthSwitcher({ activeMode, onModeChange }) {
  const { t } = useLanguage()

  return (
    <nav
      className={`auth-switcher auth-switcher-${activeMode}`}
      aria-label={t('auth.switcher.aria')}
    >
      <button
        type="button"
        className="auth-switcher-button"
        aria-pressed={activeMode === 'register'}
        onClick={() => onModeChange?.('register')}
      >
        {t(labels.register)}
      </button>
      <button
        type="button"
        className="auth-switcher-button"
        aria-pressed={activeMode === 'login'}
        onClick={() => onModeChange?.('login')}
      >
        {t(labels.login)}
      </button>
    </nav>
  )
}
