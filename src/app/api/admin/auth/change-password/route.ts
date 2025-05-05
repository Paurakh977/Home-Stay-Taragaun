import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { adminId, currentPassword, newPassword } = body;
    
    // Validate input
    if (!adminId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Find admin by ID and ensure it's an admin role
    const admin = await User.findOne({ _id: adminId, role: 'admin' });
    
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 404 }
      );
    }
    
    // Verify current password using the comparePassword method
    const isMatch = await admin.comparePassword(currentPassword);
    
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 400 }
      );
    }
    
    // Set new password (will be hashed in pre-save hook)
    admin.password = newPassword;
    await admin.save();
    
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Legacy POST method kept for backward compatibility
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get admin from cookie
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
      // Find admin by ID and ensure it has admin role
      const admin = await User.findOne({ _id: decoded.id, role: 'admin' });
      
      if (!admin) {
        return NextResponse.json(
          { success: false, message: 'Admin not found' },
          { status: 404 }
        );
      }
      
      // Verify current password using comparePassword method
      const isPasswordValid = await admin.comparePassword(currentPassword);
      
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, message: 'Current password is incorrect' },
          { status: 400 }
        );
      }
      
      // Set new password (will be hashed in pre-save hook)
      admin.password = newPassword;
      await admin.save();
      
      return NextResponse.json(
        { success: true, message: 'Password updated successfully' },
        { status: 200 }
      );
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
} 