import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types'; // We might need this library

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    const filename = params.slug.join('/'); // Reconstruct filename if it contained slashes

    if (!filename) {
      return new NextResponse('Filename missing', { status: 400 });
    }

    // IMPORTANT: Construct the correct path to the uploads directory
    // Assumes uploads are in `public/uploads` relative to the project root
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    // Security check: Ensure the path doesn't try to escape the uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!filePath.startsWith(uploadsDir)) {
        console.error(`Attempted access outside uploads directory: ${filePath}`);
        return new NextResponse('Forbidden', { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`Image not found at path: ${filePath}`);
      return new NextResponse('Not Found', { status: 404 });
    }

    // Get file stats to determine content length and type
    const stats = fs.statSync(filePath);
    const contentType = mime.lookup(filePath) || 'application/octet-stream'; // Guess mime type

    // Read the file content
    const fileBuffer = fs.readFileSync(filePath);

    // Create the response
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        // Optional: Add cache control headers if desired
        // 'Cache-Control': 'public, max-age=31536000, immutable', 
      },
    });

    return response;

  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 