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
    const { 
      username, 
      password, 
      email, 
      contactNumber, 
      permissions = {}, 
      isActive = true,
      adminUsername
    } = data;
    
    // Validate required fields
    if (!username || !password || !email || !contactNumber || !adminUsername) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }
    
    // Check if username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Username is already taken'
      }, { status: 400 });
    }
    
    // Check if email is already taken
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({
        success: false,
        message: 'Email is already taken'
      }, { status: 400 });
    }
    
    // Find admin by username
    const admin = await User.findOne({ 
      username: adminUsername,
      role: 'admin'
    });
    
    if (!admin) {
      return NextResponse.json({
        success: false,
        message: `Admin with username "${adminUsername}" not found`
      }, { status: 404 });
    }

    // Define all possible permission keys and ensure they all exist in the permissions object
    const permissionKeys = [
      'adminDashboardAccess',
      'homestayApproval',
      'homestayEdit',
      'homestayDelete',
      'documentUpload',
      'imageUpload'
    ];
    
    // Create a complete permissions object with all keys included
    const completePermissions: Record<string, boolean> = {};
    
    // Initialize all permissions to false
    permissionKeys.forEach(key => {
      completePermissions[key] = false;
    });
    
    // Apply the selected permissions
    Object.keys(permissions).forEach(key => {
      if (permissionKeys.includes(key)) {
        completePermissions[key] = !!permissions[key];
      }
    });
    
    // Create the officer - letting the model's pre-save hook handle password hashing
    const officer = new User({
      username,
      email,
      password, // Don't hash here, let the model's pre-save hook handle it
      contactNumber,
      permissions: completePermissions,
      isActive,
      role: 'officer',
      parentAdmin: adminUsername
    });
    
    await officer.save();
    
    return NextResponse.json({
      success: true,
      message: 'Officer created successfully'
    });
    
  } catch (error: any) {
    console.error('Error creating officer:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
} 