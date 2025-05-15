"use client";

import { useState } from 'react';
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

  // Function to change the language
  const changeLanguage = (langCode: string) => {
    if (typeof window === 'undefined') return;
    setCurrentLang(langCode);
    
    // Try different approaches to change the language
    
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
    
    // Approach 4: Using the cookie
    document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=/auto/${langCode}; path=/;`;
    
    // Force reload if all else fails
    if (langCode !== 'en' && currentLang !== langCode) {
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
            className={`cursor-pointer ${currentLang === language.code ? 'bg-muted' : ''}`}
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