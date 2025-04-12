import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    });
    
    // Clear the auth cookie by setting expiry to past date
    response.cookies.set({
      name: 'auth_token',
      value: '',
      expires: new Date(0),
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Error during logout' },
      { status: 500 }
    );
  }
} 