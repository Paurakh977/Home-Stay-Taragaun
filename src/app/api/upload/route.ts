import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; 

// Allowed image types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

export async function POST(request: NextRequest) {
  try {
    // Get the path and filename from query params
    const { searchParams } = new URL(request.url);
    const uploadPath = searchParams.get("path");
    const fileName = searchParams.get("filename");
    
    if (!uploadPath) {
      return NextResponse.json(
        { error: "Upload path is required" },
        { status: 400 }
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
    
    try {
      // Create organized directory structure
      const baseDir = path.join(process.cwd(), "public");
      const targetDir = path.join(baseDir, uploadPath);
      
      // Create directories if they don't exist
      if (!existsSync(targetDir)) {
        await fs.mkdir(targetDir, { recursive: true });
      }
      
      // Determine the final filename
      let finalFileName = fileName;
      if (!finalFileName) {
        const timestamp = Date.now();
        const randomString = Math.floor(Math.random() * 1000000000);
        finalFileName = `${timestamp}-${randomString}.${fileType.split('/')[1]}`;
      }
      
      // Complete file path
      const filePath = path.join(targetDir, finalFileName);
      
      // Write file to disk
      const fileBuffer = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(fileBuffer));
      
      // Create the public URL
      const fileUrl = `/${uploadPath}/${finalFileName}`;
      
      return NextResponse.json({ 
        success: true, 
        filePath: fileUrl 
      });
    } catch (fsError) {
      console.error("File system error:", fsError);
      return NextResponse.json(
        { error: "File system error", message: fsError instanceof Error ? fsError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 