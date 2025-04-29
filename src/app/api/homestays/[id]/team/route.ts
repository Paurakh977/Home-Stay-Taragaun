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
    const { teamMembers } = body;
    
    if (!Array.isArray(teamMembers)) {
      return NextResponse.json(
        { error: "Invalid team members data. Expected an array." },
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

    // Update the team members
    await HomestaySingle.updateOne(
      query,
      { 
        $set: { 
          teamMembers: teamMembers
        } 
      }
    );
    
    return NextResponse.json({ 
      success: true,
      message: "Team members updated successfully" 
    });
    
  } catch (error) {
    console.error("Error updating team members:", error);
    return NextResponse.json(
      { error: "Failed to update team members", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 