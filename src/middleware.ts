import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, JWTVerifyResult } from 'jose';

// Paths that require authentication
const PROTECTED_PATHS = ['/dashboard'];

// Paths that are accessible to all
const PUBLIC_PATHS = ['/', '/login', '/register', '/api/auth/login'];

// JWT secret - same as used in login API
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // If it's an API route that's not a protected API route, just pass through
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/change-password')) {
    return NextResponse.next();
  }
  
  // Check if the path is protected
  const isProtectedPath = PROTECTED_PATHS.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // If it's not a protected path, allow the request
  if (!isProtectedPath) {
    return NextResponse.next();
  }
  
  try {
    // Get the token from cookies
    const token = request.cookies.get('auth_token')?.value;
    
    // If no token, redirect to login
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    // Verify the token
    const textEncoder = new TextEncoder();
    const encodedKey = textEncoder.encode(JWT_SECRET);
    const verified = await jwtVerify(token, encodedKey);
    
    // Extract homestayId from the token payload
    const payload = verified.payload as { homestayId?: string };
    const homestayId = payload.homestayId;
    
    if (!homestayId) {
      throw new Error('Invalid token payload - missing homestayId');
    }
    
    // Check if the user still exists in the database
    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || request.nextUrl.origin}/api/homestays/${homestayId}`, {
      headers: {
        'Cookie': `auth_token=${token}`
      }
    });
    
    // If user doesn't exist or response is not ok, redirect to login
    if (!userResponse.ok) {
      throw new Error('User no longer exists in the database');
    }
    
    // Token is valid and user exists, allow the request
    return NextResponse.next();
  } catch (error) {
    // Token verification failed or user doesn't exist, redirect to login
    console.error('Authentication error:', error);
    
    // Clear the auth_token cookie
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set({
      name: 'auth_token',
      value: '',
      expires: new Date(0), // Expire immediately
      path: '/',
    });
    
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next (Next.js internals)
     * - static (static files)
     * - images (image files)
     * - favicon.ico (favicon file)
     * - robots.txt (SEO file)
     * - sitemap.xml (SEO file)
     */
    '/((?!_next/static|_next/image|images|favicon.ico|robots.txt|sitemap.xml).*)',
    '/api/:path*'
  ],
}; 