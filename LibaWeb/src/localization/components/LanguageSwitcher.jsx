import { useState } from 'react'
import { useLanguage } from '../languageStore'
import './LanguageSwitcher.css'

export default function LanguageSwitcher() {
  const { lang, languages, setLang, t } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const currentLanguage = languages.find((item) => item.code === lang) || languages[0]

  const selectLanguage = (code) => {
    setLang(code)
    setExpanded(false)
  }

  return (
    <div className="language-switcher">
      <button
        type="button"
        className="language-switcher-main"
        aria-label={t('menu.languageAria')}
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        <span
          className={`language-switcher-flag ${currentLanguage.flagClass}`}
          aria-hidden="true"
        />
        <span className="language-switcher-code">{currentLanguage.shortLabel}</span>
        <span className="language-switcher-label">{t('menu.language')}</span>
      </button>

      {expanded ? (
        <div className="language-switcher-menu" role="listbox">
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              className="language-switcher-item"
              aria-selected={item.code === lang}
              role="option"
              onClick={() => selectLanguage(item.code)}
            >
              <span className={`language-switcher-flag ${item.flagClass}`} aria-hidden="true" />
              <span>{item.shortLabel}</span>
              <span>{t(`menu.languages.${item.code}`)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
