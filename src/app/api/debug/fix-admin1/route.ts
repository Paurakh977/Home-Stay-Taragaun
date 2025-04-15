import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword } from '@/lib/utils';

// Debug API endpoint to fix admin1 permissions
export async function POST(request: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, message: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    await dbConnect();
    console.log('Debug API: Fixing admin1 permissions');
    
    // Find admin1 user
    const admin1 = await User.findOne({ username: 'admin1' });
    
    if (!admin1) {
      console.log('Debug API: admin1 user not found');
      return NextResponse.json(
        { success: false, message: 'admin1 user not found' },
        { status: 404 }
      );
    }
    
    console.log('Debug API: Found admin1 user:', {
      id: admin1._id,
      username: admin1.username,
      role: admin1.role,
      currentPermissions: admin1.permissions || 'No permissions object'
    });
    
    // Reset password to a known value for testing
    const newPassword = 'password123';
    const hashedPassword = hashPassword(newPassword);
    
    console.log('Debug API: Generated new password hash:', {
      plainPassword: newPassword,
      hashedPassword: hashedPassword
    });
    
    // Update admin1 user with proper permissions and new password
    const updateResult = await User.updateOne(
      { username: 'admin1' },
      { 
        $set: { 
          password: hashedPassword,
          permissions: {
            adminDashboardAccess: true,
            homestayApproval: false,
            homestayEdit: false,
            homestayDelete: false,
            documentUpload: false,
            imageUpload: false
          }
        } 
      }
    );
    
    console.log('Debug API: Update result:', updateResult);
    
    // Get the updated user to verify
    const updatedAdmin1 = await User.findOne({ username: 'admin1' });
    
    console.log('Debug API: Updated admin1 permissions:', updatedAdmin1.permissions);
    console.log('Debug API: Updated admin1 password hash:', updatedAdmin1.password);
    
    return NextResponse.json({
      success: true,
      message: 'admin1 permissions and password fixed successfully. New password: ' + newPassword,
      user: {
        id: updatedAdmin1._id,
        username: updatedAdmin1.username,
        role: updatedAdmin1.role,
        permissions: updatedAdmin1.permissions
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { success: false, message: 'Error fixing admin1 permissions' },
      { status: 500 }
    );
  }
} 