import { NextRequest, NextResponse } from 'next/server';
import WebContentService from '@/lib/services/webContentService';

export async function GET(req: NextRequest) {
  try {
    // Get the admin username from query parameters
    const url = new URL(req.url);
    const adminUsername = url.searchParams.get('adminUsername') || 'main';
    
    // Fetch the content for this admin (or default if none exists)
    const content = await WebContentService.getAdminWebContent(adminUsername);
    
    return NextResponse.json(content, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching web content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch web content', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Get the admin username from query parameters
    const url = new URL(req.url);
    const adminUsername = url.searchParams.get('adminUsername') || 'main';
    
    // Get update data from request body
    const requestData = await req.json();
    
    // Check if we're updating a specific section
    const section = url.searchParams.get('section');
    
    let updatedContent;
    if (section) {
      // Update only specified section
      updatedContent = await WebContentService.updateContentSection(
        adminUsername,
        section,
        requestData
      );
    } else {
      // Update multiple sections
      updatedContent = await WebContentService.updateWebContent(
        adminUsername,
        requestData
      );
    }
    
    return NextResponse.json(updatedContent, { status: 200 });
  } catch (error: any) {
    console.error('Error updating web content:', error);
    return NextResponse.json(
      { error: 'Failed to update web content', details: error.message },
      { status: error.message === 'Content not found' ? 404 : 500 }
    );
  }
} 