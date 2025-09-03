import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/backend';
import { jwtVerify } from 'jose';

// JWT secret for homestay users
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
const ENCODED_JWT_SECRET = new TextEncoder().encode(JWT_SECRET);

export interface AuthUser {
  userId: string;
  userType: 'clerk' | 'homestay';
}

/**
 * Enhanced authentication function with better error handling and timeout
 * Supports both Clerk and JWT authentication methods
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  console.log('🔐 API Auth - Starting authentication check');
  console.log('🔐 API Auth - Request headers:', {
    authorization: !!request.headers.get('authorization'),
    cookie: !!request.headers.get('cookie'),
    userAgent: request.headers.get('user-agent')?.substring(0, 50),
    contentType: request.headers.get('content-type')
  });

  // Set up timeout for authentication operations
  const authTimeout = 10000; // 10 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), authTimeout);

  try {
    // Check for Authorization header first (for client-side requests)
    const authHeader = request.headers.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('🔐 API Auth - Found Bearer token in header');

      // Try to verify as Clerk token first
      try {
        console.log('🔐 API Auth - Attempting Clerk token verification...');
        const clerk = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY!,
          publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
        });

        const { toAuth } = await clerk.authenticateRequest(request);
        const authData = toAuth();
        console.log('🔐 API Auth - Clerk auth result:', {
          hasAuthData: !!authData,
          userId: authData?.userId,
          sessionId: authData?.sessionId
        });

        if (authData && authData.userId) {
          console.log('✅ API Auth - Clerk authentication successful for user:', authData.userId);
          clearTimeout(timeoutId);
          return { userId: authData.userId, userType: 'clerk' as const };
        }
      } catch (error) {
        console.log('❌ API Auth - Clerk token verification failed:', error instanceof Error ? error.message : error);
      }

      // Try to verify as JWT token if Clerk fails
      try {
        console.log('🔐 API Auth - Attempting JWT token verification...');
        const { payload } = await jwtVerify(token, ENCODED_JWT_SECRET);
        const homestayId = (payload as any).homestayId;
        const exp = payload.exp;
        
        // Check token expiration
        if (exp && Date.now() >= exp * 1000) {
          console.log('❌ API Auth - JWT token has expired');
        } else if (homestayId) {
          console.log('✅ API Auth - JWT authentication successful for homestay:', homestayId);
          clearTimeout(timeoutId);
          return { userId: homestayId, userType: 'homestay' as const };
        }
      } catch (jwtError) {
        console.log('❌ API Auth - JWT token verification also failed:', jwtError instanceof Error ? jwtError.message : jwtError);
      }
    } else {
      console.log('🔐 API Auth - No Bearer token in Authorization header');
    }

    // Fallback to server-side auth (for server-side requests)
    try {
      console.log('🔐 API Auth - Attempting server-side Clerk auth...');
      const { userId } = await auth();
      console.log('🔐 API Auth - Server-side Clerk auth result:', { userId });
      
      if (userId) {
        console.log('✅ API Auth - Server-side Clerk authentication successful for user:', userId);
        clearTimeout(timeoutId);
        return { userId, userType: 'clerk' as const };
      }
    } catch (error) {
      console.log('❌ API Auth - Server-side Clerk auth failed:', error instanceof Error ? error.message : error);
    }

    // Check for JWT token in cookies (homestay/admin users)
    const authToken = request.cookies.get('auth_token')?.value;
    console.log('🔐 API Auth - Checking JWT cookie:', !!authToken);
    
    if (authToken) {
      try {
        console.log('🔐 API Auth - Attempting JWT cookie verification...');
        const { payload } = await jwtVerify(authToken, ENCODED_JWT_SECRET);
        const homestayId = (payload as any).homestayId;
        const exp = payload.exp;
        
        // Check token expiration
        if (exp && Date.now() >= exp * 1000) {
          console.log('❌ API Auth - JWT cookie has expired');
        } else if (homestayId) {
          console.log('✅ API Auth - JWT cookie authentication successful for homestay:', homestayId);
          clearTimeout(timeoutId);
          return { userId: homestayId, userType: 'homestay' as const };
        }
      } catch (error) {
        console.log('❌ API Auth - JWT cookie verification failed:', error instanceof Error ? error.message : error);
      }
    }

    console.log('❌ API Auth - All authentication methods failed');
    clearTimeout(timeoutId);
    return null;

  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ API Auth - Authentication timeout');
    } else {
      console.error('❌ API Auth - Authentication error:', error);
    }
    return null;
  }
}

/**
 * Verify if a user has access to a specific chat
 */
export async function verifyUserChatAccess(
  user: AuthUser, 
  chatId: string,
  Chat: any // MongoDB Chat model
): Promise<boolean> {
  if (!chatId) return true; // For creating new chats

  try {
    const chat = await Chat.findOne({
      chatId,
      'participants.userId': user.userId,
      'participants.userType': user.userType,
      isActive: true
    });

    return !!chat;
  } catch (error) {
    console.error('Error verifying chat access:', error);
    return false;
  }
}
