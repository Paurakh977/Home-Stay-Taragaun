import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Allowed types: JPEG, PNG, WebP, GIF, SVG'
      }, { status: 400 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: 'File too large. Maximum size is 5MB'
      }, { status: 400 });
    }

    // Create a unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${fileExtension}`;

    // Define upload directory path
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'cms', folder);
    
    // Ensure the directory exists
    await mkdir(uploadDir, { recursive: true });
    
    // Define the full file path
    const filePath = path.join(uploadDir, fileName);
    
    // Convert file to buffer and write to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    // Generate the public URL for the image
    const publicPath = `/uploads/cms/${folder}/${fileName}`;
    
    return NextResponse.json({
      success: true,
      fileName,
      imagePath: publicPath,
      size: file.size,
      type: file.type
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file' 
    }, { status: 500 });
  }
} 