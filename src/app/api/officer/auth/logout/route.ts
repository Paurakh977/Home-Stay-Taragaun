import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('API: Officer logout endpoint called');

    // Get cookie store
    const cookieStore = await cookies();
    
    // Check if the officer token exists
    const hasOfficerToken = cookieStore.has('officer_token');
    
    console.log('API: Officer token exists:', hasOfficerToken);
    
    // Create a response object
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' }
    );
    
    // Clear the officer token cookie
    response.cookies.set({
      name: 'officer_token',
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0, // Expire immediately
    });
    
    // Also clear auth_token as a safety measure
    if (cookieStore.has('auth_token')) {
      console.log('API: Also clearing auth_token cookie');
      response.cookies.set({
        name: 'auth_token',
        value: '',
        httpOnly: true,
        path: '/',
        maxAge: 0,
      });
    }
    
    console.log('API: Officer logout completed successfully');
    return response;
  } catch (error) {
    console.error('API: Error during officer logout:', error);
    return NextResponse.json(
      { success: false, message: 'Error during logout' },
      { status: 500 }
    );
  }
} 