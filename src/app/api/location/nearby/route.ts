import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import Location from '@/lib/models/Location';
import HomestaySingle from '@/lib/models/HomestaySingle';
import mongoose from 'mongoose';

// Define interfaces for type safety
interface BilingualField {
  en: string;
  ne: string;
}

interface LocationDocument {
  _id: mongoose.Types.ObjectId;
  homestayId: string;
  province: string | BilingualField;
  district: string | BilingualField;
  municipality: string | BilingualField;
  ward: string | BilingualField;
  city: string;
  tole: string;
  formattedAddress: string | BilingualField;
  location: {
    type: string;
    coordinates: number[];
  };
  isVerified?: boolean;
}

interface HomestayDocument {
  _id: mongoose.Types.ObjectId;
  homestayId: string;
  homeStayName: string;
  villageName: string;
  homeStayType: string;
  averageRating: number;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const longitude = parseFloat(searchParams.get('longitude') || '');
    const latitude = parseFloat(searchParams.get('latitude') || '');
    const radius = parseInt(searchParams.get('radius') || '5000'); // Default to 5km
    const lang = searchParams.get('lang') || 'ne'; // Default to Nepali
    
    // Validate coordinates
    if (isNaN(longitude) || isNaN(latitude)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid coordinates provided. Both longitude and latitude are required.'
      }, { status: 400 });
    }
    
    // Validate radius (min 100m, max 50km)
    const validatedRadius = Math.min(Math.max(radius, 100), 50000);
    
    // Convert radius from meters to radians (for MongoDB $geoWithin)
    const radiusInRadians = validatedRadius / 6378100;
    
    // Find locations with coordinates near the specified point
    const locationsData = await Location.find({
      location: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInRadians]
        }
      },
      isVerified: true
    }).lean();
    
    if (!locationsData || locationsData.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No homestays found in the specified radius',
        data: [],
        meta: {
          total: 0,
          radius: validatedRadius,
          coordinates: [longitude, latitude]
        }
      });
    }
    
    // Cast to our LocationDocument type
    const locations = locationsData as unknown as LocationDocument[];
    
    // Get homestay IDs from the locations
    const homestayIds = locations.map(location => location.homestayId);
    
    // Find approved homestays with these IDs
    const homestaysData = await HomestaySingle.find({
      homestayId: { $in: homestayIds },
      status: 'approved'
    }).select('homestayId homeStayName villageName homeStayType averageRating').lean();
    
    // Cast to our HomestayDocument type
    const homestays = homestaysData as unknown as HomestayDocument[];
    
    // Map homestays with their location data and distance
    const result = homestays.map(homestay => {
      const location = locations.find(loc => loc.homestayId === homestay.homestayId);
      
      if (!location || !location.location.coordinates || location.location.coordinates.length < 2) {
        return null; // Skip this homestay if location data is incomplete
      }
      
      // Calculate distance in meters
      const [homeLng, homeLat] = location.location.coordinates;
      const distance = calculateDistance(latitude, longitude, homeLat, homeLng);
      
      // Check if we have bilingual fields and get the right language version
      const hasBilingualFormat = 
        location.province && 
        typeof location.province === 'object' && 
        'en' in location.province;
      
      let province, district, formattedAddress;
      
      if (hasBilingualFormat) {
        // Bilingual format
        province = lang === 'en' 
          ? (location.province as BilingualField).en 
          : (location.province as BilingualField).ne;
          
        district = lang === 'en'
          ? (location.district as BilingualField).en
          : (location.district as BilingualField).ne;
          
        formattedAddress = lang === 'en' 
          ? (location.formattedAddress as BilingualField).en 
          : (location.formattedAddress as BilingualField).ne;
      } else {
        // Old format
        province = location.province as string;
        district = location.district as string;
        formattedAddress = location.formattedAddress as string;
      }
      
      return {
        ...homestay,
        location: {
          coordinates: location.location.coordinates,
          formattedAddress,
          province,
          district,
          city: location.city,
          tole: location.tole
        },
        distance: {
          meters: Math.round(distance),
          kilometers: (distance / 1000).toFixed(1)
        }
      };
    }).filter(Boolean); // Remove any null results
    
    // Sort by distance
    result.sort((a: any, b: any) => a.distance.meters - b.distance.meters);
    
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        total: result.length,
        radius: validatedRadius,
        coordinates: [longitude, latitude]
      }
    });
    
  } catch (error) {
    console.error('Error finding nearby homestays:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to search for nearby homestays',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Function to calculate distance between two points in meters (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}