"use client";

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Button } from './button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './dropdown-menu';

// Language options with their Google Translate language codes
const LANGUAGES = [
  { name: 'English', code: 'en' },
  { name: 'नेपाली', code: 'ne' },
  { name: 'हिन्दी', code: 'hi' },
  { name: '中文', code: 'zh-CN' },
  { name: '한국어', code: 'ko' },
  { name: 'Deutsch', code: 'de' },
  { name: 'Español', code: 'es' },
  { name: '日本語', code: 'ja' }
];

interface TranslateButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
  className?: string;
}

const TranslateButton = ({
  variant = 'ghost',
  size = 'icon',
  className = ''
}: TranslateButtonProps) => {
  const [currentLang, setCurrentLang] = useState('en');
  
  // Check current language on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Get current language from cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };
    
    const savedLang = getCookie('googtrans');
    if (savedLang) {
      const lang = savedLang.split('/').pop();
      if (lang) setCurrentLang(lang);
    }
  }, []);

  // Function to change the language
  const changeLanguage = (langCode: string) => {
    if (typeof window === 'undefined') return;
    setCurrentLang(langCode);
    
    const hostname = window.location.hostname;
    const domain = hostname.includes('.') ? hostname.split('.').slice(-2).join('.') : hostname;
    
    // Handle switching to English by clearing cookies
    if (langCode === 'en') {
      // Clear translation cookies
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname}`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname}`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
      
      // Reload page to reset translation state
      window.location.reload();
      return;
    }
    
    // Set cookies for non-English languages
    document.cookie = `googtrans=/auto/${langCode}; path=/; domain=.${hostname}`;
    document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${hostname}`;
    document.cookie = `googtrans=/auto/${langCode}; path=/`;
    
    // Approach 1: Using Google Translate's combo dropdown
    const selectField = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectField) {
      selectField.value = langCode;
      selectField.dispatchEvent(new Event('change'));
    }
    
    // Approach 2: Using Google Translate's banner frame
    try {
      const frame = document.querySelector('.goog-te-banner-frame') as HTMLIFrameElement;
      if (frame) {
        const frameDocument = frame.contentDocument || frame.contentWindow?.document;
        if (frameDocument) {
          const select = frameDocument.querySelector('.goog-te-combo') as HTMLSelectElement;
          if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event('change'));
          }
        }
      }
    } catch (e) {
      console.warn('Could not access iframe content', e);
    }
    
    // Approach 3: Direct API call (modern approach)
    if (window.google && window.google.translate) {
      try {
        const select = document.querySelector('select.goog-te-combo') as HTMLSelectElement;
        if (select) {
          select.value = langCode;
          const event = new Event('change', { bubbles: true });
          select.dispatchEvent(event);
        }
      } catch (e) {
        console.warn('Error changing language:', e);
      }
    }
    
    // Dispatch custom event to notify page change
    const event = new CustomEvent('nextjs:afterPageTransition');
    document.dispatchEvent(event);
    
    // Force reload if all else fails
    if (currentLang !== langCode) {
      setTimeout(() => {
        // Check if translation worked
        const translatedElements = document.querySelectorAll('.translated-ltr, .translated-rtl');
        if (translatedElements.length === 0) {
          // If nothing was translated, refresh to activate translation
          window.location.reload();
        }
      }, 1000);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} aria-label="Select language">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((language) => (
          <DropdownMenuItem 
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`cursor-pointer notranslate ${currentLang === language.code ? 'bg-muted' : ''}`}
          >
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TranslateButton;

// Add TypeScript type declaration for Google Translate 
declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: {
      translate: {
        TranslateElement: {
          new (options: any, element: string): any;
          InlineLayout: {
            SIMPLE: number;
          };
        };
      };
    };
  }
} 