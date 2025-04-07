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
    
    // Create organized directory structure
    const userDir = join(process.cwd(), "public", "uploads", homestayId);
    const galleryDir = join(userDir, "gallery");
    
    // Create directories if they don't exist
    if (!existsSync(userDir)) {
      await mkdir(userDir, { recursive: true });
    }
    if (!existsSync(galleryDir)) {
      await mkdir(galleryDir, { recursive: true });
    }
    
    // Create a unique filename for the gallery image
    const timestamp = Date.now();
    const randomString = Math.floor(Math.random() * 1000000000);
    const fileName = `${timestamp}-${randomString}.${fileType.split('/')[1]}`;
    const filePath = join(galleryDir, fileName);
    
    // Write file to disk
    const fileBuffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(fileBuffer));
    
    // Create the public URL that matches what the image serving API expects
    const fileUrl = `/uploads/${homestayId}/gallery/${fileName}`;
    
    // Update homestay with new gallery image
    await HomestaySingle.updateOne(
      { homestayId }, 
      { $push: { galleryImages: fileUrl } }
    );
    
    return NextResponse.json({ 
      success: true, 
      imageUrl: fileUrl 
    });
    
  } catch (error) {
    console.error("Error uploading gallery image:", error);
    return NextResponse.json(
      { error: "Failed to upload gallery image", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 