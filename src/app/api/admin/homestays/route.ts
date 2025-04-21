import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import HomestaySingle from '@/lib/models/HomestaySingle';
import Official from '@/lib/models/Official';
import Contact from '@/lib/models/Contact';

// Ensure this route is treated as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get the adminUsername from query parameters
    const { searchParams } = new URL(request.url);
    const adminUsername = searchParams.get('adminUsername');
    
    // Validate adminUsername
    if (!adminUsername) {
      return NextResponse.json(
        { success: false, error: 'Admin username is required' },
        { status: 400 }
      );
    }
    
    // Build query to filter by adminUsername
    const query = { adminUsername };

    // Select all fields needed for the admin overview table and filtering
    const homestays = await HomestaySingle.find(query)
      .select('_id homestayId homeStayName villageName address dhsrNo status homeStayType description contactIds')
      .sort({ createdAt: -1 })
      .lean();

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

    return NextResponse.json({ success: true, homestays: homestaysWithData });

  } catch (error) {
    console.error('Error fetching homestays for admin:', error);
    // It's important to check the type of error before accessing message
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Failed to fetch homestays', details: errorMessage },
      { status: 500 }
    );
  }
} 