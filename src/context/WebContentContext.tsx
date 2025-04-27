'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { IWebContent } from '@/lib/models';

// Define the type of the context value
interface WebContentContextValue {
  content: IWebContent | null;
  loading: boolean;
  error: string | null;
}

// Create the context with a default value
const WebContentContext = createContext<WebContentContextValue>({
  content: null,
  loading: true,
  error: null
});

// Create a hook for using this context
export const useWebContent = () => useContext(WebContentContext);

// Context provider component
export function WebContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<IWebContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  
  // Extract adminUsername if present, otherwise use 'main' for public site
  const adminUsername = params?.adminUsername as string || 'main';

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        // Fetch content from API
        const response = await fetch(`/api/web-content?adminUsername=${adminUsername}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        
        const data = await response.json();
        setContent(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching web content:', err);
        setError('Failed to load website content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [adminUsername]);

  return (
    <WebContentContext.Provider value={{ content, loading, error }}>
      {children}
    </WebContentContext.Provider>
  );
}

export default WebContentProvider; 