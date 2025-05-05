import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Use the JWT_SECRET from environment or fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';

export async function POST(request: NextRequest) {
  try {
    console.log('==================================================');
    console.log('OFFICER CHANGE PASSWORD - DEBUG MODE');
    console.log('==================================================');
    
    // Connect to database
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connection established');
    
    // Parse request data
    const reqData = await request.json();
    const { currentPassword, newPassword, adminUsername } = reqData;
    
    console.log('CHANGE PASSWORD REQUEST:', {
      currentPasswordLength: currentPassword ? currentPassword.length : 0,
      currentPasswordFirstTwoChars: currentPassword ? currentPassword.substring(0, 2) : '',
      newPasswordLength: newPassword ? newPassword.length : 0,
      newPasswordFirstTwoChars: newPassword ? newPassword.substring(0, 2) : '',
      adminUsername
    });
    
    if (!currentPassword || !newPassword || !adminUsername) {
      console.log('CHANGE FAILED: Missing required fields');
      return NextResponse.json({
        success: false,
        message: 'All fields are required'
      }, { status: 400 });
    }
    
    // Get the officer token - FIXED: properly await cookies()
    console.log('Getting officer token from cookies');
    const cookieStore = await cookies();
    const token = cookieStore.get('officer_token')?.value;
    
    if (!token) {
      console.log('CHANGE FAILED: No officer token found');
      return NextResponse.json({
        success: false, 
        message: 'You must be logged in to change your password'
      }, { status: 401 });
    }
    
    // Verify the token
    console.log('Verifying officer token');
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET) as { 
        userId: string;
        username: string;
        role: string;
        parentAdmin?: string;
      };
      
      console.log('Token verified:', {
        userId: decodedToken.userId,
        username: decodedToken.username,
        role: decodedToken.role,
        parentAdmin: decodedToken.parentAdmin
      });
    } catch (error) {
      console.log('CHANGE FAILED: Invalid token', error);
      return NextResponse.json({
        success: false,
        message: 'Invalid token - please log in again'
      }, { status: 401 });
    }
    
    // Make sure this is an officer
    if (decodedToken.role !== 'officer') {
      console.log(`CHANGE FAILED: User is not an officer, role is ${decodedToken.role}`);
      return NextResponse.json({
        success: false,
        message: 'Only officers can use this endpoint'
      }, { status: 403 });
    }
    
    // Verify the officer belongs to this admin
    if (decodedToken.parentAdmin !== adminUsername) {
      console.log('CHANGE FAILED: Officer does not belong to this admin', {
        tokenParentAdmin: decodedToken.parentAdmin,
        requestedAdmin: adminUsername
      });
      return NextResponse.json({
        success: false,
        message: 'You can only change your password under your own admin'
      }, { status: 403 });
    }
    
    // Find the officer
    console.log(`Looking up officer with ID: ${decodedToken.userId}`);
    const officer = await User.findById(decodedToken.userId).select('+password');
    
    if (!officer) {
      console.log('CHANGE FAILED: Officer not found in database');
      return NextResponse.json({
        success: false,
        message: 'Officer not found'
      }, { status: 404 });
    }
    
    console.log('Officer found:', { 
      id: officer._id.toString(),
      username: officer.username,
      role: officer.role,
      passwordHashPrefix: officer.password.substring(0, 10)
    });
    
    // Verify current password
    console.log('Verifying current password with bcrypt.compare');
    const isPasswordValid = await bcrypt.compare(currentPassword, officer.password);
    
    if (!isPasswordValid) {
      console.log('CHANGE FAILED: Current password is incorrect');
      return NextResponse.json({
        success: false,
        message: 'Current password is incorrect'
      }, { status: 400 });
    }
    
    console.log('Current password verified successfully');
    
    // Hash the new password
    console.log('Hashing new password...');
    console.log(`New password length: ${newPassword.length}`);
    
    const salt = await bcrypt.genSalt(10);
    console.log(`Generated salt: ${salt}`);
    
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    console.log(`Hashed password length: ${hashedPassword.length}`);
    console.log(`New password hash prefix: ${hashedPassword.substring(0, 10)}...`);
    
    // Update the officer's password
    console.log('Updating officer password in database...');
    
    // Method 1: Direct assignment and save
    officer.password = hashedPassword;
    await officer.save();
    
    // Method 2: Also do a direct update as a backup
    await User.findByIdAndUpdate(
      decodedToken.userId,
      { $set: { password: hashedPassword } }
    );
    
    // Verify the change was successful
    const updatedOfficer = await User.findById(decodedToken.userId).select('+password');
    if (updatedOfficer) {
      console.log('VERIFICATION: New password hash in DB:', updatedOfficer.password.substring(0, 10));
      const verifyNewPassword = await bcrypt.compare(newPassword, updatedOfficer.password);
      console.log(`VERIFICATION: New password verification result: ${verifyNewPassword}`);
      
      if (!verifyNewPassword) {
        console.error('CRITICAL ERROR: New password verification failed!');
      }
    }
    
    console.log('PASSWORD CHANGE COMPLETED SUCCESSFULLY');
    console.log('==================================================');
    
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error: any) {
    console.error('==================================================');
    console.error('OFFICER CHANGE PASSWORD ERROR:');
    console.error(error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    console.error('==================================================');
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to change password'
    }, { status: 500 });
  }
} 