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
  
  // Add listener to fix translation issues on route changes
  useEffect(() => {
    if (!initialized) return;
    
    // Function to restore translation state after route changes
    const restoreTranslation = () => {
      // Get the current language from cookie
      const match = document.cookie.match(/googtrans=\/auto\/([^;]+)/);
      if (match && match[1] && match[1] !== 'en') {
        const langCode = match[1];
        
        // Try to restore translation
        setTimeout(() => {
          const selectField = document.querySelector('.goog-te-combo') as HTMLSelectElement;
          if (selectField && selectField.value !== langCode) {
            selectField.value = langCode;
            selectField.dispatchEvent(new Event('change'));
          }
        }, 500);
      }
    };
    
    // Listen for route changes in Next.js
    document.addEventListener('nextjs:afterPageTransition', restoreTranslation);
    
    return () => {
      document.removeEventListener('nextjs:afterPageTransition', restoreTranslation);
    };
  }, [initialized]);
  
  return (
    <>
      {children}
      <div id="google_translate_element" className="hidden" />
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