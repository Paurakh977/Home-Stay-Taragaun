import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifySuperadminToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();
    
    // Verify superadmin token
    const tokenData = await verifySuperadminToken(request);
    
    if (!tokenData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }
    
    // Parse request body
    const data = await request.json();
    const { officerId, newPassword } = data;
    
    // Validate required fields
    if (!officerId) {
      return NextResponse.json({
        success: false,
        message: 'Officer ID is required'
      }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'New password must be at least 6 characters'
      }, { status: 400 });
    }
    
    // Find the officer
    const officer = await User.findById(officerId);
    
    if (!officer) {
      return NextResponse.json({
        success: false,
        message: 'Officer not found'
      }, { status: 404 });
    }
    
    // Update officer's password - let the model's pre-save hook handle hashing
    officer.password = newPassword;
    await officer.save();
    
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });
    
  } catch (error: any) {
    console.error('Error updating officer password:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
} 