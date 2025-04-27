import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { WebContent } from '@/lib/models';
import WebContentService from '@/lib/services/webContentService';

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
    
    return NextResponse.json({ 
      message: `Content for '${adminUsername}' reset successfully`,
      content: newContent
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error resetting web content:', error);
    return NextResponse.json(
      { error: 'Failed to reset web content', details: error.message },
      { status: 500 }
    );
  }
} 