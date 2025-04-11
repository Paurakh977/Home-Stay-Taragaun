import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

// --- Configuration --- 
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // In production, rely on environment variable; fail hard if missing.
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
    process.exit(1);
  } else {
    console.warn('Warning: JWT_SECRET not set, using default fallback for development.');
    process.env.JWT_SECRET = 'fallback_secret_key_for_development'; // Assign to process.env for consistency
  }
}
const ENCODED_JWT_SECRET = new TextEncoder().encode(JWT_SECRET);

// Regular User/Admin Paths
const DASHBOARD_PATHS = ['/dashboard'];
const ADMIN_UI_PATHS = ['/admin'];
const ADMIN_API_PATHS = ['/api/admin'];

// Superadmin Paths
const SUPERADMIN_DASHBOARD_PATHS = ['/superadmin/dashboard']; // Specific dashboard path
const SUPERADMIN_API_PATHS = ['/api/superadmin']; // Base path for protected superadmin APIs

// Public or Special Paths (Exempt from standard auth checks)
const PUBLIC_PATHS = ['/', '/homestays', '/news', '/contact', '/about']; // Add other public pages
const AUTH_PATHS = ['/login', '/register', '/api/auth']; // User auth paths
const SUPERADMIN_AUTH_PATHS = ['/superadmin/login', '/api/superadmin/auth']; // Superadmin auth paths
const PUBLIC_API_PATHS = ['/api/homestays', '/api/location']; // Publicly accessible API routes
const ASSET_REGEX = /^\/(_next\/static\/|_next\/image\/|static\/|images\/|favicon\.ico|.*\.(?:png|jpg|jpeg|gif|svg|webp))/;
const SEED_API_PATH = '/api/seed-superadmin'; // Allow access for seeding

// --- Helper Functions --- 

/**
 * Verifies a JWT token using jose.
 * Returns the payload if valid, otherwise null.
 */
async function verifyToken(token: string | undefined): Promise<JWTPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, ENCODED_JWT_SECRET);
    return payload;
  } catch (error) {
    console.warn('Token verification failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Creates a redirect response, clearing the specified auth cookie.
 */
function createRedirectResponse(request: NextRequest, redirectTo: string, cookieNameToClear?: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = redirectTo;
  // Optionally add callbackUrl, but consider security implications
  // url.searchParams.set('callbackUrl', request.nextUrl.pathname);
  const response = NextResponse.redirect(url);
  if (cookieNameToClear) {
    response.cookies.set({
      name: cookieNameToClear,
      value: '',
      expires: new Date(0),
      path: '/',
    });
  }
  return response;
}

// --- Middleware Logic --- 

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip Middleware for Assets and specific public paths
  if (ASSET_REGEX.test(pathname) || pathname === SEED_API_PATH) {
    return NextResponse.next();
  }

  // 2. Handle base /superadmin path redirection
  if (pathname === '/superadmin') {
      const token = request.cookies.get('superadmin_token')?.value;
      const payload = await verifyToken(token);
      if (payload && payload.role === 'superadmin') {
          // If logged in as superadmin, redirect to dashboard
          return NextResponse.redirect(new URL('/superadmin/dashboard', request.url));
      }
      // Otherwise, redirect to login
      return NextResponse.redirect(new URL('/superadmin/login', request.url));
  }

  // 3. Identify Path Type
  const isSuperAdminDashboardPath = SUPERADMIN_DASHBOARD_PATHS.some(p => pathname.startsWith(p));
  const isSuperAdminAPIPath = SUPERADMIN_API_PATHS.some(p => pathname.startsWith(p)) && !SUPERADMIN_AUTH_PATHS.some(p => pathname.startsWith(p)); // Exclude auth APIs
  const isAdminUIPath = ADMIN_UI_PATHS.some(p => pathname.startsWith(p));
  const isAdminAPIPath = ADMIN_API_PATHS.some(p => pathname.startsWith(p));
  const isDashboardPath = DASHBOARD_PATHS.some(p => pathname.startsWith(p));

  const requiresSuperAdminAuth = isSuperAdminDashboardPath || isSuperAdminAPIPath;
  const requiresAdminAuth = isAdminUIPath || isAdminAPIPath;
  const requiresUserAuth = isDashboardPath; // Only dashboard requires generic login for now

  // 4. Handle Superadmin Authentication & Authorization
  if (requiresSuperAdminAuth) {
    const token = request.cookies.get('superadmin_token')?.value;
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'superadmin') {
      console.log(`Superadmin access denied for path ${pathname}. Payload:`, payload);
      const redirectPath = '/superadmin/login';
      // For API requests, return 401/403 instead of redirecting
      if (isSuperAdminAPIPath) {
        return NextResponse.json({ message: payload ? 'Forbidden: Superadmin role required' : 'Unauthorized' }, { status: payload ? 403 : 401 });
      }
      return createRedirectResponse(request, redirectPath, token ? undefined : 'superadmin_token'); // Clear cookie only if token was invalid/missing
    }
    // Valid superadmin token and role
    return NextResponse.next();
  }

  // 5. Handle Regular Admin Authentication & Authorization
  if (requiresAdminAuth) {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token);

    if (!payload || payload.isAdmin !== true) {
      console.log(`Admin access denied for path ${pathname}. Payload:`, payload);
      const redirectPath = '/login';
      if (isAdminAPIPath) {
        return NextResponse.json({ message: payload ? 'Forbidden: Admin role required' : 'Unauthorized' }, { status: payload ? 403 : 401 });
      }
      return createRedirectResponse(request, redirectPath, token ? undefined : 'auth_token');
    }

    // --- Optional: Verify Homestay ID (if needed for admin context)
    // if (!payload.homestayId) {
    //   console.warn(`Admin token missing homestayId for path ${pathname}`);
    //   // Handle appropriately - maybe redirect or forbid
    // }

    // Valid admin token and role
    return NextResponse.next();
  }

  // 6. Handle Regular User Authentication (Dashboard)
  if (requiresUserAuth) {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token);

    if (!payload || !payload.homestayId) { // Check for basic validity and homestayId
      console.log(`Dashboard access denied for path ${pathname}. Payload:`, payload);
      const redirectPath = '/login';
      return createRedirectResponse(request, redirectPath, token ? undefined : 'auth_token');
    }
    // Valid user token
    return NextResponse.next();
  }

  // 7. Allow Public and Auth Paths
  // If the code reaches here, it's not a protected asset or a path requiring auth check.
  // Check if it's an explicitly public path or an auth-related path.
  const isPublicPath = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isAuthPath = AUTH_PATHS.some(p => pathname.startsWith(p));
  const isSuperAdminAuthPath = SUPERADMIN_AUTH_PATHS.some(p => pathname.startsWith(p));
  const isPublicAPI = PUBLIC_API_PATHS.some(p => pathname.startsWith(p));

  if (isPublicPath || isAuthPath || isSuperAdminAuthPath || isPublicAPI) {
      return NextResponse.next();
  }

  // 8. Default Deny (Optional but Recommended)
  // If a path is not matched by any rule above, consider denying access.
  // However, be cautious as this might block legitimate paths not listed.
  // console.warn(`Middleware blocked unmatched path: ${pathname}`);
  // return new Response('Not Found', { status: 404 });

  // Default allow if no other rule matched (adjust if stricter control is needed)
  return NextResponse.next();
}

// --- Matcher Configuration --- 
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones matching the ASSET_REGEX.
     * This simplified matcher relies on the internal logic to skip assets early.
     */
    '/((?!_next/static|_next/image|static/|images/|favicon.ico|.*\.(?:png|jpg|jpeg|gif|svg|webp)).*)',
    // Ensure API routes are included for processing
    '/api/:path*',
  ],
}; 