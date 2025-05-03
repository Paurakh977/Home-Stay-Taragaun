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
    const { officerId, isActive } = data;
    
    // Validate required fields
    if (officerId === undefined || isActive === undefined) {
      return NextResponse.json({
        success: false,
        message: 'Officer ID and status are required'
      }, { status: 400 });
    }
    
    // Find and update the officer
    const officer = await User.findByIdAndUpdate(
      officerId,
      { isActive },
      { new: true }
    );
    
    if (!officer) {
      return NextResponse.json({
        success: false,
        message: 'Officer not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Officer ${isActive ? 'activated' : 'deactivated'} successfully`
    });
    
  } catch (error: any) {
    console.error('Error updating officer status:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
} 