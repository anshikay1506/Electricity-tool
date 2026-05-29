// context/LanguageContext.tsx
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Language = 'English' | 'Hindi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const STORAGE_KEY = 'goar_language';
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem(STORAGE_KEY) as Language) === 'Hindi' ? 'Hindi' : 'English';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === 'Hindi' ? 'hi' : 'en';
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    
    // Clear Google Translate cookies before reload
    if (lang === 'English') {
      // Clear the Google Translate cookie to reset translation
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
      
      // Also remove the language cookie that Google sets
      document.cookie = 'googtrans=/en/en; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    
    // Force page reload to apply translation
    window.location.reload();
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};