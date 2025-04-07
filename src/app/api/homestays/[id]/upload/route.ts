import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import HomestaySingle from "@/lib/models/HomestaySingle";
import { join } from "path";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const homestayId = params.id;
    
    // Validate homestay exists
    const homestay = await HomestaySingle.findOne({ homestayId });
    if (!homestay) {
      return NextResponse.json(
        { error: "Homestay not found" },
        { status: 404 }
      );
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }
    
    // Validate file type
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }
    
    // Get file extension
    const fileExtension = fileType.split('/')[1];
    
    // Create organized directory structure
    const userDir = join(process.cwd(), "public", "uploads", homestayId);
    const profileDir = join(userDir, "profile");
    
    // Create directories if they don't exist
    if (!existsSync(userDir)) {
      await mkdir(userDir, { recursive: true });
    }
    if (!existsSync(profileDir)) {
      await mkdir(profileDir, { recursive: true });
    }
    
    // Always use the same filename for profile image (overwrite existing)
    const fileName = `profile.${fileExtension}`;
    const filePath = join(profileDir, fileName);
    
    // Write file to disk
    const fileBuffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(fileBuffer));
    
    // Create the public URL that matches what the image serving API expects
    const fileUrl = `/uploads/${homestayId}/profile/${fileName}`;
    
    // Update homestay with image URL
    await HomestaySingle.updateOne(
      { homestayId }, 
      { $set: { profileImage: fileUrl } }
    );
    
    return NextResponse.json({ 
      success: true, 
      imageUrl: fileUrl 
    });
    
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 