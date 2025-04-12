import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { HomestaySingle } from '@/lib/models';

// Use the JWT_SECRET from environment or fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Parse request body
    const { username, password } = await request.json();
    
    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // Find user by username
    const user = await User.findOne({ username }).select('+password');
    
    // Check if user exists
    if (!user) {
      console.warn(`Login failed: User ${username} not found`);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if user is an admin
    if (user.role !== 'admin') {
      console.warn(`Login failed: User ${username} is not an admin (role: ${user.role})`);
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.warn(`Login failed: Invalid password for user ${username}`);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Find homestays associated with this admin
    const adminHomestays = await HomestaySingle.find({ 
      adminUsername: username 
    }).select('homestayId homeStayName');
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: true, // Flag for middleware checks
        homestays: adminHomestays.map(h => ({ 
          id: h.homestayId, 
          name: h.homeStayName 
        }))
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
        homestays: adminHomestays.map(h => ({ 
          id: h.homestayId, 
          name: h.homeStayName 
        }))
      }
    });
    
    // Set auth cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax'
    });
    
    return response;
    
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 