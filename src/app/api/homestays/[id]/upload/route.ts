import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import HomestaySingle from "@/lib/models/HomestaySingle";
import { join } from "path";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";

// Maximum file size allowed (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const homestayId = params.id;
    
    // Get the adminUsername from query params if it exists
    const { searchParams } = new URL(request.url);
    const adminUsername = searchParams.get("adminUsername");
    
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
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }
    
    // Validate file type
    const fileType = file.type;
    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: "File must be one of these types: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }
    
    // Get file extension
    const fileExtension = fileType.split('/')[1];
    
    // Create organized directory structure with consistent paths
    let userDir: string;
    let profileDir: string;
    let fileUrl: string;
    
    if (adminUsername) {
      // Admin route: /uploads/adminUsername/homestayId
      userDir = join(process.cwd(), "public", "uploads", adminUsername, homestayId);
      profileDir = userDir;
      fileUrl = `/uploads/${adminUsername}/${homestayId}/profile.${fileExtension}`;
    } else {
      // Regular route: /uploads/homestayId
      userDir = join(process.cwd(), "public", "uploads", homestayId);
      profileDir = userDir;
      fileUrl = `/uploads/${homestayId}/profile.${fileExtension}`;
    }
    
    try {
      // Create directories if they don't exist
      if (!existsSync(userDir)) {
        await mkdir(userDir, { recursive: true });
      }
      
      // Always use the same filename for profile image (overwrite existing)
      const fileName = `profile.${fileExtension}`;
      const filePath = join(profileDir, fileName);
      
      // Write file to disk
      const fileBuffer = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(fileBuffer));
      
      // Update homestay with image URL
      await HomestaySingle.updateOne(
        { homestayId }, 
        { $set: { profileImage: fileUrl } }
      );
      
      return NextResponse.json({ 
        success: true, 
        imageUrl: fileUrl 
      });
    } catch (fileError) {
      console.error("Error saving file:", fileError);
      return NextResponse.json(
        { error: "Failed to save file", message: fileError instanceof Error ? fileError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 