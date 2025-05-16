"use client";

import { useEffect, useState } from 'react';

export function TranslateProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  // First, add the Google Translate script to the page
  useEffect(() => {
    if (typeof window === 'undefined' || scriptLoaded) return;
    
    // Check if script is already added
    const existingScript = document.querySelector('script[src*="translate_a/element.js"]');
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    document.body.appendChild(script);
  }, [scriptLoaded]);
  
  // Then, initialize Google Translate when script is loaded
  useEffect(() => {
    if (typeof window === 'undefined' || !scriptLoaded || initialized) return;
    
    // Function to initialize Google Translate
    const initGoogleTranslate = () => {
      // If the function has been called already
      if (document.querySelector('.goog-te-combo') || document.querySelector('.goog-te-gadget')) {
        console.log('Google Translate already initialized');
        setInitialized(true);
        return;
      }
      
      // Create hidden div for Google Translate if it doesn't exist
      if (!document.getElementById('google_translate_element')) {
        const div = document.createElement('div');
        div.id = 'google_translate_element';
        div.className = 'notranslate';
        div.style.display = 'none';
        document.body.appendChild(div);
      }
      
      if (window.google && window.google.translate) {
        try {
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,ne,hi,zh-CN,ko,de,es,ja',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
            gaTrack: false
          }, 'google_translate_element');
          setInitialized(true);
          console.log('Google Translate initialized');
          
          // Add class to prevent Google from translating its own UI
          document.querySelectorAll('.goog-te-menu-value span').forEach(el => {
            el.classList.add('notranslate');
          });
          
          // Fix: reset translation on next tick to ensure full page gets the proper translation
          setTimeout(() => {
            restoreTranslation();
          }, 500);
        } catch (error) {
          console.error('Failed to initialize Google Translate:', error);
        }
      } else {
        // If window.google.translate is not available yet, wait a bit
        console.log('Waiting for Google Translate API to load...');
        setTimeout(initGoogleTranslate, 500);
      }
    };
    
    // Initialize Google Translate
    window.googleTranslateElementInit = initGoogleTranslate;
    
    // Call init function if script has been loaded but not initialized
    if (window.google && window.google.translate && !initialized) {
      initGoogleTranslate();
    } else if (scriptLoaded && !window.googleTranslateElementInit) {
      // Set the global callback
      window.googleTranslateElementInit = initGoogleTranslate;
      // Try to call it directly after a small delay
      setTimeout(initGoogleTranslate, 500);
    }
    
    return () => {
      // Clean up
      delete window.googleTranslateElementInit;
    };
  }, [scriptLoaded, initialized]);
  
  // Function to restore translation state after route changes
  const restoreTranslation = () => {
    // Get the current language from cookie
    const getCookie = (name: string) => {
      const value = '; ' + document.cookie;
      const parts = value.split('; ' + name + '=');
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    
    const savedLang = getCookie('googtrans');
    if (savedLang) {
      const lang = savedLang.split('/').pop();
      if (lang && lang !== 'en') {
        setTimeout(() => {
          const selectField = document.querySelector('.goog-te-combo') as HTMLSelectElement;
          if (selectField && selectField.value !== lang) {
            selectField.value = lang;
            selectField.dispatchEvent(new Event('change'));
          }
        }, 500);
      }
    }
  };
  
  // Add listener to fix translation issues on route changes
  useEffect(() => {
    if (!initialized) return;
    
    // Listen for route changes in Next.js
    document.addEventListener('nextjs:afterPageTransition', restoreTranslation);
    
    // Add MutationObserver to detect page changes (which may not trigger route change events)
    const observer = new MutationObserver((mutations) => {
      // Check if we have significant DOM changes that might indicate a page change
      const significantChanges = mutations.some(mutation => 
        mutation.addedNodes.length > 3 || 
        (mutation.target instanceof HTMLElement && 
         (mutation.target.tagName === 'MAIN' || mutation.target.classList.contains('main-content')))
      );
      
      if (significantChanges) {
        restoreTranslation();
      }
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      document.removeEventListener('nextjs:afterPageTransition', restoreTranslation);
      observer.disconnect();
    };
  }, [initialized]);
  
  return (
    <>
      {children}
      <div id="google_translate_element" className="hidden notranslate" />
    </>
  );
}

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
  interface Document {
    addEventListener(type: 'nextjs:afterPageTransition', listener: (event: Event) => void): void;
    removeEventListener(type: 'nextjs:afterPageTransition', listener: (event: Event) => void): void;
  }
} 