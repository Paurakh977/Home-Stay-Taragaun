import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import Location from '@/lib/models/Location';
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
    coordinates: number[] | null;
  };
  isVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const homestayId = searchParams.get('homestayId');
    const lang = searchParams.get('lang') || 'ne'; // Default to Nepali
    
    // Validate homestayId
    if (!homestayId) {
      return NextResponse.json({
        success: false,
        error: 'Missing homestayId parameter'
      }, { status: 400 });
    }
    
    // Find location data for this homestay
    const locationData = await Location.findOne({ homestayId }).lean();
    
    if (!locationData) {
      return NextResponse.json({
        success: false,
        error: 'Location not found for the specified homestay'
      }, { status: 404 });
    }
    
    // Use a type assertion to unknown first, then to our interface to make TypeScript happy
    const location = locationData as unknown as LocationDocument;
    
    // Check if we have the new bilingual format or old format
    const hasBilingualFormat = 
      location.province && 
      typeof location.province === 'object' && 
      'en' in location.province && 
      'ne' in location.province;
    
    // Format response based on data structure and language preference
    let response;
    
    if (hasBilingualFormat) {
      // New bilingual format - TypeScript now understands province is a BilingualField
      const provinceBilingual = location.province as BilingualField;
      const districtBilingual = location.district as BilingualField;
      const municipalityBilingual = location.municipality as BilingualField;
      const wardBilingual = location.ward as BilingualField;
      const formattedAddressBilingual = location.formattedAddress as BilingualField;
      
      response = {
        homestayId: location.homestayId,
        province: lang === 'en' ? provinceBilingual.en : provinceBilingual.ne,
        district: lang === 'en' ? districtBilingual.en : districtBilingual.ne,
        municipality: lang === 'en' ? municipalityBilingual.en : municipalityBilingual.ne,
        ward: lang === 'en' ? wardBilingual.en : wardBilingual.ne,
        city: location.city,
        tole: location.tole,
        formattedAddress: lang === 'en' ? formattedAddressBilingual.en : formattedAddressBilingual.ne,
        
        // Also include both languages for full access
        translations: {
          province: provinceBilingual,
          district: districtBilingual,
          municipality: municipalityBilingual,
          ward: wardBilingual,
          formattedAddress: formattedAddressBilingual
        },
        
        // Include coordinates if available
        coordinates: location.location.coordinates && location.location.coordinates[0] !== null
          ? {
              longitude: location.location.coordinates[0],
              latitude: location.location.coordinates[1],
              isVerified: !!location.isVerified
            }
          : null
      };
    } else {
      // Old format - backward compatibility
      response = {
        homestayId: location.homestayId,
        province: location.province as string,
        district: location.district as string,
        municipality: location.municipality as string,
        ward: location.ward as string,
        city: location.city,
        tole: location.tole,
        formattedAddress: location.formattedAddress as string,
        
        // Include coordinates if available
        coordinates: location.location.coordinates && location.location.coordinates[0] !== null
          ? {
              longitude: location.location.coordinates[0],
              latitude: location.location.coordinates[1],
              isVerified: !!location.isVerified
            }
          : null
      };
    }
    
    return NextResponse.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('Error retrieving location data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve location data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}