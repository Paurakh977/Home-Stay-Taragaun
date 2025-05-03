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
    const { officerId } = data;
    
    // Validate required fields
    if (!officerId) {
      return NextResponse.json({
        success: false,
        message: 'Officer ID is required'
      }, { status: 400 });
    }
    
    // Find and delete the officer
    const officer = await User.findByIdAndDelete(officerId);
    
    if (!officer) {
      return NextResponse.json({
        success: false,
        message: 'Officer not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Officer deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting officer:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
} 