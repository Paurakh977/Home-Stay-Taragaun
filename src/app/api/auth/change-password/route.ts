import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import HomestaySingle from "@/lib/models/HomestaySingle";
import { hashPassword } from "@/lib/utils";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get the auth token
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Verify token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET) as { homestayId: string };
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Current password and new password are required" },
        { status: 400 }
      );
    }
    
    // Find homestay by ID from token
    const homestay = await HomestaySingle.findOne({ homestayId: decodedToken.homestayId });
    
    if (!homestay) {
      return NextResponse.json(
        { success: false, error: "Homestay not found" },
        { status: 404 }
      );
    }
    
    // Verify current password
    const hashedCurrentPassword = hashPassword(currentPassword);
    if (hashedCurrentPassword !== homestay.password) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 400 }
      );
    }
    
    // Hash new password
    const hashedNewPassword = hashPassword(newPassword);
    
    // Update password
    await HomestaySingle.updateOne(
      { homestayId: decodedToken.homestayId },
      { $set: { password: hashedNewPassword } }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: "Password updated successfully" 
    });
    
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "An error occurred while changing password" 
      },
      { status: 500 }
    );
  }
} 