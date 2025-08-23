import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
const ENCODED_JWT_SECRET = new TextEncoder().encode(JWT_SECRET);

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 Auth me API called');
    console.log('🔐 Auth me - Request URL:', request.url);
    console.log('🔐 Auth me - Raw cookie header:', request.headers.get('cookie'));
    console.log('🔐 Auth me - All cookies:', request.cookies.getAll());

    // Check for JWT token in cookies (homestay users)
    const authToken = request.cookies.get('auth_token')?.value;
    console.log('🔐 Auth me - JWT token found:', authToken ? 'Yes' : 'No');
    if (authToken) {
      console.log('🔐 Auth me - JWT token preview:', authToken.substring(0, 50) + '...');
    } else {
      console.log('🔐 Auth me - No auth_token cookie found');
      console.log('🔐 Auth me - Available cookies:', request.cookies.getAll().map(c => c.name));
    }

    if (authToken) {
      try {
        const { payload } = await jwtVerify(authToken, ENCODED_JWT_SECRET);
        const homestayId = (payload as any).homestayId;
        console.log('Auth me - JWT payload homestayId:', homestayId);

        if (homestayId) {
          const response = {
            authenticated: true,
            userType: 'homestay',
            userId: homestayId,
            tokenType: 'jwt'
          };
          console.log('Auth me - Returning authenticated response:', response);
          return NextResponse.json(response);
        }
      } catch (error) {
        console.error('Auth me - JWT verification failed:', error);
      }
    }

    // If no valid JWT token, return unauthenticated
    console.log('Auth me - Returning unauthenticated response');
    return NextResponse.json({
      authenticated: false
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Server error'
    }, { status: 500 });
  }
}
