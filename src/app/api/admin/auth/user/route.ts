import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Check if we're looking up by username
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    if (username) {
      // Find admin by username
      const admin = await User.findOne({ username, role: 'admin' });
      
      if (!admin) {
        return NextResponse.json(
          { success: false, message: 'Admin not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        user: {
          _id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      });
    }
    
    // If no username provided, get admin from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const admin = await User.findOne({ _id: decoded.id, role: 'admin' });
      
      if (!admin) {
        return NextResponse.json(
          { success: false, message: 'Admin not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        user: {
          _id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error getting admin:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
} 