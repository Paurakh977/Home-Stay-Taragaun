import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import HomestaySingle from "@/lib/models/HomestaySingle";
import { join } from "path";
import { mkdir, writeFile, unlink } from "fs/promises";
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
    
    // Check if this is a profile image upload
    const isProfileImage = formData.get("type") === "profile";
    
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
    
    // Create organized directory structure with adjusted path based on admin status
    const baseDir = join(process.cwd(), "public", "uploads");
    let imageDirPath: string;
    let imageUrlPath: string;
    let fileName: string;
    
    if (adminUsername) {
      // For admin routes with different paths for profile vs gallery
      if (isProfileImage) {
        imageDirPath = join(baseDir, adminUsername, homestayId);
        imageUrlPath = `/uploads/${adminUsername}/${homestayId}`;
        fileName = `${homestayId}_profile.${fileType.split('/')[1]}`;
      } else {
        imageDirPath = join(baseDir, adminUsername, homestayId, "gallery");
        imageUrlPath = `/uploads/${adminUsername}/${homestayId}/gallery`;
        // Create a unique filename for gallery images
        const timestamp = Date.now();
        const randomString = Math.floor(Math.random() * 1000000000);
        fileName = `${timestamp}-${randomString}.${fileType.split('/')[1]}`;
      }
    } else {
      // For regular routes with different paths for profile vs gallery
      if (isProfileImage) {
        imageDirPath = join(baseDir, homestayId);
        imageUrlPath = `/uploads/${homestayId}`;
        fileName = `${homestayId}_profile.${fileType.split('/')[1]}`;
      } else {
        imageDirPath = join(baseDir, homestayId, "gallery");
        imageUrlPath = `/uploads/${homestayId}/gallery`;
        // Create a unique filename for gallery images
        const timestamp = Date.now();
        const randomString = Math.floor(Math.random() * 1000000000);
        fileName = `${timestamp}-${randomString}.${fileType.split('/')[1]}`;
      }
    }
    
    try {
      // Create directories if they don't exist
      await mkdir(imageDirPath, { recursive: true });
      
      // Complete file path
      const filePath = join(imageDirPath, fileName);
      
      // Write file to disk
      const fileBuffer = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(fileBuffer));
      
      // Create the public URL that matches what the image serving API expects
      const fileUrl = `${imageUrlPath}/${fileName}`;
      
      // Update homestay with the new image
      if (isProfileImage) {
        await HomestaySingle.updateOne(
          { homestayId }, 
          { $set: { profileImage: fileUrl } }
        );
      } else {
        await HomestaySingle.updateOne(
          { homestayId }, 
          { $push: { galleryImages: fileUrl } }
        );
      }
      
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

// DELETE endpoint for gallery images
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const homestayId = params.id;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get("imagePath");
    const adminUsername = searchParams.get("adminUsername");
    
    if (!imagePath) {
      return NextResponse.json(
        { error: "No image path provided" },
        { status: 400 }
      );
    }
    
    // Validate homestay exists
    const homestay = await HomestaySingle.findOne({ homestayId });
    if (!homestay) {
      return NextResponse.json(
        { error: "Homestay not found" },
        { status: 404 }
      );
    }
    
    // Extract the filename and path segments from the image path
    const pathSegments = imagePath.split('/').filter(Boolean);
    if (pathSegments.length < 3) {
      return NextResponse.json(
        { error: "Invalid image path" },
        { status: 400 }
      );
    }
    
    const filename = pathSegments[pathSegments.length - 1];
    
    // Determine the proper file system path based on the image URL structure
    let filePath: string;
    
    if (adminUsername && imagePath.includes(`/${adminUsername}/`)) {
      // Admin route: /uploads/adminUsername/homestayId/gallery/filename
      filePath = join(process.cwd(), "public", imagePath);
    } else {
      // Regular route: /uploads/homestayId/gallery/filename
      filePath = join(process.cwd(), "public", imagePath);
    }
    
    try {
      // Check if file exists
      if (existsSync(filePath)) {
        // Delete the file from filesystem
        await unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
      } else {
        console.warn(`File not found for deletion: ${filePath}`);
      }
      
      // Remove the image from the database
      await HomestaySingle.updateOne(
        { homestayId }, 
        { $pull: { galleryImages: imagePath } }
      );
      
      return NextResponse.json({ 
        success: true, 
        message: "Image deleted successfully" 
      });
    } catch (fileError) {
      console.error("Error deleting file:", fileError);
      return NextResponse.json(
        { error: "Failed to delete file", message: fileError instanceof Error ? fileError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Error deleting gallery image:", error);
    return NextResponse.json(
      { error: "Failed to delete gallery image", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 