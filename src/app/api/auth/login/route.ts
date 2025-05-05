import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { HomestaySingle } from "@/lib/models";
import { verifyPassword } from "@/lib/utils";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    // Parse the request body
    const { homestayId, password, adminUsername } = await req.json();
    
    // Validate input
    if (!homestayId || !password) {
      return NextResponse.json(
        { success: false, message: "Homestay ID and password are required" },
        { status: 400 }
      );
    }
    
    // Find the homestay
    const homestay = await HomestaySingle.findOne({ homestayId }).select('homestayId homeStayName password adminUsername');
    
    if (!homestay) {
      console.log(`Login failed: Homestay not found with ID ${homestayId}`);
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }
    
    // If adminUsername is provided, verify that this homestay belongs to the admin
    if (adminUsername && homestay.adminUsername !== adminUsername) {
      console.log(`Login failed: Homestay ${homestayId} does not belong to admin ${adminUsername}`);
      return NextResponse.json(
        { success: false, message: "This homestay is not associated with the specified admin" },
        { status: 403 }
      );
    }
    
    // Verify password using the utility function
    const isPasswordValid = verifyPassword(password, homestay.password);
    
    if (!isPasswordValid) {
      console.log(`Login failed: Invalid password for homestay ${homestayId}`);
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        homestayId: homestay.homestayId,
        homeStayName: homestay.homeStayName,
        adminUsername: homestay.adminUsername,
        isAdmin: true // Add isAdmin flag for middleware checks
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Create response with success message
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      homestayId: homestay.homestayId,
      homeStayName: homestay.homeStayName,
      adminUsername: homestay.adminUsername
    });
    
    // Set cookie directly on the response
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax'
    });
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: "An error occurred during login" },
      { status: 500 }
    );
  }
} 