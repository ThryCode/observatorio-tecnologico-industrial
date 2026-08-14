import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { es, en, type TranslationKey } from '@/i18n/translations';

type Language = 'es' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const STORAGE_KEY = 'ot-language';

const LanguageContext = createContext<LanguageState | undefined>(undefined);

const dictionaries: Record<Language, Record<TranslationKey, string>> = { es, en };

function getInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'es' || stored === 'en') return stored;
  return 'es';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const updateLanguage = (next: Language) => {
    setLanguage(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const t = (key: TranslationKey): string => dictionaries[language][key];

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageState {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}