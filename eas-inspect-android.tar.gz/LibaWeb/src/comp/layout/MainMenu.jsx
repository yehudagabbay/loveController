import { useLanguage } from '../../localization/languageStore'
import './MainMenu.css'

const defaultItems = ['games', 'research', 'profile', 'settings']

export default function MainMenu({
  activeItem = 'games',
  items = defaultItems,
  onNavigate,
  onLogout,
}) {
  const { t } = useLanguage()

  return (
    <nav className="main-menu" aria-label={t('menu.main.aria')}>
      <div className="main-menu-brand">{t('common.brand')}</div>

      <div className="main-menu-items">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            className="main-menu-button"
            aria-current={activeItem === item ? 'page' : undefined}
            onClick={() => onNavigate?.(item)}
          >
            {t(`menu.main.${item}`)}
          </button>
        ))}

        <button
          type="button"
          className="main-menu-button main-menu-logout"
          onClick={onLogout}
        >
          {t('menu.main.logout')}
        </button>
      </div>
    </nav>
  )
}
