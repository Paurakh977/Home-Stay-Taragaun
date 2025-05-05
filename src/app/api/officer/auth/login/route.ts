import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

// Use the JWT_SECRET from environment or fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';

// Helper function to check if object has Map-like behavior
function isMapLike(obj: any): obj is { get(key: string): any } {
  return obj && typeof obj === 'object' && 'get' in obj && typeof obj.get === 'function';
}

export async function POST(request: NextRequest) {
  try {
    console.log('==================================================');
    console.log('OFFICER LOGIN - DEBUG MODE');
    console.log('==================================================');
    
    const body = await request.json();
    const { username, password, parentAdmin } = body;
    
    console.log('LOGIN ATTEMPT:', { 
      username,
      passwordLength: password ? password.length : 0,
      passwordFirstChar: password ? password.charAt(0) : '',
      passwordLastChar: password ? password.charAt(password.length - 1) : '',
      parentAdmin: parentAdmin || 'not specified'
    });
    
    if (!username || !password) {
      console.log('LOGIN FAILED: Missing credentials');
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connection established');
    
    // Find user by username with password field
    console.log(`Looking up officer with username: "${username}"`);
    const user = await User.findOne({ username }).select('+password');
    
    if (!user) {
      console.log('LOGIN FAILED: User not found in database');
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    console.log('USER FOUND:', { 
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      parentAdmin: user.parentAdmin || 'none',
      passwordInDB: {
        type: typeof user.password,
        length: user.password ? user.password.length : 0,
        value: user.password ? `${user.password.substring(0, 10)}...` : 'undefined'
      }
    });
    
    // Verify password using bcrypt
    console.log('PASSWORD COMPARISON:');
    console.log(`- Input password length: ${password.length}`);
    console.log(`- Stored hashed password length: ${user.password.length}`);
    console.log(`- Stored hash prefix: ${user.password.substring(0, 10)}...`);
    console.log('Comparing passwords using bcrypt.compare()...');
    
    // This block adds comprehensive password verification to debug issues
    let passwordMatch = false;
    
    // First try standard bcrypt compare
    try {
      passwordMatch = await bcrypt.compare(password, user.password);
      console.log(`STANDARD PASSWORD MATCH RESULT: ${passwordMatch}`);
      
      // If standard compare fails, try edge cases
      if (!passwordMatch) {
        // Case 1: Try with double hashing (legacy case)
        console.log('TRYING EDGE CASE 1: Double-hashed password check');
        console.log('First hashing the password with bcrypt, then comparing hashed result...');
        const salt = await bcrypt.genSalt(10);
        const tempHash = await bcrypt.hash(password, salt);
        const doubleHashMatch = await bcrypt.compare(tempHash, user.password);
        console.log(`EDGE CASE 1 RESULT: ${doubleHashMatch}`);
        
        // Case 2: Try direct equality check (rare case when plain text was stored)
        const directMatch = (password === user.password);
        console.log(`EDGE CASE 2: Direct equality check result: ${directMatch}`);
        
        // If any edge case checks pass, consider it a match
        if (doubleHashMatch || directMatch) {
          console.log('An edge case password match was found. Updating password format...');
          passwordMatch = true;
          
          // Update the password to the correct format
          try {
            const newSalt = await bcrypt.genSalt(10);
            const correctlyHashedPassword = await bcrypt.hash(password, newSalt);
            
            // Update user's password to correct format
            await User.findByIdAndUpdate(
              user._id,
              { $set: { password: correctlyHashedPassword } }
            );
            
            console.log('Password hash format corrected in database.');
          } catch (updateError) {
            console.error('Failed to update password format:', updateError);
          }
        }
      }
    } catch (compareError) {
      console.error('Error during password comparison:', compareError);
    }
    
    if (!passwordMatch) {
      console.log('LOGIN FAILED: Password incorrect');
      
      // Debug: Show more details about the hash format
      console.log('HASH ANALYSIS:');
      console.log(`- Hash starts with "$2": ${user.password.startsWith('$2')}`);
      console.log(`- Hash contains expected separators: ${user.password.split('$').length >= 3}`);
      
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if user is an officer
    if (user.role !== 'officer') {
      console.log(`LOGIN FAILED: User has role "${user.role}" but needs "officer" role`);
      return NextResponse.json(
        { success: false, message: 'You must be an officer to access this area' },
        { status: 403 }
      );
    }
    
    // Check if the officer is active
    if (user.isActive === false) {
      console.log('LOGIN FAILED: Officer account is inactive');
      return NextResponse.json(
        { success: false, message: 'Your account is inactive. Please contact your admin.' },
        { status: 403 }
      );
    }
    
    // If parentAdmin was specified, verify this officer belongs to that admin
    if (parentAdmin && user.parentAdmin !== parentAdmin) {
      console.log('LOGIN FAILED: Officer does not belong to specified admin', { 
        officerParentAdmin: user.parentAdmin, 
        requestedParentAdmin: parentAdmin 
      });
      return NextResponse.json(
        { success: false, message: 'You are not authorized to access this admin\'s panel' },
        { status: 403 }
      );
    }
    
    // Check admin dashboard access permission
    console.log('CHECKING PERMISSIONS:');
    console.log('Raw permissions from DB:', user.permissions);
    
    let hasAccess = false;
    
    if (user.permissions) {
      // If it's a Map object from MongoDB
      if (isMapLike(user.permissions)) {
        console.log('Permission format: MongoDB Map');
        hasAccess = user.permissions.get('adminDashboardAccess') === true;
        console.log(`adminDashboardAccess from Map: ${user.permissions.get('adminDashboardAccess')}`);
      } 
      // If it's a regular object
      else {
        console.log('Permission format: Regular Object');
        hasAccess = user.permissions.adminDashboardAccess === true;
        console.log(`adminDashboardAccess from Object: ${user.permissions.adminDashboardAccess}`);
      }
    } else {
      console.log('No permissions found in user document');
    }
    
    console.log(`Has admin dashboard access: ${hasAccess}`);
    
    if (!hasAccess) {
      console.log('LOGIN FAILED: No dashboard access permission');
      return NextResponse.json(
        { success: false, message: 'You do not have permission to access the dashboard' },
        { status: 403 }
      );
    }
    
    // Get permission values, handling both Map and object formats
    const getPermissionValue = (permName: string, defaultValue: boolean = false): boolean => {
      if (!user.permissions) return defaultValue;
      
      if (isMapLike(user.permissions)) {
        return user.permissions.get(permName) === true;
      } else if (typeof user.permissions === 'object') {
        return (user.permissions as any)[permName] === true;
      }
      
      return defaultValue;
    };
    
    // Log all permissions for debugging
    console.log('ALL PERMISSIONS:');
    const permissions = {
      adminDashboardAccess: getPermissionValue('adminDashboardAccess'),
      homestayApproval: getPermissionValue('homestayApproval'),
      homestayEdit: getPermissionValue('homestayEdit'),
      homestayDelete: getPermissionValue('homestayDelete'),
      documentUpload: getPermissionValue('documentUpload'),
      imageUpload: getPermissionValue('imageUpload')
    };
    console.log(permissions);
    
    // If we reach here, authentication is successful
    console.log('LOGIN SUCCESSFUL: Generating token...');
    
    // Generate JWT token with user info
    const token = sign(
      { 
        userId: user._id, 
        username: user.username,
        role: user.role,
        parentAdmin: user.parentAdmin,
        isOfficer: true,
        // Include all user permissions in the token
        permissions: permissions
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('TOKEN GENERATED:', { 
      tokenLength: token.length,
      tokenPrefix: `${token.substring(0, 20)}...`,
    });
    
    // Create response with user details
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        parentAdmin: user.parentAdmin
      }
    });
    
    // Set the officer auth token cookie
    response.cookies.set({
      name: 'officer_token',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    console.log('LOGIN PROCESS COMPLETED SUCCESSFULLY');
    console.log('==================================================');
    
    return response;
  } catch (error) {
    console.error('==================================================');
    console.error('OFFICER LOGIN ERROR:');
    console.error(error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    console.error('==================================================');
    
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 