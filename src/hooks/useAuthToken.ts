import { useAuth } from '@clerk/nextjs';
import { useState, useEffect, useRef, useCallback } from 'react';

export function useAuthToken() {
  const { getToken, userId, isLoaded, isSignedIn } = useAuth();
  const [authData, setAuthData] = useState<{
    token: string;
    tokenType: 'clerk' | 'jwt';
    userId: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const lastCheckRef = useRef<number>(0);
  const authCheckInProgress = useRef(false);
  const CACHE_DURATION = 30000; // 30 seconds cache

  const getAuthData = useCallback(async () => {
    // Prevent multiple concurrent auth checks
    if (authCheckInProgress.current) {
      console.log('useAuthToken - Auth check already in progress, skipping');
      return;
    }

    // Wait for Clerk to load before checking authentication
    if (!isLoaded) {
      console.log('useAuthToken - Clerk not loaded yet, waiting...');
      return;
    }

    authCheckInProgress.current = true;
    setIsLoading(true);

    try {
      console.log('useAuthToken - getAuthData called');
      console.log('useAuthToken - Clerk state:', { 
        userId, 
        isLoaded, 
        isSignedIn,
        hasUserId: !!userId 
      });

      // Check for Clerk authentication first
      if (isSignedIn && userId) {
        console.log('useAuthToken - User is signed in with Clerk, getting token...');
        try {
          const token = await getToken();
          console.log('useAuthToken - Clerk token received:', !!token);
          
          if (token) {
            const newAuthData = {
              token,
              tokenType: 'clerk' as const,
              userId
            };
            console.log('useAuthToken - Setting Clerk auth data:', {
              tokenType: newAuthData.tokenType,
              userId: newAuthData.userId,
              hasToken: !!newAuthData.token
            });
            setAuthData(newAuthData);
            setIsLoading(false);
            lastCheckRef.current = Date.now(); // Update cache timestamp
            return;
          } else {
            console.warn('useAuthToken - Clerk token is null despite being signed in');
          }
        } catch (error) {
          console.error('useAuthToken - Clerk token error:', error);
        }
      } else if (isLoaded && !isSignedIn) {
        console.log('useAuthToken - User not signed in with Clerk, checking JWT cookie');
      } else {
        console.log('useAuthToken - Clerk state not ready:', { isLoaded, isSignedIn, userId });
      }

      // Only check JWT if Clerk auth fails or user is not signed in with Clerk
      if (isLoaded && (!isSignedIn || !userId)) {
        console.log('useAuthToken - Checking JWT via API...');

        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include' // Include cookies
          });

          console.log('useAuthToken - JWT API response status:', response.status);

          if (response.ok) {
            const authInfo = await response.json();
            console.log('useAuthToken - JWT API response data:', authInfo);

            if (authInfo.authenticated && authInfo.userType === 'homestay') {
              console.log('useAuthToken - Setting homestay auth data from API');

              const newAuthData = {
                token: 'jwt-from-cookie', // Indicates server should read from cookie
                tokenType: 'jwt' as const,
                userId: authInfo.userId as string
              };
              setAuthData(newAuthData);
              setIsLoading(false);
              lastCheckRef.current = Date.now(); // Update cache timestamp
              return;
            } else {
              console.log('useAuthToken - JWT API response not authenticated or not homestay');
            }
          } else {
            console.log('useAuthToken - JWT API response not ok:', response.status);
          }
        } catch (error) {
          console.error('useAuthToken - JWT Auth API error:', error);
        }
      }

      // No valid auth found; clear state
      console.log('useAuthToken - No valid authentication found, clearing auth data');
      setAuthData(null);
      setIsLoading(false);
      lastCheckRef.current = Date.now(); // Update cache timestamp even for null result

    } finally {
      authCheckInProgress.current = false;
    }
  }, [userId, getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    // Don't run if Clerk is not loaded yet
    if (!isLoaded) {
      console.log('useAuthToken - Waiting for Clerk to load...');
      return;
    }

    // Throttle auth checks but allow immediate check after sign in/out events
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckRef.current;
    
    // Always check immediately if we don't have auth data or if auth state might have changed
    if (!authData || timeSinceLastCheck > CACHE_DURATION || !lastCheckRef.current) {
      console.log('useAuthToken - Triggering auth check:', {
        hasAuthData: !!authData,
        timeSinceLastCheck,
        isInitialCheck: !lastCheckRef.current
      });
      getAuthData();
    } else {
      console.log('useAuthToken - Using cached auth data:', {
        timeSinceLastCheck,
        cacheDuration: CACHE_DURATION
      });
      setIsLoading(false);
    }
  }, [isLoaded, userId, isSignedIn, getAuthData]);

  // Add effect to handle sign-out events
  useEffect(() => {
    if (isLoaded && !isSignedIn && authData?.tokenType === 'clerk') {
      console.log('useAuthToken - User signed out, clearing Clerk auth data');
      setAuthData(null);
      lastCheckRef.current = 0; // Reset cache
    }
  }, [isLoaded, isSignedIn, authData?.tokenType]);

  console.log('useAuthToken - Current state:', {
    authData: !!authData,
    authDataType: authData?.tokenType,
    authDataUserId: authData?.userId,
    isLoading,
    clerkIsLoaded: isLoaded,
    clerkIsSignedIn: isSignedIn,
    clerkUserId: userId
  });

  return authData;
}