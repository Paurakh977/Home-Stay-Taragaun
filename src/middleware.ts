import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';
import { clerkMiddleware } from "@clerk/nextjs/server";
import { createClerkClient } from '@clerk/backend';

// Extended JWT payload interface with our custom properties
interface ExtendedJWTPayload extends JWTPayload {
  userId?: string;
  username?: string;
  role?: string;
  isAdmin?: boolean;
  homestayId?: string;
  permissions?: AdminPermissions;
}

// --- Configuration --- 
const JWT_SECRET = process.env.JWT_SECRET;
// Edge-compatible approach - no process.exit()
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
    // Don't use process.exit in Edge Runtime
  } else {
    console.warn('Warning: JWT_SECRET not set, using default fallback for development.');
    // Don't modify process.env directly in Edge Runtime
  }
}
// Use the JWT_SECRET or a fallback for development
const ENCODED_JWT_SECRET = new TextEncoder().encode(JWT_SECRET || 'fallback_secret_key_for_development');

// Regular User/Admin Paths
const DASHBOARD_PATHS = ['/dashboard'];
const ADMIN_UI_PATHS = ['/admin/'];
const ADMIN_API_PATHS = ['/api/admin'];

// Superadmin Paths
const SUPERADMIN_DASHBOARD_PATHS = ['/superadmin/dashboard']; // Specific dashboard path
const SUPERADMIN_API_PATHS = ['/api/superadmin']; // Base path for protected superadmin APIs

// Public or Special Paths (Exempt from standard auth checks)
const PUBLIC_PATHS = ['/', '/homestays', '/news', '/contact', '/about']; // Add other public pages
const AUTH_PATHS = ['/login', '/register', '/api/auth']; // User auth paths
const SUPERADMIN_AUTH_PATHS = ['/superadmin/login', '/api/superadmin/auth', '/api/superadmin/uploads/branding']; // Superadmin auth paths and uploads
const PUBLIC_API_PATHS = ['/api/homestays', '/api/location']; // Publicly accessible API routes
const ASSET_REGEX = /^\/(_next\/static\/|_next\/image\/|static\/|images\/|favicon\.ico|.*\.(?:png|jpg|jpeg|gif|svg|webp))/;
const SEED_API_PATH = '/api/seed-superadmin'; // Allow access for seeding

// Clerk authentication paths
const CLERK_AUTH_PATHS = ['/sign-in', '/sign-up', '/sso-callback', '/api/auth/clerk'];
const PUBLIC_CLERK_PATHS = ['/', '/about', '/contact', '/homestays', '/news', '/sign-in', '/sign-up', '/sso-callback'];

// Clerk protected API paths (require Clerk authentication)
const CLERK_PROTECTED_API_PATHS = ['/api/bookings', '/api/chat', '/api/socket'];

// Regex to match admin username routes that should be public
// Match root paths like /admin1 but not /admin1/dashboard (which requires auth)
const ADMIN_USERNAME_REGEX = /^\/[^\/]+$/;

// Regex to match nested admin username paths, specifically for any routes under an admin
// except for the dashboard routes which require authentication
const ADMIN_USERNAME_NESTED_REGEX = /^\/[^\/]+\/(?!dashboard).+$/;

// Admin username login paths
const ADMIN_USERNAME_LOGIN_REGEX = /^\/admin\/[^\/]+\/login$/;

// For any admin-specific action routes (like editing, deleting, etc.)
const ADMIN_EDIT_PATH = /^\/admin\/homestays\/[^\/]+\/edit/;
const ADMIN_DELETE_PATH = /^\/admin\/homestays\/[^\/]+\/delete/;
const ADMIN_DOCUMENT_PATH = /^\/admin\/homestays\/[^\/]+\/documents/;
const ADMIN_IMAGE_PATH = /^\/admin\/homestays\/[^\/]+\/images/;

// Direct uploads path regex for redirection
const UPLOADS_PATH_REGEX = /^\/uploads\/(.*)/;

// Define permission types for type safety
interface AdminPermissions {
  adminDashboardAccess?: boolean;
  homestayApproval?: boolean;
  homestayEdit?: boolean;
  homestayDelete?: boolean;
  documentUpload?: boolean;
  imageUpload?: boolean;
  [key: string]: boolean | undefined;
}

// Define a type for objects that may have Map-like behavior
interface MapLikePermissions {
  get(key: string): boolean | undefined;
}

// Type guard to check if object has Map-like behavior
function isMapLike(obj: any): obj is MapLikePermissions {
  return obj && typeof obj === 'object' && 'get' in obj && typeof obj.get === 'function';
}

// --- Helper Functions --- 

/**
 * Verifies a JWT token using jose.
 * Returns the payload if valid, otherwise null.
 */
async function verifyToken(token: string | undefined): Promise<ExtendedJWTPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, ENCODED_JWT_SECRET);
    return payload as ExtendedJWTPayload;
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

async function middlewareHandler(auth: any, request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip Middleware for Assets and specific public paths
  if (
    ASSET_REGEX.test(pathname) || 
    pathname === SEED_API_PATH || 
    pathname.startsWith('/_next/') || 
    pathname.includes('.js') || 
    pathname.includes('.css') || 
    pathname.includes('.png') || 
    pathname.includes('.ico')
  ) {
    return NextResponse.next();
  }

  // 2. Handle Clerk auth paths
  if (CLERK_AUTH_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 3. Check if path is a public Clerk path
  if (PUBLIC_CLERK_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next();
  }

  // 4. Handle Dashboard with Clerk authentication
  if (pathname === '/dashboard') {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    return NextResponse.next();
  }

  // 4.5. Handle Clerk protected API paths (with JWT fallback for bookings and chat)
  if (CLERK_PROTECTED_API_PATHS.some(path => pathname.startsWith(path))) {
    console.log(`🔐 Middleware - Checking auth for protected path: ${pathname}`);
    
    let authenticated = false;
    let authMethod = '';

    // First try Clerk authentication
    try {
      const { userId } = await auth();
      console.log(`🔐 Middleware - Clerk auth result: ${userId ? 'authenticated' : 'not authenticated'}`);

      if (userId) {
        console.log(`✅ Middleware - Clerk auth successful for user ${userId} on ${pathname}`);
        authenticated = true;
        authMethod = 'clerk';
      }
    } catch (clerkError) {
      console.log(`🔐 Middleware - Clerk auth error for ${pathname}:`, clerkError instanceof Error ? clerkError.message : clerkError);
    }

    // For booking, chat, and socket APIs, also check JWT authentication (homestay users)
    if (!authenticated && (pathname.startsWith('/api/bookings') || pathname.startsWith('/api/chat') || pathname.startsWith('/api/socket'))) {
      console.log(`🔐 Middleware - Checking JWT fallback for ${pathname}`);
      const authToken = request.cookies.get('auth_token')?.value;
      console.log(`🔐 Middleware - JWT token present: ${!!authToken}`);
      
      if (authToken) {
        try {
          const { payload } = await jwtVerify(authToken, ENCODED_JWT_SECRET);
          const homestayId = (payload as any).homestayId;
          const exp = payload.exp;
          
          // Check token expiration
          if (exp && Date.now() >= exp * 1000) {
            console.log(`❌ Middleware - JWT token expired for ${pathname}`);
          } else if (homestayId) {
            console.log(`✅ Middleware - JWT auth successful for homestay ${homestayId} on ${pathname}`);
            authenticated = true;
            authMethod = 'jwt';
          }
        } catch (error) {
          console.log(`❌ Middleware - JWT verification failed for ${pathname}:`, error instanceof Error ? error.message : error);
        }
      } else {
        console.log(`❌ Middleware - No auth_token cookie found for ${pathname}`);
      }
    }

    // Check Bearer token in Authorization header as additional fallback
    if (!authenticated) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log(`🔐 Middleware - Checking Bearer token for ${pathname}`);
        
        try {
          // First try Clerk token verification (for Clerk Bearer tokens)
          const clerk = createClerkClient({
            secretKey: process.env.CLERK_SECRET_KEY!,
            publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
          });

          // Create a minimal request with the Bearer token
          const testRequest = new Request(`${request.nextUrl.origin}/test`, {
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json'
            }
          });

          const { toAuth } = await clerk.authenticateRequest(testRequest);
          const authData = toAuth();
          
          if (authData && authData.userId) {
            console.log(`✅ Middleware - Clerk Bearer auth successful for user ${authData.userId} on ${pathname}`);
            authenticated = true;
            authMethod = 'clerk-bearer';
          }
        } catch (clerkError) {
          console.log(`🔐 Middleware - Not a Clerk token, trying JWT: ${clerkError instanceof Error ? clerkError.message : clerkError}`);
          
          // If Clerk verification fails, try JWT verification (for homestay Bearer tokens)
          try {
            const { payload } = await jwtVerify(token, ENCODED_JWT_SECRET);
            const homestayId = (payload as any).homestayId;
            const exp = payload.exp;
            
            if (exp && Date.now() >= exp * 1000) {
              console.log(`❌ Middleware - Bearer JWT token expired for ${pathname}`);
            } else if (homestayId) {
              console.log(`✅ Middleware - Bearer JWT auth successful for homestay ${homestayId} on ${pathname}`);
              authenticated = true;
              authMethod = 'bearer-jwt';
            }
          } catch (jwtError) {
            console.log(`❌ Middleware - Bearer JWT verification failed for ${pathname}:`, jwtError instanceof Error ? jwtError.message : jwtError);
          }
        }
      }
    }

    if (authenticated) {
      console.log(`✅ Middleware - Authentication successful via ${authMethod} for ${pathname}`);
      return NextResponse.next();
    }

    console.log(`❌ Middleware - Authentication failed for ${pathname}`);
    return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  // 5. Debug for seed-superadmin path
  if (pathname === '/api/seed-superadmin') {
    console.log('Seed superadmin path detected, skipping middleware');
    return NextResponse.next();
  }

  // 6. Special handler for direct uploads paths - redirect to API route
  // This is critical to ensure direct image access works
  const uploadsMatch = pathname.match(UPLOADS_PATH_REGEX);
  if (uploadsMatch) {
    const imagePath = uploadsMatch[1];
    const url = request.nextUrl.clone();
    url.pathname = `/api/images/${imagePath}`;
    // Preserve any query parameters
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    console.log(`🔄 Redirecting direct upload path: ${pathname} -> ${url.pathname}`);
    return NextResponse.redirect(url);
  }

  // 7. Direct image file access - add cache control headers
  if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }

  // 8. Check for admin username routes early (before other checks)
  const isAdminUsernamePath = ADMIN_USERNAME_REGEX.test(pathname);
  const isAdminUsernameNestedPath = ADMIN_USERNAME_NESTED_REGEX.test(pathname);
  
  if (isAdminUsernamePath || isAdminUsernameNestedPath) {
    // Allow access to admin username routes without authentication
    // (except for dashboard paths which are handled separately)
    return NextResponse.next();
  }

  // 9. Check for admin-specific login pages
  const isAdminUsernameLoginPath = ADMIN_USERNAME_LOGIN_REGEX.test(pathname);
  if (isAdminUsernameLoginPath) {
    return NextResponse.next(); // Allow access to admin login pages
  }

  // 10. Handle base /superadmin path redirection
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

  // 11. Handle base /admin path redirection and admin username paths
  if (pathname === '/admin') {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token);
    if (payload && payload.isAdmin === true) {
      // Redirect to admin's personal dashboard
      return NextResponse.redirect(new URL(`/admin/${payload.username}`, request.url));
    }
    // Otherwise, redirect to login
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // 12. Check for admin username dashboard paths
  const adminUsernameDashboardRegex = /^\/[^\/]+\/dashboard/;
  const isAdminUsernameDashboardPath = adminUsernameDashboardRegex.test(pathname);
  
  // 13. Check for admin-specific dashboard
  const adminSpecificDashboardRegex = /^\/admin\/[^\/]+$/;
  const isAdminSpecificDashboardPath = adminSpecificDashboardRegex.test(pathname) && !pathname.includes('/login');
  
  // 14. Identify Path Type
  const isSuperAdminDashboardPath = SUPERADMIN_DASHBOARD_PATHS.some(p => pathname.startsWith(p));
  const isSuperAdminAPIPath = SUPERADMIN_API_PATHS.some(p => pathname.startsWith(p)) && !SUPERADMIN_AUTH_PATHS.some(p => pathname.startsWith(p)); // Exclude auth APIs
  
  // More precise check for admin paths - ensure exact match for '/admin' or paths starting with '/admin/'
  const isAdminUIPath = (pathname === '/admin' || pathname.startsWith('/admin/')) && !isAdminUsernameLoginPath;
  const isAdminAPIPath = ADMIN_API_PATHS.some(p => pathname.startsWith(p));
  
  // Check both standard dashboard and admin username dashboard paths
  const isDashboardPath = DASHBOARD_PATHS.some(p => pathname.startsWith(p)) || isAdminUsernameDashboardPath;

  const requiresSuperAdminAuth = isSuperAdminDashboardPath || isSuperAdminAPIPath;
  const requiresAdminAuth = isAdminUIPath || isAdminAPIPath || isAdminSpecificDashboardPath;
  const requiresUserAuth = isDashboardPath && !pathname.startsWith('/dashboard'); // Only legacy dashboard paths require JWT auth

  // 15. Handle Superadmin Authentication & Authorization
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

  // 16. Handle Regular Admin Authentication & Authorization
  if (requiresAdminAuth) {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token);

    if (!payload || payload.isAdmin !== true) {
      console.log(`Admin access denied for path ${pathname}. Payload:`, payload);
      
      // For admin-specific paths, redirect to that admin's login
      if (isAdminSpecificDashboardPath) {
        const adminUsername = pathname.split('/').pop();
        const redirectPath = `/admin/${adminUsername}/login`;
        if (isAdminAPIPath) {
          return NextResponse.json({ message: payload ? 'Forbidden: Admin role required' : 'Unauthorized' }, { status: payload ? 403 : 401 });
        }
        return createRedirectResponse(request, redirectPath, token ? undefined : 'auth_token');
      }
      
      // Generic admin paths
      const redirectPath = '/admin/login';
      if (isAdminAPIPath) {
        return NextResponse.json({ message: payload ? 'Forbidden: Admin role required' : 'Unauthorized' }, { status: payload ? 403 : 401 });
      }
      return createRedirectResponse(request, redirectPath, token ? undefined : 'auth_token');
    }

    // If it's an admin-specific dashboard, check if the admin is accessing their own dashboard or is a superadmin
    if (isAdminSpecificDashboardPath) {
      const adminUsername = pathname.split('/').pop();
      
      if (payload.username !== adminUsername && payload.role !== 'superadmin') {
        console.log(`Admin access denied - wrong admin: ${payload.username} trying to access ${adminUsername}`);
        // Redirect to their own dashboard
        return NextResponse.redirect(new URL(`/admin/${payload.username}`, request.url));
      }
    }

    // Valid admin token and role
    return NextResponse.next();
  }

  // 17. Handle Regular User Authentication (Dashboard) - Legacy JWT auth for admin username dashboard paths
  if (requiresUserAuth && isAdminUsernameDashboardPath) {
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

  // 18. Allow Public and Auth Paths
  // Check if it's an explicitly public path or an auth-related path.
  const isPublicPath = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isAuthPath = AUTH_PATHS.some(p => pathname.startsWith(p));
  const isSuperAdminAuthPath = SUPERADMIN_AUTH_PATHS.some(p => pathname.startsWith(p));
  const isPublicAPI = PUBLIC_API_PATHS.some(p => pathname.startsWith(p));

  if (isPublicPath || isAuthPath || isSuperAdminAuthPath || isPublicAPI) {
      return NextResponse.next();
  }

  // 19. Check for admin action paths
  const isAdminEditPath = ADMIN_EDIT_PATH.test(pathname);
  const isAdminDeletePath = ADMIN_DELETE_PATH.test(pathname);
  const isAdminDocumentPath = ADMIN_DOCUMENT_PATH.test(pathname);
  const isAdminImagePath = ADMIN_IMAGE_PATH.test(pathname);

  // If it's a permission-specific admin path, perform deeper authorization
  if (isAdminEditPath || isAdminDeletePath || isAdminDocumentPath || isAdminImagePath) {
    const token = request.cookies.get('auth_token')?.value;
    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permissions from the token if available
    try {
      const requiredPermission = isAdminEditPath ? 'homestayEdit' : 
                               isAdminDeletePath ? 'homestayDelete' : 
                               isAdminDocumentPath ? 'documentUpload' :
                               'imageUpload';
      
      // Enhanced permission check to handle different permission formats
      let hasPermission = true; // Default to true if we can't find the permission
      
      if (payload.permissions) {
        // Case 1: Direct property access (standard object)
        if (typeof payload.permissions === 'object' && !isMapLike(payload.permissions)) {
          // Type assertion to help TypeScript understand the structure
          const permissions = payload.permissions as AdminPermissions;
          if (requiredPermission in permissions) {
            hasPermission = permissions[requiredPermission] === true;
          }
        }
        // Case 2: Map-style get method 
        else if (isMapLike(payload.permissions)) {
          const permissionsMap = payload.permissions;
          const permValue = permissionsMap.get(requiredPermission);
          hasPermission = permValue === true;
        }
        
        // If permission is explicitly false, block access
        if (hasPermission === false) {
          console.log(`Permission denied: ${requiredPermission} not granted for path ${pathname}`);
          return NextResponse.json({ 
            message: `Forbidden: You don't have '${requiredPermission}' permission` 
          }, { status: 403 });
        }
      }
      
      // Allow access if permission is true or not found
      console.log(`Permission check passed for ${requiredPermission} on path ${pathname}`);
    } catch (error) {
      console.error('Permission check error:', error);
    }
  }

  // Default allow if no other rule matched (adjust if stricter control is needed)
  return NextResponse.next();
}

// Export the middleware wrapped with clerkMiddleware
export default clerkMiddleware(middlewareHandler);

// --- Matcher Configuration --- 
export const config = {
  matcher: [
    // Include all routes except specific ones we want to exclude
    '/((?!_next/static|_next/image|static|images|favicon.ico).*)',
  ],
};