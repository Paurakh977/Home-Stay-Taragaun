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
    const { pageContent } = body;
    
    if (!pageContent || typeof pageContent !== 'object') {
      return NextResponse.json(
        { error: "Invalid page content data. Expected an object." },
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

    // Update the page content
    await HomestaySingle.updateOne(
      query,
      { 
        $set: { 
          pageContent: pageContent
        } 
      }
    );
    
    return NextResponse.json({ 
      success: true,
      message: "Page content updated successfully" 
    });
    
  } catch (error) {
    console.error("Error updating page content:", error);
    return NextResponse.json(
      { error: "Failed to update page content", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 