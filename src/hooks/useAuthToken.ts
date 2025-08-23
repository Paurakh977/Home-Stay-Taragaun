import { useAuth } from '@clerk/nextjs';
import { useState, useEffect, useRef } from 'react';

export function useAuthToken() {
  const { getToken, userId } = useAuth();
  const [authData, setAuthData] = useState<{
    token: string;
    tokenType: 'clerk' | 'jwt';
    userId: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const lastCheckRef = useRef<number>(0);
  const CACHE_DURATION = 30000; // 30 seconds cache

  useEffect(() => {
    const getAuthData = async () => {
      setIsLoading(true);

      // Throttle API calls to prevent excessive requests
      const now = Date.now();
      if (now - lastCheckRef.current < CACHE_DURATION && authData) {
        setIsLoading(false);
        return;
      }
      lastCheckRef.current = now;

      console.log('useAuthToken - getAuthData called');
      console.log('useAuthToken - Clerk userId:', userId);

      // Check for Clerk authentication first
      if (userId) {
        console.log('useAuthToken - Found Clerk userId, getting token...');
        try {
          const token = await getToken();
          if (token) {
            setAuthData({
              token,
              tokenType: 'clerk',
              userId
            });
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Clerk token error:', error);
        }
      } else {
        console.log('useAuthToken - No Clerk userId, checking JWT cookie');
      }

      // Check for JWT authentication via API (homestay users)
      console.log('useAuthToken - Checking JWT via API...');

      // Note: auth_token cookie is HttpOnly, so we can't check it client-side
      // We need to make the API call to verify authentication
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include' // Include cookies
        });

        console.log('useAuthToken - API response status:', response.status);

        if (response.ok) {
          const authInfo = await response.json();
          console.log('useAuthToken - API response data:', authInfo);

          if (authInfo.authenticated && authInfo.userType === 'homestay') {
            console.log('useAuthToken - Setting homestay auth data from API:', {
              tokenType: 'jwt',
              userId: authInfo.userId
            });

            const newAuthData = {
              token: 'jwt-from-cookie', // Indicates server should read from cookie
              tokenType: 'jwt' as const,
              userId: authInfo.userId as string
            };
            console.log('useAuthToken - About to set auth data:', newAuthData);
            setAuthData(newAuthData);
            console.log('useAuthToken - Auth data set successfully');
            setIsLoading(false);
            return;
          } else {
            console.log('useAuthToken - API response not authenticated or not homestay');
          }
        } else {
          console.log('useAuthToken - API response not ok:', response.status);
        }
      } catch (error) {
        console.error('useAuthToken - Auth API error:', error);
      }

      // No valid auth found; clear state
      setAuthData(null);
      setIsLoading(false);
    };

    getAuthData();
  }, [userId, getToken]);

  return authData;
}