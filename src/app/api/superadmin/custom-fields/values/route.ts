import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import HomestaySingle from '@/lib/models/HomestaySingle';
import mongoose from 'mongoose';

// Proper interface for UpdateResult
interface UpdateResult {
  acknowledged: boolean;
  matchedCount: number;
  modifiedCount: number;
  upsertedCount: number;
  upsertedId: mongoose.Types.ObjectId | null;
}

// GET - Fetch custom field values for a specific homestay
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    
    const homestayId = searchParams.get('homestayId');
    
    if (!homestayId) {
      return NextResponse.json({ error: 'Homestay ID is required' }, { status: 400 });
    }
    
    const homestay = await HomestaySingle.findOne({ homestayId })
      .select('customFields.definitions customFields.values');
    
    if (!homestay) {
      return NextResponse.json({ error: 'Homestay not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      customFields: homestay.customFields || { definitions: [], values: {} }
    });
  } catch (error) {
    console.error('Error fetching custom field values:', error);
    return NextResponse.json({ error: 'Failed to fetch custom field values' }, { status: 500 });
  }
}

// PATCH - Update custom field values for a specific homestay
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    const { homestayId, fieldId, value } = await request.json();
    
    if (!homestayId || !fieldId) {
      return NextResponse.json(
        { error: 'Homestay ID and Field ID are required' },
        { status: 400 }
      );
    }
    
    // Update the field value
    const updateResult = await HomestaySingle.updateOne(
      { homestayId },
      { $set: { [`customFields.values.${fieldId}`]: value } }
    ) as unknown as UpdateResult;
    
    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Homestay not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('Error updating custom field value:', error);
    return NextResponse.json(
      { error: 'Failed to update custom field value' },
      { status: 500 }
    );
  }
}

// POST - Mark values as reviewed
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { homestayId, reviewedBy } = await request.json();
    
    if (!homestayId) {
      return NextResponse.json(
        { error: 'Homestay ID is required' },
        { status: 400 }
      );
    }
    
    // Mark all values as reviewed
    const updateResult = await HomestaySingle.updateOne(
      { homestayId },
      { 
        $set: { 
          'customFields.lastReviewed': {
            date: new Date().toISOString(),
            by: reviewedBy || 'system'
          }
        } 
      }
    ) as unknown as UpdateResult;
    
    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Homestay not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('Error marking custom field values as reviewed:', error);
    return NextResponse.json(
      { error: 'Failed to mark values as reviewed' },
      { status: 500 }
    );
  }
} 