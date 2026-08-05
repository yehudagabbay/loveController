// src/localization/LanguageContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import i18n from './i18n';

const LANG_KEY = 'app_lang';

const LanguageContext = createContext({
  lang: 'en',
  setLang: async (_newLang) => {},
  ready: false,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(LANG_KEY);
        const initial = saved || 'en';

        i18n.locale = initial;

        if (mounted) setLangState(initial);
      } catch {
        i18n.locale = 'en';
        if (mounted) setLangState('en');
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // ✅ שינוי מיידי: מעדכן state + i18n.locale באותו רגע
  const setLang = async (newLang) => {
    i18n.locale = newLang;
    setLangState(newLang);

    try {
      await SecureStore.setItemAsync(LANG_KEY, newLang);
    } catch {}
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, ready }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
