import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import dbConnect from '@/lib/mongodb';
import HomestaySingle from '@/lib/models/HomestaySingle';

// Helper to ensure directory exists
async function ensureDir(dirPath: string) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to database
    await dbConnect();
    
    // Get homestay ID from params
    const homestayId = params.id;
    
    // Check if homestay exists and user has permission
    const homestay = await HomestaySingle.findOne({ homestayId });
    
    if (!homestay) {
      return NextResponse.json({ error: 'Homestay not found' }, { status: 404 });
    }
    
    // Get formData from request
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const type = formData.get('type') as string;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }
    
    if (!type || (type !== 'profile' && type !== 'gallery')) {
      return NextResponse.json({ error: 'Valid image type is required' }, { status: 400 });
    }
    
    // Get file buffer
    const buffer = await imageFile.arrayBuffer();
    
    // Generate unique filename with current timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(imageFile.name) || '.jpg';
    const filename = `${homestayId}-${type}-${uniqueSuffix}${extension}`;
    
    // Path to save the file
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', homestayId);
    await ensureDir(uploadDir);
    
    const filePath = path.join(uploadDir, filename);
    const relativePath = `/uploads/${homestayId}/${filename}`;
    
    // Write file to disk
    await writeFile(filePath, Buffer.from(buffer));
    
    // Update homestay document based on image type
    if (type === 'profile') {
      // Update profile image
      await HomestaySingle.findOneAndUpdate(
        { homestayId },
        { profileImage: relativePath }
      );
    } else if (type === 'gallery') {
      // Add image to gallery
      await HomestaySingle.findOneAndUpdate(
        { homestayId },
        { $push: { galleryImages: relativePath } }
      );
    }
    
    // Return success response with image URL
    return NextResponse.json({
      success: true,
      imageUrl: relativePath
    });
    
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 