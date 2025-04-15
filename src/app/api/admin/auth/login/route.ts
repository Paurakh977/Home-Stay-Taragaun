import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

// Use the JWT_SECRET from environment or fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';

// Helper function to check if object has Map-like behavior
function isMapLike(obj: any): obj is { get(key: string): any } {
  return obj && typeof obj === 'object' && 'get' in obj && typeof obj.get === 'function';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Find user by username with password field
    const user = await User.findOne({ username }).select('+password');
    
    if (!user) {
      console.log('Login failed: User not found', { username });
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      console.log('Login failed: Password incorrect', { username });
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if user is an admin
    if (user.role !== 'admin') {
      console.log('Login failed: Not an admin role', { username, role: user.role });
      return NextResponse.json(
        { success: false, message: 'You must be an admin to access this area' },
        { status: 403 }
      );
    }
    
    // Check admin dashboard access permission
    let hasAccess = false;
    
    if (user.permissions) {
      // If it's a Map object from MongoDB
      if (isMapLike(user.permissions)) {
        hasAccess = user.permissions.get('adminDashboardAccess') === true;
      } 
      // If it's a regular object
      else {
        hasAccess = user.permissions.adminDashboardAccess === true;
      }
    }
    
    if (!hasAccess) {
      console.log('Login failed: No dashboard access permission', { username });
      return NextResponse.json(
        { success: false, message: 'You do not have permission to access the admin dashboard' },
        { status: 403 }
      );
    }
    
    // Get permission values, handling both Map and object formats
    const getPermissionValue = (permName: string, defaultValue: boolean = false): boolean => {
      if (!user.permissions) return defaultValue;
      
      if (isMapLike(user.permissions)) {
        return user.permissions.get(permName) === true;
      } else if (typeof user.permissions === 'object') {
        return (user.permissions as any)[permName] === true;
      }
      
      return defaultValue;
    };
    
    // If we reach here, authentication is successful
    // Generate JWT token with user info
    const token = sign(
      { 
        userId: user._id, 
        username: user.username,
        role: user.role,
        isAdmin: true,
        // Include all user permissions in the token
        permissions: {
          adminDashboardAccess: hasAccess,
          homestayApproval: getPermissionValue('homestayApproval'),
          homestayEdit: getPermissionValue('homestayEdit'),
          homestayDelete: getPermissionValue('homestayDelete'),
          documentUpload: getPermissionValue('documentUpload'),
          imageUpload: getPermissionValue('imageUpload')
        }
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Create response with user details
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
    
    // Set the auth token cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 