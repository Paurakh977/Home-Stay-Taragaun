import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { createUser } from '@/lib/services/userService';
import { verifyAdminToken } from '@/lib/auth';

// Define interface for officer data
interface OfficerData {
  username: string;
  password: string;
  email: string;
  contactNumber: string;
  permissions: Record<string, boolean>;
  isActive: boolean;
}

// Define interface for admin user
interface AdminUser {
  _id?: string;
  username: string;
  role: string;
  permissions?: {
    adminDashboardAccess?: boolean;
    homestayApproval?: boolean;
    homestayEdit?: boolean;
    homestayDelete?: boolean;
    documentUpload?: boolean;
    imageUpload?: boolean;
  };
}

// Define interface for permissions
interface PermissionsSchema {
  adminDashboardAccess: boolean;
  homestayApproval: boolean;
  homestayEdit: boolean;
  homestayDelete: boolean;
  documentUpload: boolean;
  imageUpload: boolean;
  [key: string]: boolean; // Allow indexing with string
}

export async function POST(request: NextRequest) {
  try {
    console.log('================ OFFICER CREATION START ================');
    console.log('Starting officer creation process');
    await dbConnect();
    
    // Get request data
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
    
    console.log(`Received request to create officer for admin username: "${adminUsername}"`);
    
    // Validate required fields
    if (!username || !password || !email || !contactNumber || !adminUsername) {
      console.log('Missing required fields');
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }
    
    try {
      // Verify the admin creating this officer
      console.log('Checking authentication token...');
      const tokenPayload = await verifyAdminToken(request);
      
      // Add detailed logging
      console.log('Token payload:', JSON.stringify(tokenPayload));
      
      // Important: If no token or invalid, handle it
      if (!tokenPayload) {
        console.log('Unauthorized - no valid token');
        return NextResponse.json({
          success: false,
          message: 'Unauthorized - please log in again'
        }, { status: 401 });
      }
      
      console.log(`User from token: ${tokenPayload.username} (ID: ${tokenPayload.userId})`);
      
      // Find logged in user directly from database to ensure we have all fields
      console.log(`Looking up logged in user by ID: ${tokenPayload.userId}`);
      const loggedInUser = await User.findById(tokenPayload.userId);
      
      // Log database query result
      console.log('Database lookup result:', loggedInUser ? 'User found' : 'User NOT found');
      
      if (!loggedInUser) {
        console.log(`Admin not found with ID: ${tokenPayload.userId}`);
        return NextResponse.json({
          success: false,
          message: 'Admin session not found - please log in again'
        }, { status: 404 });
      }
      
      console.log(`Found logged in user: ${loggedInUser.username}, role: ${loggedInUser.role}`);
      
      // Debug: show all users
      const allUsers = await User.find().select('username role');
      console.log('All users in database:', JSON.stringify(allUsers));
      
      // Short circuit for superadmin or matching admin - use the logged in user directly
      if (loggedInUser.role === 'superadmin' || loggedInUser.username === adminUsername) {
        // If this is a regular admin creating for themselves, use their logged in account
        if (loggedInUser.role === 'admin') {
          console.log(`Admin ${loggedInUser.username} is creating an officer for themselves`);
          
          // Create the officer using logged in admin
          return await createOfficerWithAdmin(
            loggedInUser, 
            { username, password, email, contactNumber, permissions, isActive }
          );
        }
      }
      
      // If a superadmin is creating for another admin, find that admin
      if (loggedInUser.role === 'superadmin') {
        console.log(`Superadmin is creating officer for admin: ${adminUsername}`);
        
        // Find the admin by username (case insensitive)
        const admin = await User.findOne({
          $or: [
            { username: adminUsername },
            { username: { $regex: new RegExp(`^${adminUsername}$`, 'i') } }
          ],
          role: 'admin'
        });
        
        if (!admin) {
          console.log(`Admin ${adminUsername} not found by superadmin`);
          return NextResponse.json({
            success: false,
            message: `Admin with username "${adminUsername}" not found or is not an admin`
          }, { status: 404 });
        }
        
        console.log(`Found admin for superadmin creation: ${admin.username}`);
        
        // Create the officer using found admin 
        return await createOfficerWithAdmin(
          admin, 
          { username, password, email, contactNumber, permissions, isActive }
        );
      }
      
      // If we got here, this is a non-matching usernames or wrong role
      console.log(`User ${loggedInUser.username} (${loggedInUser.role}) cannot create officers for ${adminUsername}`);
      return NextResponse.json({
        success: false,
        message: 'You can only create officers for your own account'
      }, { status: 403 });
      
    } catch (err) {
      console.error('Error in authentication or database operations:', err);
      return NextResponse.json({
        success: false,
        message: 'Authentication error - please log in again'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating officer:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create officer'
    }, { status: 500 });
  }
}

// Helper function to create an officer with a specific admin
async function createOfficerWithAdmin(admin: AdminUser, officerData: OfficerData) {
  const { username, password, email, contactNumber, permissions, isActive } = officerData;
  
  // Check if username is already taken
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    console.log(`Username ${username} is already taken`);
    return NextResponse.json({
      success: false,
      message: 'Username is already taken'
    }, { status: 400 });
  }
  
  // Check if email is already taken
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    console.log(`Email ${email} is already taken`);
    return NextResponse.json({
      success: false,
      message: 'Email is already taken'
    }, { status: 400 });
  }
  
  // Define the allowed permissions based on what the admin has
  const allowedPermissions: PermissionsSchema = {
    adminDashboardAccess: false,
    homestayApproval: false,
    homestayEdit: false,
    homestayDelete: false,
    documentUpload: false,
    imageUpload: false
  };
  
  // Check admin permissions (convert from Map if needed)
  const adminPermissions = admin.permissions || {};
  const adminPermissionsObj = adminPermissions instanceof Map
    ? Object.fromEntries(adminPermissions.entries())
    : adminPermissions;
  
  console.log('Admin permissions:', JSON.stringify(adminPermissionsObj));
  console.log('Requested permissions:', JSON.stringify(permissions));
  
  // Filter requested permissions based on what admin has
  for (const key in allowedPermissions) {
    // Only set true if admin has this permission AND it was requested
    if (adminPermissionsObj[key] === true && permissions[key] === true) {
      allowedPermissions[key] = true;
    }
  }
  
  // Allow superadmin to grant any permission
  if (admin.role === 'superadmin') {
    for (const key in permissions) {
      if (permissions[key] === true) {
        allowedPermissions[key] = true;
      }
    }
  }
  
  console.log('Final permissions:', JSON.stringify(allowedPermissions));
  
  // Create officer data
  const officerDataForDB = {
    username,
    password,
    email,
    contactNumber,
    role: 'officer',
    permissions: allowedPermissions,
    isActive,
    parentAdmin: admin.username
  };
  
  console.log('Creating officer with data:', JSON.stringify({
    ...officerDataForDB,
    password: '[REDACTED]'
  }));
  
  try {
    // Create the officer
    const newOfficer = await createUser(officerDataForDB);
    
    console.log(`Officer created successfully: ${newOfficer.username}`);
    
    return NextResponse.json({
      success: true,
      message: 'Officer created successfully',
      officer: {
        _id: newOfficer._id,
        username: newOfficer.username,
        email: newOfficer.email,
        contactNumber: newOfficer.contactNumber,
        role: newOfficer.role,
        permissions: newOfficer.permissions,
        isActive: newOfficer.isActive,
        parentAdmin: newOfficer.parentAdmin,
        createdAt: newOfficer.createdAt,
        updatedAt: newOfficer.updatedAt
      }
    });
  } catch (error) {
    console.error('Error creating officer in database:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create officer in database'
    }, { status: 500 });
  }
} 