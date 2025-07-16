import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, access, constants } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { updateImageCacheBuster } from '@/lib/imageUtils';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Define allowed file types
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
];

// Max file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Helper function to check if directory exists
async function ensureDirectoryExists(dirPath: string) {
  try {
    await access(dirPath, constants.F_OK);
  } catch (error) {
    // Directory doesn't exist, create it
    await mkdir(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated as superadmin (add your auth check here)
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== 'superadmin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'general';

    // Validate file
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Log file details for debugging
    console.log(`Processing upload: ${file.name}, type: ${file.type}, size: ${file.size} bytes, folder: ${folder}`);

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: `Invalid file type: ${file.type}. Allowed types: JPEG, PNG, WebP, GIF, SVG`
      }, { status: 400 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB`
      }, { status: 400 });
    }

    // Create a unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const sanitizedExtension = fileExtension.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `${uuidv4()}.${sanitizedExtension}`;
    
    // Define base upload directory and specific folder directory
    const baseUploadDir = path.join(process.cwd(), 'public', 'uploads', 'cms');
    const folderUploadDir = path.join(baseUploadDir, folder);
    
    // Ensure both directories exist
    await ensureDirectoryExists(baseUploadDir);
    await ensureDirectoryExists(folderUploadDir);
    
    // Define the full file path
    const filePath = path.join(folderUploadDir, fileName);
    
    // Convert file to buffer and write to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    try {
      await writeFile(filePath, buffer);
      console.log(`Successfully wrote file to: ${filePath}`);
    } catch (fileError) {
      console.error('Error writing file to disk:', fileError);
      return NextResponse.json({ 
        error: `Could not write file to disk: ${fileError instanceof Error ? fileError.message : 'Unknown error'}` 
      }, { status: 500 });
    }
    
    // Generate the public URL for the image
    const publicPath = `/uploads/cms/${folder}/${fileName}`;
    
    // Update the image cache buster to ensure fresh images
    updateImageCacheBuster();
    console.log(`🔄 Image Upload API - Updated cache buster after uploading ${fileName}`);
    
    return NextResponse.json({
      success: true,
      fileName,
      imagePath: publicPath,
      size: file.size,
      type: file.type
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      error: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
} 