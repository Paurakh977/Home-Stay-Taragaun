import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, JWTPayload } from 'jose';
import { User } from '@/lib/models';
import dbConnect from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
const ENCODED_JWT_SECRET = new TextEncoder().encode(JWT_SECRET);

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

export async function GET(request: NextRequest) {
  try {
    // Check for token in cookies
    const token = request.cookies.get('superadmin_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify token
    const payload = await verifyToken(token);
    
    if (!payload || payload.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 403 }
      );
    }
    
    // Connect to database
    await dbConnect();
    
    // Check if user still exists in database
    const user = await User.findById(payload.id).select('-password');
    
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, message: 'User not found or permissions changed' },
        { status: 403 }
      );
    }
    
    // Return user info (excluding sensitive data)
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Error validating superadmin session:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 