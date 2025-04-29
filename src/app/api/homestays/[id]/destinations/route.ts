import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import HomestaySingle from "@/lib/models/HomestaySingle";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const homestayId = params.id;
    
    // Get the adminUsername from query params if it exists
    const { searchParams } = new URL(request.url);
    const adminUsername = searchParams.get("adminUsername");
    
    // Build the query based on whether we have an adminUsername
    const query = adminUsername 
      ? { homestayId, adminUsername }
      : { homestayId };
    
    // Find the homestay
    const homestay = await HomestaySingle.findOne(query);
    if (!homestay) {
      return NextResponse.json(
        { error: "Homestay not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      destinations: homestay.destinations || [] 
    });
    
  } catch (error) {
    console.error("Error fetching destinations:", error);
    return NextResponse.json(
      { error: "Failed to fetch destinations", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

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
    const { destinations } = body;
    
    if (!Array.isArray(destinations)) {
      return NextResponse.json(
        { error: "Invalid destinations data. Expected an array." },
        { status: 400 }
      );
    }
    
    // Validate each destination object has required fields
    for (const destination of destinations) {
      if (!destination.name || !destination.description || !destination.distance || !destination.category) {
        return NextResponse.json(
          { error: "Invalid destination data. Each destination must have name, description, distance, and category fields." },
          { status: 400 }
        );
      }
      
      // If image path is provided, ensure it's properly formatted for storage
      if (destination.image && typeof destination.image === 'string') {
        // Ensure images from uploads directory have proper path format
        if (destination.image.startsWith('/uploads/')) {
          // Path is already correct, no changes needed
        } else if (!destination.image.startsWith('/') && !destination.image.startsWith('http')) {
          // Add leading slash if missing and not a URL
          destination.image = `/${destination.image}`;
        }
      }
      
      // Ensure highlights is an array
      if (destination.highlights && !Array.isArray(destination.highlights)) {
        destination.highlights = [];
      }
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

    // Update the destinations
    await HomestaySingle.updateOne(
      query,
      { 
        $set: { 
          destinations: destinations
        } 
      }
    );
    
    return NextResponse.json({ 
      success: true,
      message: "Destinations updated successfully" 
    });
    
  } catch (error) {
    console.error("Error updating destinations:", error);
    return NextResponse.json(
      { error: "Failed to update destinations", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 