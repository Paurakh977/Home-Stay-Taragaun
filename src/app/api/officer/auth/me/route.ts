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
    console.log('API: Officer auth/me endpoint called');
    
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('officer_token')?.value;
    
    if (!token) {
      console.log('API: No officer token found');
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify the token
    const { payload } = await jwtVerify(token, secret);
    
    if (!payload || !payload.userId || payload.role !== 'officer' || !payload.isOfficer) {
      console.log('API: Invalid token or not officer role', { payload });
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Get user from database to confirm they still exist and are an officer
    const user = await User.findById(payload.userId);
    
    if (!user || user.role !== 'officer') {
      console.log('API: User not found or no longer an officer', { userId: payload.userId });
      return NextResponse.json(
        { success: false, message: 'User not found or no longer an officer' },
        { status: 403 }
      );
    }
    
    // Check if the officer is active
    if (user.isActive === false) {
      console.log('API: Officer account is inactive', { username: user.username });
      return NextResponse.json(
        { success: false, message: 'Your account is inactive' },
        { status: 403 }
      );
    }
    
    // Log user permissions for debugging
    console.log('API: Officer found with permissions:', { 
      username: user.username,
      role: user.role,
      parentAdmin: user.parentAdmin,
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
        message: 'You do not have permission to access the dashboard',
        status: 403
      });
    }
    
    // Officer is authenticated and has proper permissions
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        parentAdmin: user.parentAdmin,
        permissions: permissions
      }
    });
    
  } catch (error) {
    console.error('Officer auth check error:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 401 }
    );
  }
} 