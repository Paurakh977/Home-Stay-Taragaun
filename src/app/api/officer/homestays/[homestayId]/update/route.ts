import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/mongodb';
import { HomestaySingle } from '@/lib/models';

// Use the JWT_SECRET from environment or fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function PUT(
  request: NextRequest,
  { params }: { params: { homestayId: string } }
) {
  try {
    // Connect to database
    await dbConnect();
    
    const { homestayId } = params;
    console.log(`API: Officer updating homestay with ID: ${homestayId}`);
    
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('officer_token')?.value;
    
    if (!token) {
      console.log('API: No officer token found');
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify the token
    const { payload } = await jwtVerify(token, secret);
    
    if (!payload || !payload.userId || payload.role !== 'officer' || !payload.isOfficer) {
      console.log('API: Invalid token or not officer role', { payload });
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Check if officer has homestayEdit permission
    const permissions = payload.permissions as Record<string, boolean> || {};
    if (!permissions.homestayEdit) {
      console.log('API: Officer lacks homestayEdit permission');
      return NextResponse.json(
        { success: false, message: 'You do not have permission to edit homestays' },
        { status: 403 }
      );
    }
    
    // Get the parent admin username from the payload
    const parentAdmin = payload.parentAdmin;
    
    if (!parentAdmin) {
      console.log('API: No parent admin in token');
      return NextResponse.json(
        { success: false, message: 'Invalid token data' },
        { status: 401 }
      );
    }
    
    // Get update data from request body
    const updateData = await request.json();
    
    // Find the homestay and ensure it belongs to the parent admin
    const homestay = await HomestaySingle.findOne({ 
      homestayId, 
      adminUsername: parentAdmin 
    });
    
    if (!homestay) {
      console.log(`API: Homestay not found or doesn't belong to admin: ${parentAdmin}`);
      return NextResponse.json(
        { success: false, message: 'Homestay not found' },
        { status: 404 }
      );
    }
    
    // Update the homestay with the provided data
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        homestay[key] = updateData[key];
      }
    });
    
    // Add audit information
    updateData.lastUpdatedBy = payload.username;
    updateData.lastUpdatedAt = new Date();
    
    // Save the updated homestay
    await homestay.save();
    
    console.log(`API: Successfully updated homestay data for ID: ${homestayId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Homestay updated successfully',
      homestay
    });
    
  } catch (error: any) {
    console.error('Error in officer homestay update API:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
} 