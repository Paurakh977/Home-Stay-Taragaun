import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyAdminToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();
    
    // Parse request data
    const { officerId, adminUsername } = await request.json();
    
    if (!officerId || !adminUsername) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }
    
    // Verify the admin token
    const tokenData = await verifyAdminToken(request);
    
    if (!tokenData) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - please log in again'
      }, { status: 401 });
    }
    
    // Find the admin user
    const admin = await User.findById(tokenData.userId);
    
    if (!admin) {
      return NextResponse.json({
        success: false,
        message: 'Admin not found'
      }, { status: 404 });
    }
    
    // Check if the admin matches the provided username
    if (admin.username !== adminUsername) {
      return NextResponse.json({
        success: false,
        message: 'You can only manage your own officers'
      }, { status: 403 });
    }
    
    // Find the officer
    const officer = await User.findById(officerId);
    
    if (!officer) {
      return NextResponse.json({
        success: false,
        message: 'Officer not found'
      }, { status: 404 });
    }
    
    // Check if this is an officer account
    if (officer.role !== 'officer') {
      return NextResponse.json({
        success: false,
        message: 'User is not an officer'
      }, { status: 400 });
    }
    
    // Check if the officer belongs to this admin
    if (officer.parentAdmin !== adminUsername) {
      return NextResponse.json({
        success: false,
        message: 'You can only manage your own officers'
      }, { status: 403 });
    }
    
    // Delete the officer
    await User.findByIdAndDelete(officerId);
    
    return NextResponse.json({
      success: true,
      message: 'Officer deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting officer:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to delete officer'
    }, { status: 500 });
  }
} 