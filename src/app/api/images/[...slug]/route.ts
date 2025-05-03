import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { statSync, createReadStream, existsSync } from 'fs';
import { join } from 'path';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Helper function to check file existence in multiple locations
async function findFileInMultipleLocations(slug: string[]): Promise<{exists: boolean, filePath: string}> {
  const baseDir = process.cwd();
  
  // Get the filename for special handling
  const fileName = slug[slug.length - 1].toLowerCase();
  
  // All possible locations to try, in order of preference
  const possiblePaths = [
    join(baseDir, 'public', 'uploads', ...slug),
    join(baseDir, 'public', 'images', ...slug),
    join(baseDir, 'public', ...slug),
    // Try without 'uploads' prefix in case the path already includes it
    ...(slug[0] === 'uploads' ? [] : [join(baseDir, 'public', 'uploads', 'cms', ...slug)]),
    ...(slug[0] === 'cms' ? [] : [join(baseDir, 'public', 'uploads', 'cms', ...slug)]),
  ];
  
  // Special handling for about page images
  if (slug.some(part => part === 'about')) {
    possiblePaths.push(
      join(baseDir, 'public', 'uploads', 'cms', 'about', fileName),
      join(baseDir, 'public', 'images', 'about', fileName)
    );
  }
  
  // Try each path directly
  for (const testPath of possiblePaths) {
    try {
      const stats = statSync(testPath);
      if (stats.isFile()) {
        console.log(`✅ Image API - Found file at: ${testPath}`);
        return { exists: true, filePath: testPath };
      }
    } catch (err) {
      // File doesn't exist or other error, continue to next path
    }
  }
  
  // Try case-insensitive search in each parent directory
  for (const testPath of possiblePaths) {
    try {
      const dirPath = path.dirname(testPath);
      const fileName = path.basename(testPath);
      
      if (existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        const caseInsensitiveMatch = files.find(f => f.toLowerCase() === fileName.toLowerCase());
        
        if (caseInsensitiveMatch) {
          const matchedPath = join(dirPath, caseInsensitiveMatch);
          console.log(`✅ Image API - Found case-insensitive match: ${matchedPath}`);
          return { exists: true, filePath: matchedPath };
        }
      }
    } catch (err) {
      // Error in case-insensitive search, continue to next path
    }
  }
  
  // File not found in any location
  console.error(`❌ Image API - File not found in any location for slug: ${slug.join('/')}`);
  return { exists: false, filePath: '' };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    const { slug } = params;
    const requestUrl = request.url;
    console.log(`🖼️ Image API - Requested image: ${requestUrl}`);
    console.log(`🖼️ Image API - Slug parts:`, slug);
    
    if (!slug || slug.length === 0) {
      console.error('❌ Image API - No slug provided');
      return redirectToFallback(request, 'placeholder');
    }
    
    // Ensure there's no path traversal by removing any .. segments
    const sanitizedSlug = slug.filter(segment => segment !== '..' && segment !== '.');
    
    // Find the file in multiple possible locations
    const { exists, filePath } = await findFileInMultipleLocations(sanitizedSlug);
    
    if (!exists) {
      console.error(`❌ Image API - File not found for slug: ${sanitizedSlug.join('/')}`);
      
      // Determine appropriate fallback type
      let fallbackType = 'placeholder';
      
      // Special case for known image types
      if (sanitizedSlug.includes('Logo.png') || sanitizedSlug.some(s => s.toLowerCase().includes('logo'))) {
        fallbackType = 'logo';
      } else if (sanitizedSlug.some(s => s === 'about' || s === 'story')) {
        fallbackType = 'about';
      } else if (sanitizedSlug.some(s => s === 'team')) {
        fallbackType = 'team';
      } else if (sanitizedSlug.some(s => s === 'contact')) {
        fallbackType = 'contact';
      } else if (sanitizedSlug.some(s => s === 'hero' || s === 'home')) {
        fallbackType = 'hero';
      }
      
      return redirectToFallback(request, fallbackType, sanitizedSlug.join('/'));
    }

    // Create read stream for the file
    const stream = createReadStream(filePath);
    
    // Get file extension for content type
    const ext = path.extname(filePath).slice(1).toLowerCase();
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

    console.log(`🖼️ Image API - Serving file with content type: ${contentType}`);

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
    console.error('❌ Image API - Error serving file:', error);
    return redirectToFallback(request, 'placeholder');
  }
}

// Helper function to redirect to fallback image
function redirectToFallback(request: NextRequest, type: string, originalPath?: string) {
  const url = new URL('/api/fallback-image', request.url);
  url.searchParams.set('type', type);
  if (originalPath) {
    url.searchParams.set('originalPath', originalPath);
  }
  
  console.log(`🔄 Image API - Redirecting to fallback image: ${url.href}`);
  return NextResponse.redirect(url, 307);
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