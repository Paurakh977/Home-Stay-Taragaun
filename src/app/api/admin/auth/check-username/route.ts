import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const username = url.searchParams.get('username');
    
    if (!username) {
      return NextResponse.json(
        { success: false, message: 'Username parameter is required' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Check if user exists and is an admin
    const user = await User.findOne({ username }).lean();
    
    if (!user) {
      return NextResponse.json({ 
        success: true, 
        exists: false,
        isAdmin: false
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      exists: true,
      isAdmin: user.role === 'admin'
    });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 