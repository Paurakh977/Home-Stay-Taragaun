import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import HomestaySingle from '@/lib/models/HomestaySingle';
import Official from '@/lib/models/Official';
import Contact from '@/lib/models/Contact';
import Location from '@/lib/models/Location';
import mongoose from 'mongoose';
import { hashPassword } from '@/lib/utils';

// Ensure this route is treated as dynamic
export const dynamic = 'force-dynamic';

// Updated interface to clarify params structure if needed, though often inferred
interface ParamsContext { 
  params: { homestayId: string };
}

// --- GET Handler --- 
export async function GET(request: Request, context: ParamsContext) {
  try {
    const params = await context.params;
    const { homestayId } = params;

    if (!homestayId) {
      return NextResponse.json({ success: false, error: 'Homestay ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Fetch the complete homestay document with all related data
    const [homestay, officials, contacts, location] = await Promise.all([
      HomestaySingle.findOne({ homestayId }).lean(),
      Official.find({ homestayId }).lean(),
      Contact.find({ homestayId }).lean(),
      Location.findOne({ homestayId }).lean()
    ]);

    if (!homestay) {
      return NextResponse.json({ success: false, error: 'Homestay not found' }, { status: 404 });
    }

    // Combine all data into a single response
    const responseData = {
      ...homestay,
      officials,
      contacts,
      location
    };

    return NextResponse.json({ success: true, data: responseData });

  } catch (error) {
    console.error(`Error fetching homestay for admin:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Failed to fetch homestay details', details: errorMessage },
      { status: 500 }
    );
  }
}

// --- PATCH Handler for Updating Status ---
export async function PATCH(request: Request, context: ParamsContext) {
  try {
    const params = await context.params;
    const { homestayId } = params;

    if (!homestayId) {
      return NextResponse.json({ success: false, error: 'Homestay ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    // Validate the status value
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value. Must be pending, approved, or rejected.' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the homestay and update its status
    const updatedHomestay = await HomestaySingle.findOneAndUpdate(
      { homestayId },
      { $set: { status: status } },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedHomestay) {
      return NextResponse.json({ success: false, error: 'Homestay not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedHomestay });

  } catch (error) {
    console.error(`Error updating homestay status:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors }, 
        { status: 400 } 
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update homestay status', details: errorMessage },
      { status: 500 }
    );
  }
}

// --- PUT Handler for Resetting Password ---
export async function PUT(request: Request, context: ParamsContext) {
  try {
    const params = await context.params;
    const { homestayId } = params;

    if (!homestayId) {
      return NextResponse.json({ success: false, error: 'Homestay ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { newPassword } = body;

    // Validate the password
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Invalid password. Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Hash the new password
    const hashedPassword = hashPassword(newPassword);

    // Find the homestay and update its password
    const updatedHomestay = await HomestaySingle.findOneAndUpdate(
      { homestayId },
      { $set: { password: hashedPassword } },
      { new: true, runValidators: true }
    ).select('homestayId homeStayName adminUsername');

    if (!updatedHomestay) {
      return NextResponse.json({ success: false, error: 'Homestay not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password updated successfully',
      data: {
        homestayId: updatedHomestay.homestayId,
        homeStayName: updatedHomestay.homeStayName
      }
    });

  } catch (error) {
    console.error(`Error resetting homestay password:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Failed to reset homestay password', details: errorMessage },
      { status: 500 }
    );
  }
} 