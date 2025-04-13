import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

// Use the JWT_SECRET from environment or fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // First check if this is a superadmin
    const superadminToken = request.cookies.get('superadmin_token')?.value;
    if (superadminToken) {
      try {
        // Verify the token
        const { payload } = await jwtVerify(superadminToken, secret);
        
        if (payload && payload.role === 'superadmin') {
          // Return superadmin info
          return NextResponse.json({
            success: true,
            user: {
              role: 'superadmin',
              isSuperAdmin: true
            }
          });
        }
      } catch (error) {
        console.error('Error verifying superadmin token:', error);
        // Continue with regular admin auth if superadmin token is invalid
      }
    }
    
    // Get the auth token from cookies - properly await
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify the token
    const { payload } = await jwtVerify(token, secret);
    
    if (!payload || !payload.userId || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Get user from database to confirm they still exist and are admin
    const user = await User.findById(payload.userId);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'User not found or no longer an admin' },
        { status: 403 }
      );
    }
    
    // User is authenticated and is an admin
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
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