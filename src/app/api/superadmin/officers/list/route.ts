import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifySuperadminToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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
    
    // Find all officers across all admins
    const officers = await User.find({ role: 'officer' })
      .select('username email contactNumber isActive parentAdmin createdAt')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      success: true, 
      officers 
    });
    
  } catch (error: any) {
    console.error('Error in officer list API:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
} 