import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import HomestaySingle from '@/lib/models/HomestaySingle';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Ensure this route is treated as dynamic
export const dynamic = 'force-dynamic';

// JWT verification helper
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';

interface OfficerTokenPayload {
  userId: string;
  username: string;
  role: string;
  parentAdmin: string;
  isOfficer: boolean;
  permissions?: Record<string, boolean>;
}

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await dbConnect();
    console.log('API: Officer homestays endpoint called');
    
    // Get the adminUsername from query parameters
    const { searchParams } = new URL(request.url);
    const adminUsername = searchParams.get('adminUsername');
    
    // Validate adminUsername
    if (!adminUsername) {
      console.log('API: Missing admin username parameter');
      return NextResponse.json({ 
        success: false, 
        error: 'Admin username is required' 
      }, { status: 400 });
    }
    
    // Verify officer authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('officer_token')?.value;
    
    if (!token) {
      console.log('API: No officer authentication token found');
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET) as OfficerTokenPayload;
      
      if (!decoded || !decoded.isOfficer || decoded.role !== 'officer') {
        console.log('API: Invalid officer token', { decoded });
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid authentication'
        }, { status: 401 });
      }
      
      // Verify the officer belongs to the specified admin
      if (decoded.parentAdmin !== adminUsername) {
        console.log('API: Officer does not belong to requested admin', { 
          officerParentAdmin: decoded.parentAdmin, 
          requestedAdmin: adminUsername 
        });
        return NextResponse.json({ 
          success: false, 
          error: 'You are not authorized to access this admin\'s homestays'
        }, { status: 403 });
      }
      
      // Build query to filter by the parent admin username
      const query = { adminUsername };
      
      console.log('API: Fetching homestays for admin', { adminUsername });
      
      // Select all fields needed for the officer overview table and filtering
      const homestays = await HomestaySingle.find(query)
        .select('_id homestayId homeStayName villageName address dhsrNo status homeStayType description')
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`API: Found ${homestays.length} homestays`);
      
      return NextResponse.json({ 
        success: true, 
        homestays 
      });
      
    } catch (jwtError) {
      console.error('API: JWT verification error:', jwtError);
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication failed'
      }, { status: 401 });
    }
  } catch (error: any) {
    console.error('API: Error in officer homestays endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
} 