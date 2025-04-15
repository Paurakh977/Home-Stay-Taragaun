import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Location from '@/lib/models/Location';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get distinct districts with their corresponding provinces
    const districts = await Location.aggregate([
      {
        $group: {
          _id: {
            district: "$district",
            province: "$province.en"
          }
        }
      },
      {
        $project: {
          en: "$_id.district.en",
          ne: "$_id.district.ne",
          provinceEn: "$_id.province",
          _id: 0
        }
      },
      { $sort: { "en": 1 } }
    ]);
    
    return NextResponse.json({
      success: true,
      districts
    });
  } catch (error) {
    console.error('Error fetching districts:', error);
    return NextResponse.json({ error: 'Failed to fetch districts' }, { status: 500 });
  }
} 