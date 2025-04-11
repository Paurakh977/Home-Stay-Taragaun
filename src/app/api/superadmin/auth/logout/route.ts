import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Create a response object
    const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 });

    // Set the cookie with an expiry date in the past to clear it
    response.cookies.set('superadmin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(0), // Expire immediately
    });

    return response;

  } catch (error) {
    console.error('Superadmin logout error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 