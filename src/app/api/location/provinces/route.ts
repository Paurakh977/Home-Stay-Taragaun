import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Location from '@/lib/models/Location';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get distinct provinces from the locations collection
    const provinces = await Location.aggregate([
      { $group: { _id: "$province" } },
      { $project: { 
        en: "$_id.en", 
        ne: "$_id.ne",
        _id: 0 
      }},
      { $sort: { "en": 1 } }
    ]);
    
    return NextResponse.json({
      success: true,
      provinces
    });
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return NextResponse.json({ error: 'Failed to fetch provinces' }, { status: 500 });
  }
} 