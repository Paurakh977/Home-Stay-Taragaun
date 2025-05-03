import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * Fallback image handler that returns default images for common types
 * Used as a last resort when images are not found
 */
export async function GET(request: NextRequest) {
  try {
    const baseDir = process.cwd();
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'placeholder';
    const originalPath = searchParams.get('originalPath') || '';
    
    console.log(`🖼️ Fallback Image API - Serving fallback image of type: ${type}, original path: ${originalPath}`);
    
    // Define fallback paths based on type
    const fallbackPaths: Record<string, string> = {
      'logo': join(baseDir, 'public', 'images', 'Logo.png'),
      'placeholder': join(baseDir, 'public', 'images', 'placeholder-homestay.jpg'),
      'avatar': join(baseDir, 'public', 'images', 'avatar-placeholder.png'),
      'hero': join(baseDir, 'public', 'images', 'home', 'hero-bg.jpg'),
      'about': join(baseDir, 'public', 'images', 'about', 'nepal-story.jpg'),
      'team': join(baseDir, 'public', 'images', 'team', 'team-placeholder.jpg'),
      'contact': join(baseDir, 'public', 'images', 'contact', 'contact-placeholder.jpg'),
    };
    
    // Get the fallback file path or use placeholder as default
    const fallbackPath = fallbackPaths[type] || fallbackPaths.placeholder;
    
    // Check if fallback file exists
    if (!existsSync(fallbackPath)) {
      console.error(`❌ Fallback Image API - Fallback file does not exist: ${fallbackPath}`);
      
      // Try the placeholder as a last resort
      const placeholderPath = fallbackPaths.placeholder;
      if (existsSync(placeholderPath)) {
        console.log(`🖼️ Fallback Image API - Using placeholder image instead: ${placeholderPath}`);
        const stream = createReadStream(placeholderPath);
        return new NextResponse(stream as any, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          }
        });
      }
      
      // Generate a small 1px transparent PNG as ultimate fallback
      console.log(`🖼️ Fallback Image API - Using transparent pixel as ultimate fallback`);
      const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
      
      return new NextResponse(transparentPixel, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        }
      });
    }
    
    console.log(`✅ Fallback Image API - Using fallback image: ${fallbackPath}`);
    
    // Create read stream for the fallback file
    const stream = createReadStream(fallbackPath);
    
    // Determine content type from file extension
    const ext = path.extname(fallbackPath).slice(1).toLowerCase();
    const contentType = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml'
    }[ext] || 'application/octet-stream';
    
    // Return the file stream with appropriate headers
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('❌ Fallback Image API - Error:', error);
    
    // Generate a small 1px transparent PNG as ultimate fallback
    const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    
    return new NextResponse(transparentPixel, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
      }
    });
  }
} 