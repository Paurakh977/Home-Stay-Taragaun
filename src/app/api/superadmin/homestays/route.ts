import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { HomestaySingle } from '@/lib/models';

// GET all homestays for superadmin
export async function GET(request: Request) {
  await dbConnect();

  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');
    const status = searchParams.get('status');
    const adminUsername = searchParams.get('adminUsername');
    const province = searchParams.get('province');
    const district = searchParams.get('district');
    const searchQuery = searchParams.get('search');
    
    // Build query
    let query: any = {};
    
    // Add filters if provided
    if (status) {
      query.status = status;
    }
    
    if (adminUsername) {
      query.adminUsername = adminUsername;
    }
    
    if (province) {
      query['address.province.ne'] = province;
    }
    
    if (district) {
      query['address.district.ne'] = district;
    }
    
    // Add search functionality
    if (searchQuery) {
      // Escape special characters in the search query to treat them as literals in regex
      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      query.$or = [
        { homestayId: { $regex: escapedQuery, $options: 'i' } },
        { homeStayName: { $regex: escapedQuery, $options: 'i' } },
        { dhsrNo: { $regex: escapedQuery, $options: 'i' } },
        { 'address.villageName': { $regex: escapedQuery, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const homestays = await HomestaySingle.find(query)
      .select('_id homestayId homeStayName homeStayType adminUsername status featureAccess address dhsrNo')
      .limit(limit)
      .skip(skip)
      .lean();
    
    // Count total documents for pagination
    const totalCount = await HomestaySingle.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      homestays,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + homestays.length < totalCount
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching homestays:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to fetch homestays',
      error: (error as Error).message 
    }, { status: 500 });
  }
} 