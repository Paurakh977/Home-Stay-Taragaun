import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import HomestaySingle from '@/lib/models/HomestaySingle';

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
    // Explicitly including address object and its nested fields if possible
    const homestays = await HomestaySingle.find(query)
      .select('_id homestayId homeStayName villageName address dhsrNo status homeStayType description')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, homestays });

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