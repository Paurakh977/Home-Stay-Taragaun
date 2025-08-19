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
      // Check for Clerk authentication first
      if (userId) {
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
      }

      // Check for JWT cookie (homestay users)
      const authToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      if (authToken) {
        try {
          const base64Url = authToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          if (payload.homestayId) {
            setAuthData({
              token: authToken,
              tokenType: 'jwt',
              userId: payload.homestayId
            });
            return;
          }
        } catch (error) {
          console.error('JWT decode error:', error);
        }
      }

      // No valid auth found; clear state
      setAuthData(null);
    };

    getAuthData();
  }, [userId, getToken]);

  return authData;
}