import { createContext, useContext } from 'react'
import { DEFAULT_LANGUAGE, getLanguageDirection, languageOptions } from './i18n'

export const LanguageContext = createContext({
  lang: DEFAULT_LANGUAGE,
  dir: getLanguageDirection(DEFAULT_LANGUAGE),
  ready: true,
  languages: languageOptions,
  setLang: () => {},
  t: (key) => key,
})

export function useLanguage() {
  return useContext(LanguageContext)
}
