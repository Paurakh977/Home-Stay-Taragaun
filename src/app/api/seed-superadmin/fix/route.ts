import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';
import mongoose from 'mongoose';

// This is a specialized fix endpoint to update the existing superadmin with missing fields
export async function GET() {
  await dbConnect();

  try {
    console.log('Running superadmin fix script');
    
    // Find the existing superadmin
    const existingSuperAdmin = await User.findOne({ username: 'admin', role: 'superadmin' });

    // Check if superadmin exists
    if (!existingSuperAdmin) {
      console.log('Superadmin not found, cannot fix');
      return NextResponse.json({ message: 'Superadmin not found' }, { status: 404 });
    }

    console.log('Found superadmin with ID:', existingSuperAdmin._id);
    console.log('Current fields:', {
      username: existingSuperAdmin.username,
      email: existingSuperAdmin.email || 'MISSING',
      contactNumber: existingSuperAdmin.contactNumber || 'MISSING',
      role: existingSuperAdmin.role
    });

    // Update fields if they're missing
    const updateData: any = {};
    
    if (!existingSuperAdmin.email) {
      updateData.email = 'admin@hamrohomestay.com';
    }
    
    if (!existingSuperAdmin.contactNumber) {
      updateData.contactNumber = '9800000000';
    }
    
    // Check if any updates are needed
    if (Object.keys(updateData).length === 0) {
      console.log('No updates needed, superadmin already has all required fields');
      return NextResponse.json({ 
        message: 'Superadmin already has all required fields',
        user: {
          username: existingSuperAdmin.username,
          email: existingSuperAdmin.email,
          contactNumber: existingSuperAdmin.contactNumber,
          role: existingSuperAdmin.role
        }
      }, { status: 200 });
    }
    
    console.log('Updating superadmin with:', updateData);
    
    // Update the superadmin
    const updatedSuperAdmin = await User.findByIdAndUpdate(
      existingSuperAdmin._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    console.log('Superadmin updated successfully:', {
      username: updatedSuperAdmin.username,
      email: updatedSuperAdmin.email,
      contactNumber: updatedSuperAdmin.contactNumber,
      role: updatedSuperAdmin.role
    });

    return NextResponse.json({ 
      message: 'Superadmin fixed successfully',
      user: {
        username: updatedSuperAdmin.username,
        email: updatedSuperAdmin.email,
        contactNumber: updatedSuperAdmin.contactNumber,
        role: updatedSuperAdmin.role
      },
      updated: Object.keys(updateData)
    }, { status: 200 });

  } catch (error) {
    console.error('Error fixing superadmin:', error);
    return NextResponse.json({ 
      message: 'Failed to fix superadmin', 
      error: (error as Error).message 
    }, { status: 500 });
  }
} 