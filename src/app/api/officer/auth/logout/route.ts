import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Create a response object
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' }
    );
    
    // Clear the cookie
    response.cookies.set({
      name: 'officer_token',
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0, // Expire immediately
    });
    
    return response;
  } catch (error) {
    console.error('Error during officer logout:', error);
    return NextResponse.json(
      { success: false, message: 'Error during logout' },
      { status: 500 }
    );
  }
} 