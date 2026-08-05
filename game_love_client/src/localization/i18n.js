// src/localization/i18n.js
import i18n from 'i18n-js';

import en from './en.json';
import he from './he.json';
import es from './es.json'; 
import ru from './ru.json'; 
import ar from './ar.json'; 
import zh from './zh.json';
import fr from './fr.json';
import de from './de.json';


i18n.translations = { en, he, es, ru, ar, zh, fr, de };
i18n.defaultLocale = 'en';
i18n.locale = 'en';
i18n.fallbacks = true;

export default i18n;
