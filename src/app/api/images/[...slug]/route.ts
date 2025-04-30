import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import { statSync, createReadStream } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    const { slug } = params;
    console.log('Image API - Requested slug:', slug);
    console.log('Image API - Request URL:', request.url);
    
    if (!slug || slug.length === 0) {
      console.error('Image API - No slug provided');
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Ensure there's no path traversal by removing any .. segments
    const sanitizedSlug = slug.filter(segment => segment !== '..' && segment !== '.');
    console.log('Image API - Sanitized slug:', sanitizedSlug);
    
    // Join all slug parts to form the path within uploads
    const filePath = join(process.cwd(), 'public', 'uploads', ...sanitizedSlug);
    console.log('Image API - Attempting to serve file from:', filePath);

    // Security check: Ensure the path doesn't try to escape the uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!filePath.startsWith(uploadsDir)) {
      console.error('Image API - Security check failed: path tries to escape uploads directory');
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Debug: List directory structure to verify paths
    try {
      const dirPath = path.dirname(filePath);
      if (fs.existsSync(dirPath)) {
        console.log('Image API - Directory exists, contents:', fs.readdirSync(dirPath));
      } else {
        console.error('Image API - Directory does not exist:', dirPath);
      }
    } catch (err) {
      console.error('Image API - Error listing directory:', err);
    }

    // Check if file exists
    try {
      const stats = statSync(filePath);
      if (!stats.isFile()) {
        console.error('Image API - Path exists but is not a file:', filePath);
        return new NextResponse('File not found', { status: 404 });
      }
      console.log('Image API - File found, size:', stats.size);
    } catch (err) {
      console.error('Image API - File does not exist:', filePath, err);
      
      // Debug: Try to find path variations that might work
      try {
        // Check if only the filename is case-sensitive
        const dirPath = path.dirname(filePath);
        const fileName = path.basename(filePath);
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          console.log('Image API - Files in directory:', files);
          
          // Find if there's a file with same name ignoring case
          const possibleMatch = files.find(f => f.toLowerCase() === fileName.toLowerCase());
          if (possibleMatch) {
            console.log('Image API - Possible case-insensitive match found:', possibleMatch);
          }
        }
      } catch (listErr) {
        console.error('Image API - Error listing directory for alternatives:', listErr);
      }
      
      return new NextResponse('File not found', { status: 404 });
    }

    // Create read stream
    const stream = createReadStream(filePath);
    
    // Get file extension for content type
    const ext = sanitizedSlug[sanitizedSlug.length - 1].split('.').pop()?.toLowerCase();
    const contentType = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }[ext || ''] || 'application/octet-stream';

    console.log('Image API - Serving file with content type:', contentType);

    // Return the file stream
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('File not found', { status: 404 });
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