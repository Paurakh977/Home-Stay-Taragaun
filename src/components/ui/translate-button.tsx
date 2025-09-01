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
    
    // Get all possible domain variations with better production handling
    let domains = [hostname];
    if (!isLocalhost && hostname.includes('.')) {
      // For production domains like devhomestay.sthaniyataha.com
      const parts = hostname.split('.');
      
      // Add the full domain with dot prefix
      domains.push('.' + hostname);
      
      // Add parent domains (sthaniyataha.com, .sthaniyataha.com)
      if (parts.length >= 2) {
        const parentDomain = parts.slice(-2).join('.');
        domains.push(parentDomain);
        domains.push('.' + parentDomain);
      }
      
      // Add all possible subdomain combinations
      for (let i = 0; i < parts.length - 1; i++) {
        const subdomain = parts.slice(i).join('.');
        domains.push(subdomain);
        domains.push('.' + subdomain);
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
      // Clear without domain specification first
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      
      // Clear with domain specifications for all possible domains and paths
      domains.forEach(domain => {
        paths.forEach(path => {
          // Standard cookie clear
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`;
          
          // Secure cookie clear
          if (isSecure) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; secure`;
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
    
    // Remove translation attributes from document
    document.documentElement.removeAttribute('style');
    document.documentElement.removeAttribute('lang');
    document.documentElement.removeAttribute('translate');
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
      if (langCode === 'en') {
        // Special case for English - clear cookies first
        clearAllTranslateCookies();
        
        // Force clear googtrans cookie with all possible domain variations
        const hostname = window.location.hostname;
        const isSecure = window.location.protocol === 'https:';
        
        // Clear googtrans cookie more aggressively for production
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname}`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname}`;
        
        // For production domain handling
        if (hostname.includes('.')) {
          const parts = hostname.split('.');
          if (parts.length >= 2) {
            const parentDomain = parts.slice(-2).join('.');
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${parentDomain}`;
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${parentDomain}`;
          }
        }
        
        if (isSecure) {
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname}; secure`;
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname}; secure`;
        }
      } else {
        // Set cookies for non-English languages with better domain handling
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const isSecure = window.location.protocol === 'https:';
        
        // Set the translation cookie on multiple domain variations
        document.cookie = `googtrans=/auto/${langCode}; path=/`;
        
        if (!isLocalhost) {
          document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${hostname}${isSecure ? '; secure' : ''}`;
          document.cookie = `googtrans=/auto/${langCode}; path=/; domain=.${hostname}${isSecure ? '; secure' : ''}`;
          
          // For production domains, also set on parent domain
          if (hostname.includes('.')) {
            const parts = hostname.split('.');
            if (parts.length >= 2) {
              const parentDomain = parts.slice(-2).join('.');
              document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${parentDomain}${isSecure ? '; secure' : ''}`;
              document.cookie = `googtrans=/auto/${langCode}; path=/; domain=.${parentDomain}${isSecure ? '; secure' : ''}`;
            }
          }
        }
      }
      
      // Force reload with a timestamp to prevent caching
      const url = new URL(window.location.href);
      
      // Clear any existing lang and t parameters
      url.searchParams.delete('lang');
      url.searchParams.delete('t');
      
      // Add new parameters
      url.searchParams.set('lang', langCode);
      url.searchParams.set('t', Date.now().toString());
      
      // Need to remove hash for the reload to work reliably
      url.hash = '';
      
      // Use replace instead of assign to avoid adding to browser history
      window.location.replace(url.toString());
    };
    
    // Always use direct reload approach which is more reliable in all environments
    directReload();
    return;
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