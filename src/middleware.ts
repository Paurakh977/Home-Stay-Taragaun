import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Paths that require general authentication
const PROTECTED_PATHS = ['/dashboard'];
// Paths that require admin privileges
const ADMIN_PATHS = ['/admin']; 
const ADMIN_API_PATHS = ['/api/admin']; // Define admin API paths

// Paths that are accessible to all
// Note: Specific API paths like login are handled implicitly or within the API route itself
// const PUBLIC_PATHS = ['/', '/login', '/register', '/api/auth/login'];

// JWT secret - same as used in login API
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';

/**
 * Middleware function to handle authentication and authorization
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Determine if the path requires admin access (UI or API)
  const isAdminRequiredPath = ADMIN_PATHS.some(path => pathname.startsWith(path)) || 
                              ADMIN_API_PATHS.some(path => pathname.startsWith(path));

  // Determine if the path requires general authentication
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));

  // Allow requests to public assets and specific framework paths immediately
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/images/') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') || // Add other static file types if needed
    pathname.endsWith('.jpg')
  ) {
    return NextResponse.next();
  }
  
  // If path doesn't require admin or general protection, allow access
  // Exception: /api routes not covered by ADMIN_API_PATHS are generally open unless handled internally
  if (!isAdminRequiredPath && !isProtectedPath) {
    // Allow non-protected API routes (like login, register API)
    if (pathname.startsWith('/api/') && !ADMIN_API_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }
    // Allow non-protected UI routes
    if (!pathname.startsWith('/api/')) {
        return NextResponse.next();
    }
    // If it's an API route that ISN'T an admin route but wasn't caught above,
    // let it pass (assuming internal checks or it's meant to be public).
    // This logic might need refinement based on specific public API routes.
    // return NextResponse.next(); // Re-evaluate if needed
  }

  // --- Authentication & Authorization Check ---
  try {
    // Get the token from cookies
    const token = request.cookies.get('auth_token')?.value;

    // If no token, redirect to login (for both protected and admin paths)
    if (!token) {
      const url = new URL('/login', request.url);
      // Keep track of the intended destination
      url.searchParams.set('callbackUrl', pathname);
      console.log(`No token found for path ${pathname}, redirecting to login.`);
      return NextResponse.redirect(url);
    }

    // Verify the token
    const textEncoder = new TextEncoder();
    const encodedKey = textEncoder.encode(JWT_SECRET);
    const verified = await jwtVerify(token, encodedKey);

    // Extract payload from the token, including isAdmin
    const payload = verified.payload as { homestayId?: string; isAdmin?: boolean };
    const homestayId = payload.homestayId;
    const isUserAdmin = payload.isAdmin === true;

    if (!homestayId) {
      throw new Error('Invalid token payload - missing homestayId');
    }

    // --- Authorization Check for Admin Paths ---
    if (isAdminRequiredPath && !isUserAdmin) {
      // User is trying to access admin area but is not an admin
      console.warn(`Non-admin user (${homestayId}) attempted to access admin path ${pathname}`);
      // Redirect non-admins trying to access admin areas to the dashboard
      // For API requests, returning a 403 Forbidden might be more appropriate
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // --- Optional: Verify user existence (consider performance implications) ---
    // const userCheckUrl = `${request.nextUrl.origin}/api/homestays/${homestayId}`; 
    // try {
    //   const userResponse = await fetch(userCheckUrl, { headers: { 'Cookie': `auth_token=${token}` } });
    //   if (!userResponse.ok) {
    //     // Handle case where user associated with token no longer exists
    //     console.warn(`User ${homestayId} check failed with status ${userResponse.status}`);
    //     throw new Error('User associated with token not found or inactive.');
    //   }
    // } catch (fetchError) {
    //   console.error(`Error checking user existence for ${homestayId}:`, fetchError);
    //   throw new Error('Failed to verify user existence.');
    // }

    // If all checks pass, allow the request
    return NextResponse.next();

  } catch (error) {
    // Handle errors (invalid token, verification failure, user check failure)
    console.error('Middleware auth error:', error);

    const loginUrl = new URL('/login', request.url);
    // Don't set callbackUrl here if the error wasn't just 'missing token'
    // as it might indicate a compromised token.
    const response = NextResponse.redirect(loginUrl);
    
    // Clear the potentially invalid auth_token cookie
    response.cookies.set({
      name: 'auth_token',
      value: '',
      expires: new Date(0), // Expire immediately
      path: '/',
    });

    return response;
  }
}

// Configuration for the matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones explicitly excluded below.
     * The negative lookahead ensures these paths are ignored by the middleware.
     */
    '/((?!_next/static|_next/image|images/|favicon.ico|robots.txt|sitemap.xml|.*\.png$|.*\.jpg$).*)',
    // Explicitly include API paths to ensure they are processed, 
    // internal logic will decide whether to protect them.
    '/api/:path*', 
  ],
}; 