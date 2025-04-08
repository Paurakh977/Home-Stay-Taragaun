import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    // Extract homestayId and type from the path
    const filename = params.slug.join('/');
    console.log(`API: Image request for: ${filename}`, params.slug);

    if (!filename) {
      console.error('API: Filename missing in request');
      return NextResponse.json({ error: 'Filename missing' }, { status: 400 });
    }

    // IMPORTANT: Construct the correct path to the uploads directory
    // Now handles nested structure: /uploads/[homestayId]/(profile|gallery)/[filename]
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    console.log(`API: Looking for image at: ${filePath}`);

    // Security check: Ensure the path doesn't try to escape the uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!filePath.startsWith(uploadsDir)) {
        console.error(`API: Attempted access outside uploads directory: ${filePath}`);
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`API: Image not found at: ${filePath}`);
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Get file stats to determine content length and type
    const stats = fs.statSync(filePath);
    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    console.log(`API: Serving image of type ${contentType}, size ${stats.size} bytes`);

    // Read the file content
    const fileBuffer = fs.readFileSync(filePath);

    // Create the response with cache control for better performance
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year since we use unique filenames
      },
    });

    return response;

  } catch (error) {
    console.error('API: Error serving image:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
} 