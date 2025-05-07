import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import HomestaySingle from '@/lib/models/HomestaySingle';
import Official from '@/lib/models/Official';
import Contact from '@/lib/models/Contact';
import Location from '@/lib/models/Location';
import mongoose from 'mongoose';
import { hashPassword } from '@/lib/utils';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

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

// --- DELETE Handler for Completely Removing a Homestay ---
export async function DELETE(request: Request, context: ParamsContext) {
  try {
    const params = await context.params;
    const { homestayId } = params;

    if (!homestayId) {
      return NextResponse.json({ success: false, error: 'Homestay ID is required' }, { status: 400 });
    }

    await dbConnect();

    // First, fetch the homestay to get admin username for file paths
    const homestay = await HomestaySingle.findOne({ homestayId }).lean();
    
    if (!homestay) {
      return NextResponse.json({ success: false, error: 'Homestay not found' }, { status: 404 });
    }

    const adminUsername = homestay.adminUsername;
    
    // Delete records from all related collections - without transactions
    try {
      const deletionResults = await Promise.allSettled([
        // Delete the homestay itself
        HomestaySingle.deleteOne({ homestayId }),
        
        // Delete all officials associated with this homestay
        Official.deleteMany({ homestayId }),
        
        // Delete all contacts associated with this homestay
        Contact.deleteMany({ homestayId }),
        
        // Delete the homestay location
        Location.deleteOne({ homestayId }),
        
        // Delete any custom fields (if you have a separate collection)
        // If you don't have a separate collection, this won't do anything
        mongoose.models.CustomField?.deleteMany({ homestayId }) || Promise.resolve(),
      ]);
      
      console.log(`Deleted homestay ${homestayId} and related data from database`);
      console.log('Deletion results:', deletionResults);
      
      // Check if any operations failed
      const failedOperations = deletionResults.filter(result => result.status === 'rejected');
      if (failedOperations.length > 0) {
        console.error('Some deletion operations failed:', failedOperations);
      }
    } catch (dbError) {
      console.error(`Database error while deleting homestay:`, dbError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete homestay from database',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }
    
    // Now delete the associated files
    try {
      // Define possible upload paths
      const paths = [
        // Path with admin username (primary path)
        path.join(process.cwd(), 'public', 'uploads', adminUsername, homestayId),
        // Direct path without admin username (fallback)
        path.join(process.cwd(), 'public', 'uploads', homestayId)
      ];
      
      // Track which paths were found and deleted
      const deletedPaths = [];
      
      // Try to delete directories if they exist
      for (const dirPath of paths) {
        if (fs.existsSync(dirPath)) {
          await fsPromises.rm(dirPath, { recursive: true, force: true });
          deletedPaths.push(dirPath);
          console.log(`Deleted directory: ${dirPath}`);
        }
      }
      
      if (deletedPaths.length === 0) {
        console.log(`No upload directories found for homestayId: ${homestayId}`);
      }
      
    } catch (fileError) {
      // Log file deletion errors but don't fail the request since DB is already updated
      console.error('Error deleting homestay files:', fileError);
      return NextResponse.json({ 
        success: true, 
        message: 'Homestay deleted from database, but some files may remain',
        details: fileError instanceof Error ? fileError.message : 'Unknown file error'
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Homestay and all associated data deleted successfully' 
    });

  } catch (error) {
    console.error(`Error deleting homestay:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Failed to delete homestay', details: errorMessage },
      { status: 500 }
    );
  }
} 