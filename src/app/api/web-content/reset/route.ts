import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { WebContent } from '@/lib/models';
import WebContentService from '@/lib/services/webContentService';
import { updateImageCacheBuster } from '@/lib/imageUtils';

// Helper to add no-cache headers
const addNoCacheHeaders = (response: NextResponse) => {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  return response;
};

// POST handler for programmatic API access
export async function POST(req: NextRequest) {
  return resetContent(req);
}

// GET handler for easy browser access
export async function GET(req: NextRequest) {
  return resetContent(req);
}

// Shared reset function
async function resetContent(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get the admin username from query parameters
    const url = new URL(req.url);
    const adminUsername = url.searchParams.get('adminUsername') || 'main';
    
    // Delete existing content for this admin
    await WebContent.deleteOne({ adminUsername });
    
    // Use the service to create default content with proper validation
    const newContent = await WebContentService.createDefaultContent(adminUsername);
    
    // Update image cache buster to ensure fresh images are loaded
    updateImageCacheBuster();
    
    return addNoCacheHeaders(NextResponse.json({ 
      message: `Content for '${adminUsername}' reset successfully`,
      content: newContent
    }, { status: 200 }));
  } catch (error: any) {
    console.error('Error resetting web content:', error);
    return addNoCacheHeaders(NextResponse.json(
      { error: 'Failed to reset web content', details: error.message },
      { status: 500 }
    ));
  }
} 