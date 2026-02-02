import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type TranslationId = 'fr.hamidullah' | 'en.sahih' | 'en.yusufali';

export interface TranslationInfo {
  id: TranslationId;
  label: string;
  lang: string;
}

export const AVAILABLE_TRANSLATIONS: TranslationInfo[] = [
  { id: 'fr.hamidullah', label: 'FR Hamidullah', lang: 'fr' },
  { id: 'en.sahih', label: 'EN Sahih', lang: 'en' },
  { id: 'en.yusufali', label: 'EN Yusuf Ali', lang: 'en' },
];

interface TranslationContextValue {
  currentTranslationId: TranslationId;
  setCurrentTranslationId: (id: TranslationId) => void;
  showTranslation: boolean;
  setShowTranslation: (show: boolean) => void;
  availableTranslations: TranslationInfo[];
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTranslationId, setCurrentTranslationId] = useState<TranslationId>('fr.hamidullah');
  const [showTranslation, setShowTranslation] = useState(false);

  const value: TranslationContextValue = {
    currentTranslationId,
    setCurrentTranslationId: useCallback((id: TranslationId) => setCurrentTranslationId(id), []),
    showTranslation,
    setShowTranslation: useCallback((show: boolean) => setShowTranslation(show), []),
    availableTranslations: AVAILABLE_TRANSLATIONS,
  };

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
};

export const useTranslationSettings = () => {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('useTranslationSettings must be used inside TranslationProvider');
  return ctx;
};
