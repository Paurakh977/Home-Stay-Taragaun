import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyAdminToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('==================================================');
    console.log('OFFICER PASSWORD RESET - DEBUG MODE');
    console.log('==================================================');
    
    // Connect to database
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connection established');
    
    // Parse request data
    const reqData = await request.json();
    const { officerId, newPassword, adminUsername } = reqData;
    
    console.log('PASSWORD RESET REQUEST:', {
      officerId,
      newPasswordLength: newPassword ? newPassword.length : 0,
      newPasswordFirstTwoChars: newPassword ? newPassword.substring(0, 2) : '',
      newPasswordLastTwoChars: newPassword ? newPassword.substring(newPassword.length - 2) : '',
      adminUsername
    });
    
    if (!officerId || !newPassword || !adminUsername) {
      console.log('RESET FAILED: Missing required fields');
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }
    
    // Verify the admin token
    console.log('Verifying admin token...');
    const tokenData = await verifyAdminToken(request);
    
    if (!tokenData) {
      console.log('RESET FAILED: Invalid or missing admin token');
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - please log in again'
      }, { status: 401 });
    }
    
    console.log('Admin token verified:', { 
      userId: tokenData.userId,
      username: tokenData.username,
      role: tokenData.role
    });
    
    // Find the admin user
    console.log(`Looking up admin with ID: ${tokenData.userId}`);
    const admin = await User.findById(tokenData.userId);
    
    if (!admin) {
      console.log('RESET FAILED: Admin not found in database');
      return NextResponse.json({
        success: false,
        message: 'Admin not found'
      }, { status: 404 });
    }
    
    console.log('Admin found:', { 
      id: admin._id.toString(),
      username: admin.username,
      role: admin.role
    });
    
    // Check if the admin matches the provided username
    if (admin.username !== adminUsername) {
      console.log('RESET FAILED: Admin username mismatch', {
        tokenUsername: admin.username,
        requestedUsername: adminUsername
      });
      return NextResponse.json({
        success: false,
        message: 'You can only manage your own officers'
      }, { status: 403 });
    }
    
    // Find the officer
    console.log(`Looking up officer with ID: ${officerId}`);
    const officer = await User.findById(officerId);
    
    if (!officer) {
      console.log('RESET FAILED: Officer not found in database');
      return NextResponse.json({
        success: false,
        message: 'Officer not found'
      }, { status: 404 });
    }
    
    console.log('Officer found:', { 
      id: officer._id.toString(),
      username: officer.username,
      role: officer.role,
      parentAdmin: officer.parentAdmin || 'none'
    });
    
    // Check if this is an officer account
    if (officer.role !== 'officer') {
      console.log(`RESET FAILED: User has role "${officer.role}" but needs "officer" role`);
      return NextResponse.json({
        success: false,
        message: 'User is not an officer'
      }, { status: 400 });
    }
    
    // Check if the officer belongs to this admin
    if (officer.parentAdmin !== adminUsername) {
      console.log('RESET FAILED: Officer does not belong to this admin', {
        officerParentAdmin: officer.parentAdmin,
        requestingAdmin: adminUsername
      });
      return NextResponse.json({
        success: false,
        message: 'You can only manage your own officers'
      }, { status: 403 });
    }
    
    // Hash the new password
    console.log('Hashing new password...');
    console.log(`New password length: ${newPassword.length}`);
    
    const salt = await bcrypt.genSalt(10);
    console.log(`Generated salt: ${salt}`);
    
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    console.log(`Hashed password length: ${hashedPassword.length}`);
    console.log(`Password hash prefix: ${hashedPassword.substring(0, 10)}...`);
    
    // Update the officer's password
    console.log('Updating officer password in database...');
    const oldPasswordPrefix = officer.password ? officer.password.substring(0, 10) : 'none';
    
    // IMPORTANT: Try direct update approach instead of save method
    try {
      // Method 1: Use the model's save method (original approach)
      officer.password = hashedPassword;
      console.log('Saving using officer.save() method...');
      await officer.save();
      console.log('Save method completed');
      
      // Method 2: Also try direct update as a backup to ensure it's applied
      console.log('Also using findByIdAndUpdate as a backup method...');
      await User.findByIdAndUpdate(
        officerId,
        { $set: { password: hashedPassword } },
        { new: true }
      );
      console.log('Update method completed');
      
      // VERIFICATION STEP: Re-fetch the user to verify the change was actually saved
      console.log('Verifying password was updated in database...');
      const updatedOfficer = await User.findById(officerId).select('+password');
      
      if (!updatedOfficer) {
        console.error('VERIFICATION FAILED: Could not find officer after update');
      } else {
        console.log('VERIFICATION RESULT:', {
          passwordMatch: updatedOfficer.password === hashedPassword,
          oldHashPrefix: oldPasswordPrefix,
          expectedNewHashPrefix: hashedPassword.substring(0, 10),
          actualNewHashPrefix: updatedOfficer.password.substring(0, 10),
          fullMatch: updatedOfficer.password === hashedPassword
        });
        
        // Test if the new password works with bcrypt.compare
        const testPassword = newPassword;
        const passwordTestResult = await bcrypt.compare(testPassword, updatedOfficer.password);
        console.log(`VERIFICATION: Test of new password with bcrypt.compare: ${passwordTestResult}`);
        
        if (!passwordTestResult) {
          console.error('CRITICAL ERROR: Password was changed but doesn\'t validate with bcrypt.compare!');
          console.log('Expected hash:', hashedPassword);
          console.log('Actual stored hash:', updatedOfficer.password);
        }
      }
    } catch (updateError) {
      console.error('Error during password update:', updateError);
      throw updateError;
    }
    
    console.log('Password updated successfully');
    console.log(`Old password hash prefix: ${oldPasswordPrefix}...`);
    console.log(`New password hash prefix: ${hashedPassword.substring(0, 10)}...`);
    
    console.log('PASSWORD RESET COMPLETED SUCCESSFULLY');
    console.log('==================================================');
    
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });
    
  } catch (error: any) {
    console.error('==================================================');
    console.error('OFFICER PASSWORD RESET ERROR:');
    console.error(error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    console.error('==================================================');
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to reset password'
    }, { status: 500 });
  }
} 