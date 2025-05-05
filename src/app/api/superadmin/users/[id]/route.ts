import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET handler to fetch a specific user by ID
export async function GET(request: Request, { params }: RouteParams) {
  await dbConnect();

  try {
    const id = params.id;
    console.log('Fetching user with ID:', id);

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid user ID format:', id);
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    // Find the user
    const user = await User.findById(id).select('-password');
    console.log('User found:', user ? 'Yes' : 'No');

    // Check if user exists
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Return the user data
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch user', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

// PATCH handler to update a user by ID
export async function PATCH(request: Request, { params }: RouteParams) {
  await dbConnect();

  try {
    const id = params.id;
    console.log('Updating user with ID:', id);
    const updateData = await request.json();
    console.log('Update data received:', updateData);

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid user ID format:', id);
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    // Exclude fields that shouldn't be updated directly
    const { password, ...allowedUpdates } = updateData;

    // Validate contact number if provided
    if (allowedUpdates.contactNumber) {
      const contactNumberRegex = /^\d{10}$/;
      if (!contactNumberRegex.test(allowedUpdates.contactNumber)) {
        console.error('Invalid contact number format:', allowedUpdates.contactNumber);
        return NextResponse.json({ 
          message: 'Contact number must be exactly 10 digits',
          received: allowedUpdates.contactNumber
        }, { status: 400 });
      }
    }

    // Validate role if provided
    if (allowedUpdates.role && !['superadmin', 'admin', 'officer'].includes(allowedUpdates.role)) {
      console.error('Invalid role specified:', allowedUpdates.role);
      return NextResponse.json({ 
        message: 'Invalid role specified. Must be \'superadmin\', \'admin\', or \'officer\'.' 
      }, { status: 400 });
    }

    // Special case: handle password update separately with proper hashing
    if (password) {
      console.log('Updating password with proper hashing');
      // Generate salt and hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      // Update with hashed password
      await User.findByIdAndUpdate(id, { password: hashedPassword });
    }

    console.log('Allowed updates:', allowedUpdates);

    // Find and update the user with the allowed fields
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select('-password');

    // Check if user exists
    if (!updatedUser) {
      console.error('User not found for update');
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    console.log('User updated successfully:', updatedUser);
    return NextResponse.json({ 
      message: 'User updated successfully', 
      user: updatedUser 
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    
    // Handle validation errors
    if ((error as any).name === 'ValidationError') {
      return NextResponse.json({ 
        message: 'Validation Error', 
        errors: (error as any).errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      message: 'Failed to update user', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

// DELETE handler to remove a user by ID
export async function DELETE(request: Request, { params }: RouteParams) {
  await dbConnect();

  try {
    const id = params.id;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(id);

    // Check if user existed
    if (!deletedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'User deleted successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ 
      message: 'Failed to delete user', 
      error: (error as Error).message 
    }, { status: 500 });
  }
} 