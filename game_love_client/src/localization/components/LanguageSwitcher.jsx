import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

import i18n from '../i18n';
import { useLanguage } from '../LanguageContext';

const LANGUAGE_FLAGS = {
  he: '🇮🇱',
  en: '🇺🇸',
  ar: '🇸🇦',
  ru: '🇷🇺',
  es: '🇪🇸',
  zh: '🇨🇳',
  fr: '🇫🇷',
  de: '🇩🇪',
};

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const languages = useMemo(
    () => [
      { code: 'he', label: i18n.t('menu.languages.he'), flag: LANGUAGE_FLAGS.he },
      { code: 'en', label: i18n.t('menu.languages.en'), flag: LANGUAGE_FLAGS.en },
      { code: 'ar', label: i18n.t('menu.languages.ar'), flag: LANGUAGE_FLAGS.ar },
      { code: 'ru', label: i18n.t('menu.languages.ru'), flag: LANGUAGE_FLAGS.ru },
      { code: 'es', label: i18n.t('menu.languages.es'), flag: LANGUAGE_FLAGS.es },
      { code: 'zh', label: i18n.t('menu.languages.zh'), flag: LANGUAGE_FLAGS.zh },
      { code: 'fr', label: i18n.t('menu.languages.fr'), flag: LANGUAGE_FLAGS.fr },
      { code: 'de', label: i18n.t('menu.languages.de'), flag: LANGUAGE_FLAGS.de },
    ],
    [lang],
  );

  const currentLang = languages.find((item) => item.code === lang) || languages[1];

  const selectLang = (code) => {
    setLang(code);
    setExpanded(false);
  };

  return (
    <View style={styles.wrapper}>
      {expanded && (
        <View style={styles.menu}>
          {languages.map((item) => (
            <TouchableOpacity
              key={item.code}
              style={styles.menuItem}
              onPress={() => selectLang(item.code)}
            >
              <Text style={styles.flagText}>{item.flag}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.mainBtn}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <Text style={styles.mainFlag}>{currentLang.flag}</Text>
        <Text style={styles.arrow}>{expanded ? '▴' : '▾'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-start',
  },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  mainFlag: { fontSize: 18 },
  arrow: { color: '#fff', marginLeft: 4, fontSize: 12 },
  menu: {
    backgroundColor: 'rgba(30, 30, 50, 0.95)',
    borderRadius: 15,
    padding: 8,
    marginBottom: 8,
    width: 130,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  flagText: { fontSize: 16, marginRight: 8 },
  menuLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
