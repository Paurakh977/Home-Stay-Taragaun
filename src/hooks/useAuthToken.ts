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
  const authCheckQueue = useRef<Promise<void> | null>(null);
  const CACHE_DURATION = 120000; // 2 minutes cache - reduced frequency of checks
  const tokenRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getAuthData = useCallback(async (): Promise<void> => {
    // Use queuing system to prevent race conditions while allowing proper waiting
    if (authCheckInProgress.current) {
      console.log('useAuthToken - Auth check in progress, waiting for completion...');
      if (authCheckQueue.current) {
        await authCheckQueue.current;
      }
      return;
    }

    // Wait for Clerk to load before checking authentication
    if (!isLoaded) {
      console.log('useAuthToken - Clerk not loaded yet, waiting...');
      return;
    }

    authCheckInProgress.current = true;
    setIsLoading(true);

    const authCheckPromise = (async () => {
      try {
        console.log('useAuthToken - getAuthData called');
        console.log('useAuthToken - Clerk state:', { 
          userId, 
          isLoaded, 
          isSignedIn,
          hasUserId: !!userId 
        });

        let newAuthData: typeof authData = null;

        // Check for Clerk authentication first (prioritize active session)
        if (isSignedIn && userId) {
          console.log('useAuthToken - User is signed in with Clerk, getting token...');
          try {
            const token = await getToken();
            console.log('useAuthToken - Clerk token received:', !!token);
            
            if (token) {
              newAuthData = {
                token,
                tokenType: 'clerk' as const,
                userId
              };
              console.log('useAuthToken - Setting Clerk auth data:', {
                tokenType: newAuthData.tokenType,
                userId: newAuthData.userId,
                hasToken: !!newAuthData.token
              });
            } else {
              console.warn('useAuthToken - Clerk token is null despite being signed in');
            }
          } catch (error) {
            console.error('useAuthToken - Clerk token error:', error);
          }
        }

        // Only check JWT if Clerk auth is not available
        if (!newAuthData && isLoaded) {
          console.log('useAuthToken - Checking JWT via API...');

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch('/api/auth/me', {
              credentials: 'include',
              signal: controller.signal,
              headers: {
                'Cache-Control': 'no-cache'
              }
            });

            clearTimeout(timeoutId);
            console.log('useAuthToken - JWT API response status:', response.status);

            if (response.ok) {
              const authInfo = await response.json();
              console.log('useAuthToken - JWT API response data:', authInfo);

              if (authInfo.authenticated && authInfo.userType === 'homestay') {
                console.log('useAuthToken - Setting homestay auth data from API');

                newAuthData = {
                  token: 'jwt-from-cookie',
                  tokenType: 'jwt' as const,
                  userId: authInfo.userId as string
                };
              } else {
                console.log('useAuthToken - JWT API response not authenticated or not homestay');
              }
            } else {
              console.log('useAuthToken - JWT API response not ok:', response.status);
            }
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              console.error('useAuthToken - JWT Auth API timeout');
            } else {
              console.error('useAuthToken - JWT Auth API error:', error);
            }
          }
        }

        // Update state with new auth data (or null if no auth found)
        setAuthData(newAuthData);
        setIsLoading(false);
        lastCheckRef.current = Date.now();

        // Set up token refresh for JWT tokens
        if (newAuthData?.tokenType === 'jwt') {
          setupTokenRefresh();
        } else {
          clearTokenRefresh();
        }

        if (!newAuthData) {
          console.log('useAuthToken - No valid authentication found, clearing auth data');
        }

      } catch (error) {
        console.error('useAuthToken - Critical error in getAuthData:', error);
        setAuthData(null);
        setIsLoading(false);
        lastCheckRef.current = Date.now();
      }
    })();

    authCheckQueue.current = authCheckPromise;
    
    try {
      await authCheckPromise;
    } finally {
      authCheckInProgress.current = false;
      authCheckQueue.current = null;
    }
  }, [userId, getToken, isLoaded, isSignedIn]);

  // Token refresh setup for JWT tokens
  const setupTokenRefresh = useCallback(() => {
    clearTokenRefresh();
    
    // Refresh JWT token every 50 minutes (assuming 1 hour expiry)
    tokenRefreshIntervalRef.current = setInterval(async () => {
      try {
        console.log('useAuthToken - Refreshing JWT token...');
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!response.ok) {
          console.log('useAuthToken - JWT token refresh failed, clearing auth data');
          setAuthData(null);
          clearTokenRefresh();
        }
      } catch (error) {
        console.error('useAuthToken - JWT token refresh error:', error);
        setAuthData(null);
        clearTokenRefresh();
      }
    }, 50 * 60 * 1000); // 50 minutes
  }, []);

  const clearTokenRefresh = useCallback(() => {
    if (tokenRefreshIntervalRef.current) {
      clearInterval(tokenRefreshIntervalRef.current);
      tokenRefreshIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Don't run if Clerk is not loaded yet
    if (!isLoaded) {
      console.log('useAuthToken - Waiting for Clerk to load...');
      return;
    }

    // Throttle auth checks but allow immediate check after sign in/out events
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckRef.current;
    
    // Check immediately if we don't have auth data, if enough time has passed, or if this is initial check
    const shouldCheck = !authData || 
                       timeSinceLastCheck > CACHE_DURATION || 
                       !lastCheckRef.current ||
                       // Force check if Clerk state changes
                       (isSignedIn && userId && authData?.tokenType !== 'clerk') ||
                       (!isSignedIn && authData?.tokenType === 'clerk');
    
    if (shouldCheck) {
      console.log('useAuthToken - Triggering auth check:', {
        hasAuthData: !!authData,
        timeSinceLastCheck,
        isInitialCheck: !lastCheckRef.current,
        clerkStateChanged: (isSignedIn && userId && authData?.tokenType !== 'clerk') || 
                          (!isSignedIn && authData?.tokenType === 'clerk')
      });
      getAuthData();
    } else {
      console.log('useAuthToken - Using cached auth data:', {
        timeSinceLastCheck,
        cacheDuration: CACHE_DURATION
      });
      setIsLoading(false);
    }
  }, [isLoaded, userId, isSignedIn, authData?.tokenType, getAuthData]);

  // Handle sign-out events and clear token refresh
  useEffect(() => {
    if (isLoaded && !isSignedIn && authData?.tokenType === 'clerk') {
      console.log('useAuthToken - User signed out, clearing Clerk auth data');
      setAuthData(null);
      lastCheckRef.current = 0; // Reset cache
      clearTokenRefresh(); // Clear any token refresh intervals
    }
  }, [isLoaded, isSignedIn, authData?.tokenType, clearTokenRefresh]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      clearTokenRefresh();
    };
  }, [clearTokenRefresh]);

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