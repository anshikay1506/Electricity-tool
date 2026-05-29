// src/components/LanguageSwitcher.tsx
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'English' ? 'Hindi' : 'English')}
      style={{
        padding: '8px 16px',
        cursor: 'pointer',
        border: '1px solid #ccc',
        borderRadius: '4px',
        background: '#f0f0f0',
      }}
    >
      {language === 'English' ? 'हिंदी' : 'English'}
    </button>
  );
};