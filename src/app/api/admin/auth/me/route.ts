import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

// Use the JWT_SECRET from environment or fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
const secret = new TextEncoder().encode(JWT_SECRET);

// Helper function to check if object has Map-like behavior
function isMapLike(obj: any): obj is { get(key: string): any } {
  return obj && typeof obj === 'object' && 'get' in obj && typeof obj.get === 'function';
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    console.log('API: Admin auth/me endpoint called');
    
    // First check if this is a superadmin
    const superadminToken = request.cookies.get('superadmin_token')?.value;
    if (superadminToken) {
      try {
        // Verify the token
        const { payload } = await jwtVerify(superadminToken, secret);
        
        if (payload && payload.role === 'superadmin') {
          // Return superadmin info
          console.log('API: User is a superadmin');
          return NextResponse.json({
            success: true,
            user: {
              role: 'superadmin',
              isSuperAdmin: true,
              // Superadmins have all permissions by default
              permissions: {
                adminDashboardAccess: true,
                homestayApproval: true,
                homestayEdit: true,
                homestayDelete: true,
                documentUpload: true,
                imageUpload: true
              }
            }
          });
        }
      } catch (error) {
        console.error('Error verifying superadmin token:', error);
        // Continue with regular admin auth if superadmin token is invalid
      }
    }
    
    // Get the auth token from cookies - properly await
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      console.log('API: No auth token found');
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify the token
    const { payload } = await jwtVerify(token, secret);
    
    if (!payload || !payload.userId || payload.role !== 'admin') {
      console.log('API: Invalid token or not admin role', { payload });
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Get user from database to confirm they still exist and are admin
    const user = await User.findById(payload.userId);
    
    if (!user || user.role !== 'admin') {
      console.log('API: User not found or not admin', { userId: payload.userId });
      return NextResponse.json(
        { success: false, message: 'User not found or no longer an admin' },
        { status: 403 }
      );
    }
    
    // Log user permissions for debugging
    console.log('API: User found with permissions:', { 
      username: user.username,
      role: user.role,
      permissions: user.permissions || 'No permissions object found'
    });
    
    // Extract and normalize permissions from the user object
    const permissions = {
      adminDashboardAccess: false,
      homestayApproval: false,
      homestayEdit: false,
      homestayDelete: false,
      documentUpload: false,
      imageUpload: false
    };
    
    // Helper function to get permission value from either object or Map-like
    const getPermissionValue = (permName: string, defaultValue: boolean = false): boolean => {
      if (!user.permissions) return defaultValue;
      
      if (isMapLike(user.permissions)) {
        return user.permissions.get(permName) === true;
      } else if (typeof user.permissions === 'object') {
        return (user.permissions as any)[permName] === true;
      }
      
      return defaultValue;
    };
    
    // Extract all permissions using the helper
    permissions.adminDashboardAccess = getPermissionValue('adminDashboardAccess');
    permissions.homestayApproval = getPermissionValue('homestayApproval');
    permissions.homestayEdit = getPermissionValue('homestayEdit');
    permissions.homestayDelete = getPermissionValue('homestayDelete');
    permissions.documentUpload = getPermissionValue('documentUpload');
    permissions.imageUpload = getPermissionValue('imageUpload');
    
    // Log the normalized permissions
    console.log('API: Normalized permissions:', permissions);
    
    // Check if user has admin dashboard access
    if (!permissions.adminDashboardAccess) {
      console.log('API: User lacks dashboard access permission', { username: user.username });
      return NextResponse.json({
        success: false,
        message: 'You do not have permission to access the admin dashboard',
        status: 403
      });
    }
    
    // User is authenticated and has proper permissions
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: permissions,
        homestays: payload.homestays || []
      }
    });
    
  } catch (error) {
    console.error('Admin auth check error:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 401 }
    );
  }
} 