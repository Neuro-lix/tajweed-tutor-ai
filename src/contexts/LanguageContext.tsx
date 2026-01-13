import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageCode, TranslationKeys, getTranslations, getLanguageDirection, LANGUAGE_LIST } from '@/i18n/translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationKeys;
  dir: 'ltr' | 'rtl';
  languages: typeof LANGUAGE_LIST;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('app-language');
    if (saved && LANGUAGE_LIST.some(l => l.code === saved)) {
      return saved as LanguageCode;
    }
    // Detect browser language
    const browserLang = navigator.language.split('-')[0];
    if (LANGUAGE_LIST.some(l => l.code === browserLang)) {
      return browserLang as LanguageCode;
    }
    return 'fr';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = getTranslations(language);
  const dir = getLanguageDirection(language);

  // Update document direction
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, languages: LANGUAGE_LIST }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
