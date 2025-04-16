import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import HomestaySingle from '@/lib/models/HomestaySingle';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * API Route for location-based homestay search
 * This endpoint helps search engines index location-specific content
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Get search parameters from URL
    const searchParams = req.nextUrl.searchParams;
    const province = searchParams.get('province');
    const district = searchParams.get('district');
    const municipality = searchParams.get('municipality');
    const city = searchParams.get('city');
    const limit = Number(searchParams.get('limit') || '24');
    
    // Build the query based on provided parameters
    const query: any = { status: 'approved' };
    
    if (province) {
      query['address.province.en'] = { $regex: new RegExp(province, 'i') };
    }
    
    if (district) {
      query['address.district.en'] = { $regex: new RegExp(district, 'i') };
    }
    
    if (municipality) {
      query['address.municipality.en'] = { $regex: new RegExp(municipality, 'i') };
    }
    
    if (city) {
      query['address.city'] = { $regex: new RegExp(city, 'i') };
    }
    
    // Fetch homestays matching the criteria
    const homestays = await HomestaySingle.find(query)
      .select('homestayId homeStayName address profileImage averageRating homeCount bedCount adminUsername status')
      .sort({ averageRating: -1 })
      .limit(limit)
      .lean();
    
    // Format results with SEO-friendly descriptions
    const formattedResults = homestays.map((homestay: any) => {
      const location = `${homestay.address.municipality.en}, ${homestay.address.district.en}, ${homestay.address.province.en}`;
      
      return {
        id: homestay.homestayId,
        name: homestay.homeStayName,
        location: location,
        address: homestay.address.formattedAddress.en,
        rating: homestay.averageRating,
        homeCount: homestay.homeCount,
        bedCount: homestay.bedCount,
        profileImage: homestay.profileImage,
        adminUsername: homestay.adminUsername,
        url: homestay.adminUsername 
          ? `/${homestay.adminUsername}/homestays/${homestay.homestayId}`
          : `/homestays/${homestay.homestayId}`,
        description: `${homestay.homeStayName} is a beautiful homestay in ${location}. It features ${homestay.homeCount} homes and ${homestay.bedCount} beds, perfect for travelers exploring Nepal.`
      };
    });
    
    // Construct response with location-specific metadata
    const response = {
      results: formattedResults,
      metadata: {
        location: {
          province: province || 'All Provinces',
          district: district || 'All Districts',
          municipality: municipality || 'All Municipalities',
          city: city || 'All Cities',
          country: 'Nepal'
        },
        resultCount: formattedResults.length,
        description: generateSearchDescription(province, district, municipality, city)
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in location search API:', error);
    return NextResponse.json(
      { error: 'Failed to search homestays by location' },
      { status: 500 }
    );
  }
}

/**
 * Generates SEO-friendly descriptions for search results
 */
function generateSearchDescription(
  province?: string | null, 
  district?: string | null, 
  municipality?: string | null,
  city?: string | null
): string {
  let locationPhrase = '';
  
  if (city) {
    locationPhrase = `in ${city}`;
  } else if (municipality) {
    locationPhrase = `in ${municipality}`;
  } else if (district) {
    locationPhrase = `in ${district} district`;
  } else if (province) {
    locationPhrase = `in ${province} province`;
  } else {
    locationPhrase = 'across Nepal';
  }
  
  return `Discover authentic homestay experiences ${locationPhrase}. Our carefully selected homestays offer comfortable accommodations with real Nepali hospitality, local cuisine, and cultural experiences.`;
} 