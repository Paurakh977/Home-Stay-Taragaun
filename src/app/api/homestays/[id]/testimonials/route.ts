import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import HomestaySingle from "@/lib/models/HomestaySingle";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const homestayId = params.id;
    
    // Get the adminUsername from query params if it exists
    const { searchParams } = new URL(request.url);
    const adminUsername = searchParams.get("adminUsername");
    
    // Parse the JSON body
    const body = await request.json();
    const { testimonials } = body;
    
    if (!Array.isArray(testimonials)) {
      return NextResponse.json(
        { error: "Invalid testimonials data. Expected an array." },
        { status: 400 }
      );
    }
    
    // Build the query based on whether we have an adminUsername
    const query = adminUsername 
      ? { homestayId, adminUsername }
      : { homestayId };
    
    // Validate homestay exists
    const homestay = await HomestaySingle.findOne(query);
    if (!homestay) {
      return NextResponse.json(
        { error: "Homestay not found" },
        { status: 404 }
      );
    }

    // Update the testimonials
    await HomestaySingle.updateOne(
      query,
      { 
        $set: { 
          testimonials: testimonials
        } 
      }
    );
    
    return NextResponse.json({ 
      success: true,
      message: "Testimonials updated successfully" 
    });
    
  } catch (error) {
    console.error("Error updating testimonials:", error);
    return NextResponse.json(
      { error: "Failed to update testimonials", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 