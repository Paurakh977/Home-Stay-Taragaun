import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyAdminToken } from '@/lib/auth';

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

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get request data
    const data = await request.json();
    const { 
      officerId,
      permissions = {},
      adminUsername
    } = data;
    
    // Validate required fields
    if (!officerId || !adminUsername) {
      console.log('Missing required fields');
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: officerId and adminUsername are required'
      }, { status: 400 });
    }
    
    try {
      // Verify the admin updating this officer
      const tokenPayload = await verifyAdminToken(request);
      
      console.log('Token payload:', JSON.stringify(tokenPayload));
      
      if (!tokenPayload) {
        console.log('Unauthorized - no valid token');
        return NextResponse.json({
          success: false,
          message: 'Unauthorized - please log in again'
        }, { status: 401 });
      }
      
      console.log(`User from token: ${tokenPayload.username} (ID: ${tokenPayload.userId})`);
      
      // Find logged in user
      const loggedInUser = await User.findById(tokenPayload.userId);
      
      if (!loggedInUser) {
        console.log(`Admin not found with ID: ${tokenPayload.userId}`);
        return NextResponse.json({
          success: false,
          message: 'Admin session not found - please log in again'
        }, { status: 404 });
      }
      
      console.log(`Found logged in user: ${loggedInUser.username}, role: ${loggedInUser.role}`);
      
      // Find the officer to update
      const officer = await User.findById(officerId);
      
      if (!officer) {
        console.log(`Officer not found with ID: ${officerId}`);
        return NextResponse.json({
          success: false,
          message: 'Officer not found'
        }, { status: 404 });
      }
      
      if (officer.role !== 'officer') {
        console.log(`User ${officer.username} is not an officer`);
        return NextResponse.json({
          success: false,
          message: 'User is not an officer'
        }, { status: 400 });
      }
      
      console.log(`Found officer: ${officer.username}, parentAdmin: ${officer.parentAdmin}`);
      
      let targetAdmin: AdminUser;
      
      // Authorization logic
      if (loggedInUser.role === 'superadmin') {
        // Superadmin can update any officer's permissions
        // Find the parent admin of the officer
        const parentAdmin = await User.findOne({ 
          username: officer.parentAdmin, 
          role: 'admin' 
        });
        
        if (!parentAdmin) {
          console.log(`Parent admin ${officer.parentAdmin} not found`);
          return NextResponse.json({
            success: false,
            message: 'Parent admin not found'
          }, { status: 404 });
        }
        
        targetAdmin = parentAdmin;
        console.log(`Superadmin updating officer for admin: ${targetAdmin.username}`);
        
      } else if (loggedInUser.role === 'admin') {
        // Regular admin can only update their own officers
        if (loggedInUser.username !== adminUsername) {
          console.log(`Admin ${loggedInUser.username} cannot update officers for ${adminUsername}`);
          return NextResponse.json({
            success: false,
            message: 'You can only update officers under your own account'
          }, { status: 403 });
        }
        
        // Check if the officer belongs to this admin
        if (officer.parentAdmin !== loggedInUser.username) {
          console.log(`Officer ${officer.username} does not belong to admin ${loggedInUser.username}`);
          return NextResponse.json({
            success: false,
            message: 'This officer does not belong to you'
          }, { status: 403 });
        }
        
        targetAdmin = loggedInUser;
        console.log(`Admin updating their own officer: ${officer.username}`);
        
      } else {
        console.log(`User ${loggedInUser.username} with role ${loggedInUser.role} cannot update officers`);
        return NextResponse.json({
          success: false,
          message: 'Insufficient permissions to update officers'
        }, { status: 403 });
      }
      
      // Now validate permissions against the target admin's permissions
      return await updateOfficerPermissions(officer, targetAdmin, permissions);
      
    } catch (err) {
      console.error('Error in authentication or database operations:', err);
      return NextResponse.json({
        success: false,
        message: 'Authentication error - please log in again'
      }, { status: 401 });
    }
    
  } catch (error) {
    console.error('Error updating officer permissions:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update officer permissions'
    }, { status: 500 });
  }
}

// Helper function to update officer permissions with validation
async function updateOfficerPermissions(
  officer: any, 
  admin: AdminUser, 
  requestedPermissions: Record<string, boolean>
) {
  // Define the allowed permissions structure
  const allowedPermissions: PermissionsSchema = {
    adminDashboardAccess: false,
    homestayApproval: false,
    homestayEdit: false,
    homestayDelete: false,
    documentUpload: false,
    imageUpload: false
  };
  
  // Get admin permissions (convert from Map if needed)
  const adminPermissions = admin.permissions || {};
  const adminPermissionsObj = adminPermissions instanceof Map
    ? Object.fromEntries(adminPermissions.entries())
    : adminPermissions;
  
  console.log('Admin permissions:', JSON.stringify(adminPermissionsObj));
  console.log('Requested permissions:', JSON.stringify(requestedPermissions));
  console.log('Current officer permissions:', JSON.stringify(officer.permissions));
  
  // Validate requested permissions against admin permissions
  for (const key in requestedPermissions) {
    if (!(key in allowedPermissions)) {
      console.log(`Invalid permission key: ${key}`);
      return NextResponse.json({
        success: false,
        message: `Invalid permission: ${key}`
      }, { status: 400 });
    }
    
    // If requesting to set permission to true, admin must have it
    if (requestedPermissions[key] === true) {
      if (admin.role !== 'superadmin' && adminPermissionsObj[key] !== true) {
        console.log(`Admin doesn't have permission: ${key}`);
        return NextResponse.json({
          success: false,
          message: `Cannot grant permission '${key}' - admin does not have this permission`
        }, { status: 403 });
      }
    }
  }
  
  // Build final permissions by merging current permissions with requested changes
  const currentPermissions = officer.permissions || {};
  const currentPermissionsObj = currentPermissions instanceof Map
    ? Object.fromEntries(currentPermissions.entries())
    : currentPermissions;
  
  // Start with current permissions
  for (const key in allowedPermissions) {
    allowedPermissions[key] = currentPermissionsObj[key] === true;
  }
  
  // Apply requested changes
  for (const key in requestedPermissions) {
    if (key in allowedPermissions) {
      allowedPermissions[key] = requestedPermissions[key] === true;
    }
  }
  
  // For superadmin, allow any requested permissions
  if (admin.role === 'superadmin') {
    for (const key in requestedPermissions) {
      if (key in allowedPermissions) {
        allowedPermissions[key] = requestedPermissions[key] === true;
      }
    }
  }
  
  console.log('Final permissions to set:', JSON.stringify(allowedPermissions));
  
  try {
    // Update the officer's permissions
    const updatedOfficer = await User.findByIdAndUpdate(
      officer._id,
      { 
        permissions: allowedPermissions,
        updatedAt: new Date()
      },
      { new: true }
    ).select('username email contactNumber role permissions isActive parentAdmin createdAt updatedAt');
    
    if (!updatedOfficer) {
      console.log('Failed to update officer');
      return NextResponse.json({
        success: false,
        message: 'Failed to update officer'
      }, { status: 500 });
    }
    
    console.log(`Officer permissions updated successfully: ${updatedOfficer.username}`);
    
    return NextResponse.json({
      success: true,
      message: 'Officer permissions updated successfully',
      officer: {
        _id: updatedOfficer._id,
        username: updatedOfficer.username,
        email: updatedOfficer.email,
        contactNumber: updatedOfficer.contactNumber,
        role: updatedOfficer.role,
        permissions: updatedOfficer.permissions,
        isActive: updatedOfficer.isActive,
        parentAdmin: updatedOfficer.parentAdmin,
        createdAt: updatedOfficer.createdAt,
        updatedAt: updatedOfficer.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error updating officer in database:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update officer in database'
    }, { status: 500 });
  }
}