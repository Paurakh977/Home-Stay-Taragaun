"use client";

import { useEffect, useState } from 'react';

export function TranslateProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // First, add the Google Translate script to the page
  useEffect(() => {
    if (typeof window === 'undefined' || scriptLoaded) return;
    
    // Check if script is already added
    const existingScript = document.querySelector('script[src*="translate_a/element.js"]');
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }
    
    // Create a meta tag for content language to ensure proper translation
    const metaContent = document.querySelector('meta[http-equiv="Content-Language"]');
    if (!metaContent) {
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', 'Content-Language');
      meta.setAttribute('content', 'en');
      document.head.appendChild(meta);
    }
    
    // Create a function to detect if an ad blocker might be preventing script load
    const checkForBlockers = () => {
      // If the script load takes too long, it might be blocked
      if (retryCount === 0) {
        setTimeout(() => {
          if (!scriptLoaded) {
            console.warn('Google Translate script may be blocked. Using alternative loading method...');
            // Try an alternative loading method with a different URL format
            const altScript = document.createElement('script');
            altScript.src = 'https://translate.googleapis.com/translate_a/element.js?cb=googleTranslateElementInit';
            altScript.async = true;
            altScript.onload = () => setScriptLoaded(true);
            document.body.appendChild(altScript);
          }
        }, 5000);
      }
    };
    
    // Attempt to load the script
    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = (error) => {
      console.error('Failed to load Google Translate script:', error);
      // Attempt to reload after a delay if under retry limit
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          // Remove failed script
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
          setScriptLoaded(false);
        }, 2000);
      }
    };
    document.body.appendChild(script);
    
    // Check for potential blockers
    checkForBlockers();
    
    // Cleanup
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [scriptLoaded, retryCount]);
  
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
      
      // Simple initialization to avoid CSP issues
      const simpleInit = () => {
        try {
          // Create a new element without using TranslateElement.InlineLayout
          if (window.google && window.google.translate && window.google.translate.TranslateElement) {
            new window.google.translate.TranslateElement({
              pageLanguage: 'en',
              includedLanguages: 'en,ne,hi,zh-CN,ko,de,es,ja',
              layout: 0, // Use direct value instead of InlineLayout.SIMPLE
              autoDisplay: false,
              gaTrack: false
            }, 'google_translate_element');
            
            setInitialized(true);
            console.log('Google Translate initialized with simple layout');
            
            setTimeout(() => {
              restoreTranslation();
            }, 500);
            
            return true;
          }
          return false;
        } catch (error) {
          console.warn('Simple init failed:', error);
          return false;
        }
      };
      
      // Try to initialize with full settings
      try {
        // Check if Google Translate is available and properly loaded
        if (window.google && window.google.translate && window.google.translate.TranslateElement) {
          try {
            // Try to access InlineLayout safely
            let inlineLayout = 0; // Default fallback
            
            try {
              // Access InlineLayout safely
              if (window.google.translate.TranslateElement.InlineLayout) {
                inlineLayout = window.google.translate.TranslateElement.InlineLayout.SIMPLE;
              }
            } catch (layoutError) {
              console.warn('Could not access InlineLayout, using fallback:', layoutError);
            }
              
            new window.google.translate.TranslateElement({
              pageLanguage: 'en',
              includedLanguages: 'en,ne,hi,zh-CN,ko,de,es,ja',
              layout: inlineLayout,
              autoDisplay: false,
              gaTrack: false
            }, 'google_translate_element');
            
            setInitialized(true);
            console.log('Google Translate initialized');
            
            // Add class to prevent Google from translating its own UI
            document.querySelectorAll('.goog-te-menu-value span').forEach(el => {
              el.classList.add('notranslate');
            });
            
            // Add notranslate class to React fragment containers
            // This helps prevent crashes when Google Translate modifies DOM nodes
            document.querySelectorAll('[data-reactroot]').forEach(el => {
              el.classList.add('notranslate');
            });
            
            // Fix: reset translation on next tick to ensure full page gets the proper translation
            setTimeout(() => {
              restoreTranslation();
            }, 500);
          } catch (error) {
            console.error('Failed to initialize Google Translate with InlineLayout:', error);
            
            // Fall back to simple initialization
            if (!simpleInit()) {
              // Retry after delay if API is not fully loaded yet
              if (retryCount < 5) {
                setTimeout(() => {
                  setRetryCount(prev => prev + 1);
                }, 1000);
              }
            }
          }
        } else {
          // If window.google.translate is not available yet, wait a bit
          console.log('Waiting for Google Translate API to load...');
          if (retryCount < 10) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000);
          } else {
            console.error('Failed to load Google Translate API after multiple attempts');
          }
        }
      } catch (error) {
        console.error('Error during Google Translate initialization:', error);
        
        // Try simple init as a last resort
        simpleInit();
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
      setTimeout(initGoogleTranslate, 1000);
    }
    
    return () => {
      // Clean up
      if (window.googleTranslateElementInit) {
        // Use assignment to undefined instead of delete
        window.googleTranslateElementInit = undefined;
      }
    };
  }, [scriptLoaded, initialized, retryCount]);
  
  // Function to restore translation state after route changes
  const restoreTranslation = () => {
    if (typeof window === 'undefined') return;
    
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
            // Use bubbling to ensure the event propagates
            selectField.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, 500);
      }
    }
  };
  
  // Add listener to fix translation issues on route changes
  useEffect(() => {
    if (!initialized || typeof window === 'undefined') return;
    
    // Listen for route changes in Next.js
    document.addEventListener('nextjs:afterPageTransition', restoreTranslation);
    
    // Fix for issues with React nodes being manipulated by Google Translate
    // This reduces the chance of crashes from text node replacement
    const addNoTranslateToTextNodes = () => {
      // Find React fragments and direct text nodes
      const walkDOM = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
          // If parent is a React fragment or doesn't have a tag name, wrap it
          const parent = node.parentElement;
          if (parent && (!parent.tagName || parent.tagName === 'REACT-FRAGMENT')) {
            // Create a span to replace the text node
            const span = document.createElement('span');
            span.className = 'notranslate';
            span.textContent = node.textContent;
            node.parentNode?.replaceChild(span, node);
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Process children
          node.childNodes.forEach(walkDOM);
        }
      };
      
      // Start from the body
      walkDOM(document.body);
    };
    
    // Run once on initialization
    addNoTranslateToTextNodes();
    
    // Add MutationObserver to detect page changes (which may not trigger route change events)
    const observer = new MutationObserver((mutations) => {
      // Check if we have significant DOM changes that might indicate a page change
      const significantChanges = mutations.some(mutation => 
        mutation.addedNodes.length > 3 || 
        (mutation.target instanceof HTMLElement && 
         (mutation.target.tagName === 'MAIN' || mutation.target.classList.contains('main-content')))
      );
      
      if (significantChanges) {
        addNoTranslateToTextNodes();
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
    googleTranslateElementInit?: () => void; // Optional to fix linter error
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
  interface Document {
    addEventListener(type: 'nextjs:afterPageTransition', listener: (event: Event) => void): void;
    removeEventListener(type: 'nextjs:afterPageTransition', listener: (event: Event) => void): void;
  }
} 