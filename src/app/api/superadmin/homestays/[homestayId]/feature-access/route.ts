import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { HomestaySingle } from '@/lib/models';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    homestayId: string;
  };
}

// PATCH handler to update homestay feature access
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    // Connect to database
    await dbConnect();
    
    const homestayId = params.homestayId;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(homestayId)) {
      return NextResponse.json({ message: 'Invalid homestay ID format' }, { status: 400 });
    }
    
    // Parse request body
    const { featureAccess } = await request.json();
    
    // Validate featureAccess object
    if (!featureAccess || typeof featureAccess !== 'object') {
      return NextResponse.json({ 
        message: 'Invalid feature access format' 
      }, { status: 400 });
    }
    
    // Update only the featureAccess field
    const updatedHomestay = await HomestaySingle.findByIdAndUpdate(
      homestayId,
      { $set: { featureAccess } },
      { new: true, runValidators: true }
    ).select('homestayId homeStayName featureAccess');
    
    // Check if homestay exists
    if (!updatedHomestay) {
      return NextResponse.json({ message: 'Homestay not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'Homestay feature access updated successfully', 
      homestay: updatedHomestay.homestayId,
      name: updatedHomestay.homeStayName,
      featureAccess: updatedHomestay.featureAccess 
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating homestay feature access:', error);
    return NextResponse.json({ 
      message: 'Failed to update homestay feature access', 
      error: (error as Error).message 
    }, { status: 500 });
  }
} 