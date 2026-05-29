// components/GoogleTranslateWrapper.tsx
import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

export const GoogleTranslateWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,hi',
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
    };

    if (!document.querySelector('#google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    const timer = setTimeout(() => {
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (selectElement) {
        selectElement.value = language === 'Hindi' ? 'hi' : 'en';
        selectElement.dispatchEvent(new Event('change'));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [language]);

  return (
    <>
      <div id="google_translate_element" style={{ display: 'none' }}></div>
      {children}
    </>
  );
};