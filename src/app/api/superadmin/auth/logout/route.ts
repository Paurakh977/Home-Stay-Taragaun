import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  // Clear the superadmin_token cookie
  response.cookies.set({
    name: 'superadmin_token',
    value: '', // Empty value
    expires: new Date(0), // Expired
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  return response;
}

export async function GET() {
  // Also support GET for easier logout (e.g., from a link)
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  // Clear the superadmin_token cookie
  response.cookies.set({
    name: 'superadmin_token',
    value: '', // Empty value
    expires: new Date(0), // Expired
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  return response;
} 