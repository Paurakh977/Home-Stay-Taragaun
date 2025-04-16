import { NextResponse } from 'next/server';
// Correcting import path to mongodb.ts
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';
// We will add middleware later to verify the JWT and check the role

// GET handler to fetch all users
export async function GET() {
  await dbConnect();

  try {
    // Find all users and sort by creation date (newest first)
    const users = await User.find({})
      .select('-password') // Exclude the password field
      .sort({ createdAt: -1 });

    // Return the users as JSON
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch users', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Middleware now handles auth check
  await dbConnect();

  try {
    const requestBody = await request.json();
    const { username, password, email, contactNumber, role, branding } = requestBody;
    
    // Log the received data for debugging (remove in production)
    console.log('Received user data:', { 
      username, 
      email, 
      contactNumber: contactNumber || 'MISSING',
      role,
      hasBranding: !!branding
    });

    // Improved validation
    if (!username) {
      return NextResponse.json({ message: 'Username is required' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ message: 'Password is required' }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }
    if (!contactNumber) {
      return NextResponse.json({ message: 'Contact number is required' }, { status: 400 });
    }
    if (!role) {
      return NextResponse.json({ message: 'Role is required' }, { status: 400 });
    }

    // Validate role-specific fields
    if (role === 'admin' && !branding) {
      return NextResponse.json({ message: 'Branding data is required for admin users' }, { status: 400 });
    }

    // Validate contact number (must be 10 digits)
    const contactNumberRegex = /^\d{10}$/;
    if (!contactNumberRegex.test(contactNumber)) {
      return NextResponse.json({ 
        message: 'Contact number must be exactly 10 digits', 
        received: contactNumber
      }, { status: 400 });
    }

    // Validate role (ensure it's one of the allowed values)
    if (!['superadmin', 'admin', 'officer'].includes(role)) {
      return NextResponse.json({ 
        message: 'Invalid role specified. Must be \'superadmin\', \'admin\', or \'officer\'.' 
      }, { status: 400 });
    }

    // Check if user already exists (by username or email)
    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });
    
    if (existingUser) {
      if (existingUser.username.toLowerCase() === username.toLowerCase()) {
        return NextResponse.json({ message: 'Username already exists' }, { status: 409 }); // Conflict
      } else {
        return NextResponse.json({ message: 'Email already exists' }, { status: 409 }); // Conflict
      }
    }

    // Create the user document with all fields explicitly defined
    const userDoc: any = {
      username: username.toLowerCase(),
      password: password,
      email: email.toLowerCase(),
      contactNumber: contactNumber.toString().trim(), // Ensure it's a string and trimmed
      role: role,
      permissions: {
        adminDashboardAccess: false,
        homestayApproval: false,
        homestayEdit: false,
        homestayDelete: false,
        documentUpload: false,
        imageUpload: false
      }
    };

    // Add branding data for admin users
    if (role === 'admin' && branding) {
      userDoc.branding = branding;
    }

    // Log the document being saved
    console.log('Creating user with data:', { 
      ...userDoc, 
      password: '[REDACTED]',
      branding: userDoc.branding ? 'PRESENT' : 'MISSING'
    });

    // Create the new user (password will be hashed by the pre-save hook)
    const newUser = new User(userDoc);
    
    // Save with error checking
    const savedUser = await newUser.save();
    
    // Verify the saved user has all fields
    console.log('User saved successfully with ID:', savedUser._id);
    console.log('Saved user contact:', savedUser.contactNumber);

    // Avoid sending the password back, even though it's hashed
    const userResponse = {
      _id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      contactNumber: savedUser.contactNumber,
      role: savedUser.role,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt
    };

    return NextResponse.json({ 
      message: 'User created successfully', 
      user: userResponse 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle potential validation errors from Mongoose
    if ((error as any).name === 'ValidationError') {
      const validationErrors = (error as any).errors;
      console.error('Validation errors:', validationErrors);
      
      return NextResponse.json({ 
        message: 'Validation Error', 
        errors: validationErrors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      message: 'Internal Server Error', 
      error: (error as Error).message 
    }, { status: 500 });
  }
} 