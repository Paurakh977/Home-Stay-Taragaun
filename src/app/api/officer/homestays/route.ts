import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import HomestaySingle from '@/lib/models/HomestaySingle';
import Official from '@/lib/models/Official';
import Contact from '@/lib/models/Contact';
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
    
    // Get filter parameters
    const province = searchParams.get('province');
    const district = searchParams.get('district');
    const municipality = searchParams.get('municipality');
    const homestayType = searchParams.get('homestayType');
    const status = searchParams.get('status');
    const includeFeatures = searchParams.get('includeFeatures') === 'true';
    const attractionsParam = searchParams.get('attractions');
    
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
      const query: any = { adminUsername };
      
      // Add filters if provided
      if (province) {
        query['address.province.en'] = province;
      }
      
      if (district) {
        query['address.district.en'] = district;
      }
      
      if (municipality) {
        query['address.municipality.en'] = municipality;
      }
      
      if (homestayType) {
        query.homeStayType = homestayType;
      }
      
      if (status) {
        query.status = status;
      }
      
      // Add attraction filter if provided
      if (attractionsParam) {
        const selectedAttractions = attractionsParam.split(',');
        if (selectedAttractions.length > 0) {
          query['features.localAttractions'] = { $all: selectedAttractions };
        }
      }
      
      console.log('API: Fetching homestays for admin with filters:', { adminUsername, query });
      
      // Select all fields needed for the officer overview table and filtering
      const homestays = await HomestaySingle.find(query)
        .select(`_id homestayId homeStayName villageName address dhsrNo status homeStayType description contactIds roomCount bedCount homeCount ${includeFeatures ? 'features' : ''}`)
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`API: Found ${homestays.length} homestays`);
      
      // Fetch officials and contacts for all homestays
      const homestaysWithData = await Promise.all(
        homestays.map(async (homestay) => {
          // Fetch officials (operators) for this homestay
          const officials = await Official.find({ 
            homestayId: homestay.homestayId,
          }).lean();
          
          // Find the operator (owner)
          const operator = officials.find(official => official.role === 'operator');
          
          // Fetch contact information - make sure to try all possible ways to get contacts
          let contacts = [];
          
          // Try to get contacts by contactIds first (if available)
          if (homestay.contactIds && homestay.contactIds.length > 0) {
            const contactsById = await Contact.find({
              _id: { $in: homestay.contactIds }
            }).lean();
            
            if (contactsById && contactsById.length > 0) {
              contacts = contactsById;
            }
          }
          
          // If no contacts found by contactIds, try homestayId
          if (contacts.length === 0) {
            const contactsByHomestayId = await Contact.find({
              homestayId: homestay.homestayId
            }).lean();
            
            if (contactsByHomestayId && contactsByHomestayId.length > 0) {
              contacts = contactsByHomestayId;
            }
          }
          
          // Last resort - try with string ID to handle potential type mismatches
          if (contacts.length === 0) {
            // Try with string conversion in case of type mismatches
            const contactsByHomestayIdAsString = await Contact.find({
              homestayId: String(homestay.homestayId)
            }).lean();
            
            if (contactsByHomestayIdAsString && contactsByHomestayIdAsString.length > 0) {
              contacts = contactsByHomestayIdAsString;
            }
          }
          
          // Log debugging information if we still don't have contacts
          if (contacts.length === 0) {
            console.log(`No contacts found for homestay ${homestay.homestayId} with name ${homestay.homeStayName}`);
            if (homestay.contactIds) {
              console.log(`ContactIds: ${JSON.stringify(homestay.contactIds)}`);
            }
          }
          
          return {
            ...homestay,
            officials,
            operator,
            contacts: contacts
          };
        })
      );
      
      return NextResponse.json({ 
        success: true, 
        homestays: homestaysWithData
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