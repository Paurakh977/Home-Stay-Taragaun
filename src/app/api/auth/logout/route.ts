import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get query parameters to check for admin route
    const { searchParams } = new URL(request.url);
    const adminUsername = searchParams.get("adminUsername");
    
    // Create a response
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );
    
    // Clear the standard auth cookie
    response.cookies.set({
      name: 'auth_token',
      value: '',
      expires: new Date(0), // Set expiration date to the past
      path: '/',
    });
    
    // If this is an admin route, also clear the admin-specific auth cookie
    if (adminUsername) {
      // Clear potential admin token formats
      const adminTokenNames = [
        `${adminUsername}_auth_token`,
        `auth_token_${adminUsername}`
      ];
      
      adminTokenNames.forEach(tokenName => {
        response.cookies.set({
          name: tokenName,
          value: '',
          expires: new Date(0),
          path: '/',
        });
      });
    }
    
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during logout" },
      { status: 500 }
    );
  }
} 