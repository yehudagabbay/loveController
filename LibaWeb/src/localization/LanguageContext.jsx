import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  getLanguageDirection,
  isSupportedLanguage,
  languageOptions,
  translate,
} from './i18n'
import { LanguageContext } from './languageStore'

function getInitialLanguage() {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE
  }

  const savedLang = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (isSupportedLanguage(savedLang)) {
    return savedLang
  }

  const browserLang = window.navigator.language?.slice(0, 2)
  if (isSupportedLanguage(browserLang)) {
    return browserLang
  }

  return DEFAULT_LANGUAGE
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLanguage)
  const dir = getLanguageDirection(lang)

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [dir, lang])

  const setLang = (newLang) => {
    if (!isSupportedLanguage(newLang)) {
      return
    }

    setLangState(newLang)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang)
    }
  }

  const value = useMemo(
    () => ({
      lang,
      dir,
      ready: true,
      languages: languageOptions,
      setLang,
      t: (key, params) => translate(lang, key, params),
    }),
    [dir, lang],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
