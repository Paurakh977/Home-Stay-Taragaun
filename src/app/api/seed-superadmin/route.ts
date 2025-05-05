import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';

export async function GET() {
  await dbConnect();

  try {
    // Check if the superadmin already exists
    const existingSuperAdmin = await User.findOne({ username: 'admin', role: 'superadmin' });

    if (existingSuperAdmin) {
      return NextResponse.json({ 
        message: 'Superadmin already exists',
        user: {
          username: existingSuperAdmin.username,
          email: existingSuperAdmin.email,
          contactNumber: existingSuperAdmin.contactNumber || 'Not provided',
          role: existingSuperAdmin.role
        }
      }, { status: 200 });
    }

    // Create the superadmin user
    const superAdmin = new User({
      username: 'admin',
      password: 'admin', // Will be hashed before saving
      email: 'admin@hamrohomestay.com',
      contactNumber: '9800000000', // 10-digit contact number
      role: 'superadmin',
    });

    // Save the superadmin user
    await superAdmin.save();

    return NextResponse.json({ 
      message: 'Superadmin created successfully',
      user: {
        username: superAdmin.username,
        email: superAdmin.email,
        contactNumber: superAdmin.contactNumber,
        role: superAdmin.role
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error seeding superadmin:', error);
    
    // Check if it's a duplicate key error
    if ((error as any).code === 11000) {
      return NextResponse.json({ 
        message: 'Username \'admin\' already exists, possibly with a different role.' 
      }, { status: 409 });
    }
    
    // Generic error response
    return NextResponse.json({ 
      message: 'Internal Server Error', 
      error: (error as Error).message 
    }, { status: 500 });
  }
} 