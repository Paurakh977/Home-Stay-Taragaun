import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import HomestaySingle from "@/lib/models/HomestaySingle";
import { hashPassword } from "@/lib/utils";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Parse request body
    const body = await request.json();
    const { homestayId, password } = body;
    
    // Validate input
    if (!homestayId || !password) {
      return NextResponse.json(
        { success: false, error: "Homestay ID and password are required" },
        { status: 400 }
      );
    }
    
    // Find homestay by ID
    const homestay = await HomestaySingle.findOne({ homestayId }).lean();
    
    if (!homestay) {
      return NextResponse.json(
        { success: false, error: "Homestay not found or has been deleted" },
        { status: 404 }
      );
    }
    
    // Check password - hash the provided password and compare
    const hashedProvidedPassword = hashPassword(password);
    
    if (hashedProvidedPassword !== homestay.password) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        homestayId: homestay.homestayId,
        id: homestay._id.toString(),
        homeStayName: homestay.homeStayName
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Token valid for 7 days
    );
    
    // Set cookie with the token
    const response = NextResponse.json(
      { 
        success: true, 
        user: {
          homestayId: homestay.homestayId,
          homeStayName: homestay.homeStayName,
        }
      },
      { status: 200 }
    );
    
    // Set HttpOnly cookie with the token
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: '/',
      sameSite: 'lax'  // Changed from 'strict' to 'lax' for better compatibility
    });
    
    return response;
    
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "An error occurred during login" 
      },
      { status: 500 }
    );
  }
} 