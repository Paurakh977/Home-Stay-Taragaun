import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyAdminToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();
    
    const adminUsername = request.nextUrl.searchParams.get('adminUsername');
    
    if (!adminUsername) {
      return NextResponse.json({ 
        success: false, 
        message: 'Admin username is required' 
      }, { status: 400 });
    }
    
    // Verify the token and get admin data
    const tokenData = await verifyAdminToken(request);
    
    if (!tokenData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }
    
    // Find the requesting admin
    const requestingAdmin = await User.findById(tokenData.userId);
    
    if (!requestingAdmin) {
      return NextResponse.json({ 
        success: false, 
        message: 'Admin not found' 
      }, { status: 404 });
    }
    
    // Check if the admin making the request matches the username in the URL
    if (requestingAdmin.username !== adminUsername) {
      return NextResponse.json({ 
        success: false, 
        message: 'You are not authorized to view these officers' 
      }, { status: 403 });
    }
    
    // If admin is a superadmin, they can see all officers
    // Otherwise, only show officers created by this admin
    let officersQuery: any = { role: 'officer' };
    
    if (requestingAdmin.role !== 'superadmin') {
      officersQuery.parentAdmin = adminUsername;
    }
    
    // Fetch officers
    const officers = await User.find(officersQuery)
      .select('username email contactNumber isActive permissions createdAt parentAdmin')
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