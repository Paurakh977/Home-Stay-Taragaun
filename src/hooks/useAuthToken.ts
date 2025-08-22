import { useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

export function useAuthToken() {
  const { getToken, userId } = useAuth();
  const [authData, setAuthData] = useState<{
    token: string;
    tokenType: 'clerk' | 'jwt';
    userId: string;
  } | null>(null);

  useEffect(() => {
    const getAuthData = async () => {
      console.log('useAuthToken - getAuthData called');
      console.log('useAuthToken - Clerk userId:', userId);
      console.log('useAuthToken - All cookies:', document.cookie);

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
      console.log('useAuthToken - Current document.cookie:', document.cookie);
      console.log('useAuthToken - Looking for auth_token cookie...');

      // Check if auth_token cookie exists in document.cookie
      const hasAuthTokenCookie = document.cookie.includes('auth_token=');
      console.log('useAuthToken - auth_token cookie exists:', hasAuthTokenCookie);

      // Check localStorage for user data
      const userJson = localStorage.getItem("user");
      console.log('useAuthToken - localStorage user data:', userJson ? 'exists' : 'missing');
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          console.log('useAuthToken - localStorage user:', userData.homestayId);
        } catch (e) {
          console.log('useAuthToken - localStorage user data invalid');
        }
      }

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
    };

    getAuthData();
  }, [userId, getToken]);

  return authData;
}