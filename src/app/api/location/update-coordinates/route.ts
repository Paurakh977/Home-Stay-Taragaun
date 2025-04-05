import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import Location from '@/lib/models/Location';
import mongoose from 'mongoose';

// Define interface for location document
interface LocationDocument extends mongoose.Document {
  homestayId: string;
  location: {
    type: string;
    coordinates: number[] | null;
  };
  isVerified: boolean;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Parse request body
    const body = await request.json();
    const { homestayId, longitude, latitude } = body;
    
    // Validate required fields
    if (!homestayId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: homestayId'
      }, { status: 400 });
    }
    
    if (longitude === undefined || latitude === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: longitude and latitude'
      }, { status: 400 });
    }
    
    // Validate coordinates
    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    
    if (isNaN(lng) || isNaN(lat)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid coordinates format. Longitude and latitude must be valid numbers.'
      }, { status: 400 });
    }
    
    // Validate longitude range (-180 to 180)
    if (lng < -180 || lng > 180) {
      return NextResponse.json({
        success: false,
        error: 'Invalid longitude. Must be between -180 and 180.'
      }, { status: 400 });
    }
    
    // Validate latitude range (-90 to 90)
    if (lat < -90 || lat > 90) {
      return NextResponse.json({
        success: false,
        error: 'Invalid latitude. Must be between -90 and 90.'
      }, { status: 400 });
    }
    
    // Find location by homestayId
    const location = await Location.findOne({ homestayId });
    
    if (!location) {
      return NextResponse.json({
        success: false,
        error: 'Location not found for this homestay ID'
      }, { status: 404 });
    }
    
    // Update coordinates and set verified flag
    await Location.findOneAndUpdate(
      { homestayId },
      { 
        $set: {
          'location.type': 'Point',
          'location.coordinates': [lng, lat],
          isVerified: true
        }
      }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Coordinates updated successfully',
      data: {
        homestayId,
        coordinates: {
          longitude: lng,
          latitude: lat
        }
      }
    });
    
  } catch (error) {
    console.error('Error updating coordinates:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update coordinates',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}