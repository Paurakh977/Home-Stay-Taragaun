import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifySuperadminToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();
    
    // Verify the superadmin token
    const tokenData = await verifySuperadminToken(request);
    
    if (!tokenData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }
    
    // Find all active admins
    const admins = await User.find({ 
      role: 'admin',
      isActive: true 
    })
    .select('_id username name email')
    .sort({ username: 1 });
    
    return NextResponse.json({ 
      success: true, 
      admins 
    });
    
  } catch (error: any) {
    console.error('Error in admins list API:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
} 