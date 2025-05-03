import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { statSync, createReadStream } from 'fs';
import { join } from 'path';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    const { slug } = params;
    const requestUrl = request.url;
    console.log(`🖼️ Direct Uploads API - Requested file: ${requestUrl}`);
    console.log(`🖼️ Direct Uploads API - Slug parts:`, slug);
    
    if (!slug || slug.length === 0) {
      console.error('❌ Direct Uploads API - No slug provided');
      return new NextResponse('File not found', { 
        status: 404, 
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
    // Ensure there's no path traversal by removing any .. segments
    const sanitizedSlug = slug.filter(segment => segment !== '..' && segment !== '.');
    
    // Join all slug parts to form the path within uploads
    const filePath = join(process.cwd(), 'public', 'uploads', ...sanitizedSlug);
    console.log(`🖼️ Direct Uploads API - Full path: ${filePath}`);

    // Security check: Ensure the path doesn't try to escape the uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!filePath.startsWith(uploadsDir)) {
      console.error(`❌ Direct Uploads API - Security check failed: path tries to escape uploads directory`);
      return new NextResponse('Forbidden', { 
        status: 403,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // Check if file exists
    let fileExists = false;
    let actualFilePath = filePath;
    
    try {
      const stats = statSync(filePath);
      if (stats.isFile()) {
        fileExists = true;
        console.log(`✅ Direct Uploads API - File found: ${filePath}, size: ${stats.size} bytes`);
      } else {
        console.error(`❌ Direct Uploads API - Path exists but is not a file: ${filePath}`);
        fileExists = false;
      }
    } catch (err) {
      console.error(`❌ Direct Uploads API - File not found: ${filePath}`);
      fileExists = false;
      
      // Check for case-sensitive issues
      try {
        const dirPath = path.dirname(filePath);
        const fileName = path.basename(filePath);
        
        if (fs.existsSync(dirPath)) {
          console.log(`🔍 Direct Uploads API - Directory exists, checking for case-insensitive match...`);
          const files = fs.readdirSync(dirPath);
          
          // Try to find a case-insensitive match
          const possibleMatch = files.find(f => f.toLowerCase() === fileName.toLowerCase());
          if (possibleMatch) {
            actualFilePath = join(dirPath, possibleMatch);
            fileExists = true;
            console.log(`✅ Direct Uploads API - Found case-insensitive match: ${possibleMatch}`);
          } else {
            console.log(`❌ Direct Uploads API - No match found in directory. Files available:`, files);
          }
        } else {
          console.error(`❌ Direct Uploads API - Directory does not exist: ${dirPath}`);
        }
      } catch (listErr) {
        console.error(`❌ Direct Uploads API - Error checking directory:`, listErr);
      }
    }
    
    if (!fileExists) {
      console.error(`❌ Direct Uploads API - File not found after all checks: ${filePath}`);
      return new NextResponse('File not found', { 
        status: 404,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // Create read stream for the actual file path (which might be the original or a found alternative)
    const stream = createReadStream(actualFilePath);
    
    // Get file extension for content type
    const ext = path.extname(actualFilePath).slice(1).toLowerCase();
    const contentType = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }[ext || ''] || 'application/octet-stream';

    console.log(`🖼️ Direct Uploads API - Serving file with content type: ${contentType}`);

    // Return the file stream with aggressive no-cache headers
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('❌ Direct Uploads API - Error serving file:', error);
    return new NextResponse('Error serving file', { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
} 