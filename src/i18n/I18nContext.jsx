import { createContext, useContext, useState, useEffect } from 'react';
import data from './translations.json';

const I18nContext = createContext(null);

const STORAGE_KEY = 'showmine_lang';

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = data.languages[lang]?.dir || 'ltr';
  }, [lang]);

  const setLang = (newLang) => {
    if (!data.languages[newLang]) return;
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  };

  const t = (key) => {
    const entry = data.translations[key];
    if (!entry) return key;
    return entry[lang] || entry['en'] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, languages: data.languages }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
