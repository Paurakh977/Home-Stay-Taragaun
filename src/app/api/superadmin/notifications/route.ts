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

// GET - Fetch unreviewed custom field updates as notifications
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Find all homestays with unreviewed custom field updates
    const homestays = await HomestaySingle.find({
      'customFields.values.lastUpdated': { $exists: true },
      'customFields.values.reviewed': { $ne: true }
    }).select('homestayId homeStayName adminUsername customFields.values.lastUpdated');
    
    // Format the notifications
    const notifications = homestays.map(homestay => ({
      homestayId: homestay.homestayId,
      homeStayName: homestay.homeStayName,
      adminUsername: homestay.adminUsername || 'Unknown',
      lastUpdated: homestay.customFields?.values?.lastUpdated || new Date().toISOString(),
      message: 'Custom field information has been updated'
    }));
    
    return NextResponse.json({
      notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST - Mark notifications as reviewed (batch operation)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { homestayIds, reviewerUsername } = await request.json();
    
    if (!homestayIds || !Array.isArray(homestayIds) || homestayIds.length === 0) {
      return NextResponse.json({ error: 'At least one homestay ID is required' }, { status: 400 });
    }
    
    const now = new Date().toISOString();
    
    // Mark the custom field values as reviewed for all specified homestays
    const updateResult = await HomestaySingle.updateMany(
      { homestayId: { $in: homestayIds } },
      { 
        $set: {
          'customFields.values.reviewed': true,
          'customFields.values.reviewedBy': reviewerUsername || 'superadmin',
          'customFields.values.reviewedAt': now
        }
      }
    ) as unknown as UpdateResult;
    
    return NextResponse.json({
      success: true,
      message: `Marked ${updateResult.modifiedCount || 0} notifications as reviewed`,
      reviewedAt: now,
      reviewedBy: reviewerUsername || 'superadmin',
      matchedCount: updateResult.matchedCount || 0,
      modifiedCount: updateResult.modifiedCount || 0
    });
  } catch (error) {
    console.error('Error marking notifications as reviewed:', error);
    return NextResponse.json({ error: 'Failed to mark notifications as reviewed' }, { status: 500 });
  }
} 