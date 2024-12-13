'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Language, defaultLanguage } from './types';
import { loadTranslations } from './translations';

interface TranslationsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const TranslationsContext = createContext<TranslationsContextType | undefined>(undefined);

export function TranslationsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    // Get initial language from localStorage or browser
    const savedLanguage = localStorage.getItem('language') as Language;
    const browserLanguage = navigator.language.split('-')[0] as Language;
    const initialLanguage = savedLanguage || browserLanguage || defaultLanguage;
    setLanguage(initialLanguage);
  }, []);

  useEffect(() => {
    const loadAndSetTranslations = async () => {
      const newTranslations = await loadTranslations(language);
      setTranslations(newTranslations);
      localStorage.setItem('language', language);
      document.documentElement.lang = language;
    };

    loadAndSetTranslations();
  }, [language]);

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <TranslationsContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationsContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(TranslationsContext);
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationsProvider');
  }
  return context;
} 