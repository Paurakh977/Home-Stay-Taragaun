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
  
  // If it's an API route, just pass through (API body limits are handled by config)
  if (pathname.startsWith('/api/')) {
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
    await jwtVerify(token, encodedKey);
    
    // Token is valid, allow the request
    return NextResponse.next();
  } catch (error) {
    // Token verification failed, redirect to login
    console.error('Authentication error:', error);
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
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