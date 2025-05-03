'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { IWebContent } from '@/lib/models';
import { updateImageCacheBuster } from '@/lib/imageUtils';

// Define the type of the context value
interface WebContentContextValue {
  content: IWebContent | null;
  loading: boolean;
  error: string | null;
  refreshContent: () => Promise<void>;
}

// Create the context with a default value
const WebContentContext = createContext<WebContentContextValue>({
  content: null,
  loading: true,
  error: null,
  refreshContent: async () => {}
});

// Create a hook for using this context
export const useWebContent = () => useContext(WebContentContext);

/**
 * Deep compare two objects to determine if they are equivalent
 */
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (obj1 === null || obj2 === null) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

// Context provider component
export function WebContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<IWebContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<IWebContent | null>(null);
  const fetchingRef = useRef<boolean>(false);
  const params = useParams();
  
  // Extract adminUsername if present, otherwise use 'main' for public site
  const adminUsername = params?.adminUsername as string || 'main';

  // Function to fetch content, memoized to avoid recreating on every render
  const fetchContent = useCallback(async (force: boolean = false) => {
    // Prevent concurrent fetches
    if (fetchingRef.current && !force) {
      console.log('🔄 Fetch already in progress, skipping...');
      return;
    }
    
    fetchingRef.current = true;
    
    try {
      if (!content) setLoading(true);
      
      // Use Date.now() to bust cache
      const timestamp = Date.now();
      const cacheParam = `t=${timestamp}`;
      const response = await fetch(`/api/web-content?adminUsername=${adminUsername}&${cacheParam}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Use deep equality check to avoid unnecessary updates
      if (!deepEqual(data, contentRef.current)) {
        console.log('🔄 Content updated, refreshing state...');
        setContent(data);
        contentRef.current = data;
        
        // Only update image cache buster when content has actually changed
        updateImageCacheBuster();
      } else {
        console.log('🔄 Content unchanged, no update needed');
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching web content:', err);
      setError(`Failed to load website content: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [adminUsername, content]);

  // Function to refresh content on demand (e.g., after updates)
  const refreshContent = useCallback(async () => {
    console.log('🔄 Manual content refresh triggered');
    updateImageCacheBuster();  // Update first to ensure new images load
    await fetchContent(true);  // Force refresh
  }, [fetchContent]);

  // Initial load only - no automatic refreshing
  useEffect(() => {
    fetchContent();
    
    // Clean up function
    return () => {
      fetchingRef.current = false;
    };
  }, [fetchContent, adminUsername]);

  return (
    <WebContentContext.Provider value={{ content, loading, error, refreshContent }}>
      {children}
    </WebContentContext.Provider>
  );
}

export default WebContentProvider; 