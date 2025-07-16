import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable in .env.local');
}

export async function GET(request: NextRequest) {
  await dbConnect();

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
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & { id: string, role: string };

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