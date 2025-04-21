import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/mongodb';
import { HomestaySingle, Official, Contact, Location } from '@/lib/models';

// Use the JWT_SECRET from environment or fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function GET(
  request: NextRequest,
  { params }: { params: { homestayId: string } }
) {
  try {
    // Connect to database
    await dbConnect();
    
    const { homestayId } = params;
    console.log(`API: Officer fetching homestay with ID: ${homestayId}`);
    
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
    
    // Get the parent admin username from the payload
    const parentAdmin = payload.parentAdmin;
    
    if (!parentAdmin) {
      console.log('API: No parent admin in token');
      return NextResponse.json(
        { success: false, message: 'Invalid token data' },
        { status: 401 }
      );
    }
    
    // Fetch the homestay data and related collections (officials, contacts, location)
    // similar to how it's done in the admin API
    const [homestay, officials, contacts, location] = await Promise.all([
      HomestaySingle.findOne({ 
        homestayId, 
        adminUsername: parentAdmin 
      }).lean(),
      Official.find({ homestayId }).lean(),
      Contact.find({ homestayId }).lean(),
      Location.findOne({ homestayId }).lean()
    ]);
    
    if (!homestay) {
      console.log(`API: Homestay not found or doesn't belong to admin: ${parentAdmin}`);
      return NextResponse.json(
        { success: false, message: 'Homestay not found' },
        { status: 404 }
      );
    }
    
    console.log(`API: Successfully fetched homestay data for ID: ${homestayId}`);
    
    // Combine all data into a single response, just like the admin API
    const responseData = {
      ...homestay,
      officials,
      contacts,
      location
    };
    
    return NextResponse.json({
      success: true,
      data: responseData
    });
    
  } catch (error: any) {
    console.error('Error in officer homestay fetch API:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { homestayId: string } }
) {
  try {
    // Connect to database
    await dbConnect();
    
    const { homestayId } = params;
    console.log(`API: Officer updating homestay status with ID: ${homestayId}`);
    
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
    
    // Check if officer has homestayApproval permission
    const permissions = payload.permissions as Record<string, boolean> || {};
    if (!permissions.homestayApproval) {
      console.log('API: Officer lacks homestayApproval permission');
      return NextResponse.json(
        { success: false, message: 'You do not have permission to approve/reject homestays' },
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
    
    // Get status from request body
    const { status } = await request.json();
    
    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      console.log('API: Invalid status value:', status);
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      );
    }
    
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
    
    // Update the status
    homestay.status = status;
    
    // Add audit information
    homestay.lastUpdatedBy = payload.username;
    homestay.lastUpdatedAt = new Date();
    
    // Save the updated homestay
    await homestay.save();
    
    console.log(`API: Successfully updated homestay status to ${status} for ID: ${homestayId}`);
    
    return NextResponse.json({
      success: true,
      message: `Homestay status updated to ${status}`,
      homestay
    });
    
  } catch (error: any) {
    console.error('Error in officer homestay status update API:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
} 