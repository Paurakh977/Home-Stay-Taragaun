import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';
import jwt, { Secret } from 'jsonwebtoken';
// import { cookies } from 'next/headers'; // Not needed for setting/deleting in response

// Ensure you have a JWT_SECRET environment variable defined
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable in .env.local');
}

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await (user as any).comparePassword(password);

    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    if (user.role !== 'superadmin') {
        return NextResponse.json({ message: 'Access denied: Not a superadmin' }, { status: 403 });
    }

    const payload = {
      id: user._id,
      username: user.username,
      role: user.role,
    };

    // Explicitly use JWT_SECRET as Secret type
    const token = jwt.sign(payload, JWT_SECRET as Secret, {
      expiresIn: '1d',
    });

    // Set HttpOnly cookie
    const response = NextResponse.json({ message: 'Login successful' }, { status: 200 });
    response.cookies.set('superadmin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;

  } catch (error) {
    console.error('Superadmin login error:', error);
    // Create a response and clear the cookie by setting expiry to the past
    const errorResponse = NextResponse.json({ message: 'Internal Server Error', error: (error as Error).message }, { status: 500 });
    errorResponse.cookies.set('superadmin_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        expires: new Date(0), // Set expiry date to the past
    });
    return errorResponse;
  }
} 