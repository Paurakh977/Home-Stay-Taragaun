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
  const [isSwitching, setIsSwitching] = useState(false);
  
  // Check current language on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Get current language from cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    
    const savedLang = getCookie('googtrans');
    if (savedLang) {
      const lang = savedLang.split('/').pop();
      if (lang) setCurrentLang(lang);
    }
  }, []);

  // Function to clear all Google Translate cookies
  const clearAllTranslateCookies = () => {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isSecure = window.location.protocol === 'https:';
    
    // Get all possible domain variations
    let domains = [hostname];
    if (!isLocalhost && hostname.includes('.')) {
      // Add domain and all its parents
      const parts = hostname.split('.');
      for (let i = 0; i < parts.length - 1; i++) {
        domains.push(parts.slice(i).join('.'));
      }
    }

    // Common paths in the application
    const paths = [
      '/', 
      '/homepage', 
      '/about', 
      '/contact', 
      '/login', 
      '/register',
      '/dashboard',
      window.location.pathname
    ];

    // Google Translate cookies
    const cookies = ['googtrans', 'googtransopt', '_ga', '_gid', 'NID'];

    // Clear all cookies across all domains and paths
    cookies.forEach(cookieName => {
      // Clear without domain specification
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      
      // Clear with domain specifications for all possible domains and paths
      domains.forEach(domain => {
        paths.forEach(path => {
          // Standard cookie clear
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=.${domain}`;
          
          // Secure cookie clear
          if (isSecure) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; secure`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=.${domain}; secure`;
          }
        });
      });
    });
    
    // Remove Google Translate elements from DOM
    const elements = [
      '.goog-te-banner-frame',
      '.goog-te-menu-frame',
      '.goog-te-menu-value',
      '.goog-te-gadget',
      '.goog-te-combo'
    ];
    
    elements.forEach(selector => {
      const element = document.querySelector(selector);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    // Clear any translation classes
    document.body.classList.remove('translated-ltr', 'translated-rtl');
  };

  // Function to change the language
  const changeLanguage = (langCode: string) => {
    if (typeof window === 'undefined') return;
    
    // Don't do anything if language is already set to the requested language
    if (currentLang === langCode) return;
    
    // Prevent multiple clicks
    if (isSwitching) return;
    setIsSwitching(true);
    
    // Always set the current language state
    setCurrentLang(langCode);
    
    // Determine environment details
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isSecure = window.location.protocol === 'https:';
    
    // Direct reload approach for ALL languages (most reliable)
    const directReload = () => {
      // First, clear all translation cookies
      if (langCode === 'en') {
        clearAllTranslateCookies();
      } else {
        // Set cookies for non-English languages
        const domains = [hostname];
        if (!isLocalhost && hostname.includes('.')) {
          const parts = hostname.split('.');
          for (let i = 0; i < parts.length - 1; i++) {
            domains.push(parts.slice(i).join('.'));
          }
        }
        
        // Set the translation cookie on all domains
        domains.forEach(domain => {
          if (!isLocalhost) {
            document.cookie = `googtrans=/auto/${langCode}; path=/; domain=.${domain}${isSecure ? '; secure' : ''}`;
            document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${domain}${isSecure ? '; secure' : ''}`;
          }
        });
        document.cookie = `googtrans=/auto/${langCode}; path=/`;
      }
      
      // Force reload with a timestamp to prevent caching
      const url = new URL(window.location.href);
      url.searchParams.set('lang', langCode);
      url.searchParams.set('t', Date.now().toString());
      
      // Need to remove hash for the reload to work reliably
      url.hash = '';
      
      // Use replace instead of assign to avoid adding to browser history
      window.location.replace(url.toString());
    };
    
    // For production environments or when switching to English, 
    // always use direct reload approach which is more reliable
    if (!isLocalhost || langCode === 'en') {
      directReload();
      return;
    }
    
    // For local development, try to use the UI approach first for non-English languages
    let translationAttempted = false;
    
    // Method 1: Using Google Translate's combo dropdown
    const selectField = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectField) {
      try {
        selectField.value = langCode;
        selectField.dispatchEvent(new Event('change', { bubbles: true }));
        selectField.dispatchEvent(new MouseEvent('change', { bubbles: true }));
        translationAttempted = true;
      } catch (e) {
        console.warn('Error using select field:', e);
      }
    }
    
    // Method 2: Using Google Translate's banner frame
    if (!translationAttempted) {
      try {
        const frame = document.querySelector('.goog-te-banner-frame') as HTMLIFrameElement;
        if (frame) {
          const frameDocument = frame.contentDocument || frame.contentWindow?.document;
          if (frameDocument) {
            const select = frameDocument.querySelector('.goog-te-combo') as HTMLSelectElement;
            if (select) {
              select.value = langCode;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              translationAttempted = true;
            }
          }
        }
      } catch (e) {
        console.warn('Could not access iframe content', e);
      }
    }
    
    // If translation wasn't attempted, use direct reload approach
    if (!translationAttempted) {
      directReload();
      return;
    }
    
    // Notify Next.js of the language change
    document.dispatchEvent(new CustomEvent('nextjs:afterPageTransition'));
    
    // Verify if translation was applied in local dev mode
    setTimeout(() => {
      const translatedElements = document.querySelectorAll('.translated-ltr, .translated-rtl');
      const isTranslated = translatedElements.length > 0;
      
      if (!isTranslated) {
        console.log('Translation not applied, trying direct reload method');
        directReload();
      } else {
        setIsSwitching(false);
      }
    }, 1500);
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
            className={`cursor-pointer notranslate ${
              currentLang === language.code ? 'bg-muted' : ''
            } ${isSwitching ? 'opacity-70 pointer-events-none' : ''}`}
            disabled={isSwitching}
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
    googleTranslateElementInit?: () => void;
    google: {
      translate: {
        TranslateElement: {
          new (options: any, element: string): any;
          InlineLayout?: {
            SIMPLE: number;
          };
        };
      };
    };
  }
} 