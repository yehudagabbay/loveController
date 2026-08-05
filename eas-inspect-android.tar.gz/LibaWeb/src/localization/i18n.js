import ar from './ar.json'
import en from './en.json'
import es from './es.json'
import fr from './fr.json'
import he from './he.json'
import ru from './ru.json'
import zh from './zh.json'

export const DEFAULT_LANGUAGE = 'he'
export const LANGUAGE_STORAGE_KEY = 'liba_web_lang'

export const translations = {
  ar,
  en,
  es,
  fr,
  he,
  ru,
  zh,
}

export const languageOptions = [
  { code: 'he', shortLabel: 'HE', flagClass: 'flag-he' },
  { code: 'en', shortLabel: 'EN', flagClass: 'flag-en' },
  { code: 'fr', shortLabel: 'FR', flagClass: 'flag-fr' },
  { code: 'ru', shortLabel: 'RU', flagClass: 'flag-ru' },
  { code: 'ar', shortLabel: 'AR', flagClass: 'flag-ar' },
  { code: 'es', shortLabel: 'ES', flagClass: 'flag-es' },
  { code: 'zh', shortLabel: 'ZH', flagClass: 'flag-zh' },
]

export function isSupportedLanguage(lang) {
  return Boolean(translations[lang])
}

export function getLanguageDirection(lang) {
  return translations[lang]?.meta?.dir || 'ltr'
}

function getNestedValue(source, path) {
  return path.split('.').reduce((current, part) => current?.[part], source)
}

function formatValue(value, params = {}) {
  if (typeof value !== 'string') {
    return value
  }

  return value.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] === undefined ? match : String(params[key])
  })
}

export function translate(lang, key, params) {
  const activeLang = isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE
  const value =
    getNestedValue(translations[activeLang], key) ??
    getNestedValue(translations[DEFAULT_LANGUAGE], key) ??
    getNestedValue(translations.en, key) ??
    key

  return formatValue(value, params)
}
