import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET handler to fetch a user's permissions by ID
export async function GET(request: Request, { params }: RouteParams) {
  await dbConnect();

  try {
    const id = params.id;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    // Find the user
    const user = await User.findById(id).select('permissions role username');
    
    // Check if user exists
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Return the permissions data
    return NextResponse.json({ 
      user: user.username,
      role: user.role,
      permissions: user.permissions || {} 
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch user permissions', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

// PATCH handler to update user permissions
export async function PATCH(request: Request, { params }: RouteParams) {
  await dbConnect();

  try {
    const id = params.id;
    const { permissions } = await request.json();
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    // Validate permissions object
    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json({ 
        message: 'Invalid permissions format' 
      }, { status: 400 });
    }

    // Update only the permissions field
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { permissions } },
      { new: true, runValidators: true }
    ).select('username role permissions');

    // Check if user exists
    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'User permissions updated successfully', 
      user: updatedUser.username,
      role: updatedUser.role,
      permissions: updatedUser.permissions 
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    return NextResponse.json({ 
      message: 'Failed to update user permissions', 
      error: (error as Error).message 
    }, { status: 500 });
  }
} 