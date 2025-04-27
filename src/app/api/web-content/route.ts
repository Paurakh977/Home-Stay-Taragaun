import { NextRequest, NextResponse } from 'next/server';
import WebContentService from '@/lib/services/webContentService';

const DEFAULT_ADMIN = 'main';

// Get web content
export async function GET(request: NextRequest) {
  try {
    // Get admin username from query params
    const { searchParams } = new URL(request.url);
    const adminUsername = searchParams.get('adminUsername') || DEFAULT_ADMIN;
    const section = searchParams.get('section');
    
    // Get content from database
    const content = await WebContentService.getContent(adminUsername);
    
    // If specific section is requested, return only that section
    if (section && content && content[section as keyof typeof content]) {
      return NextResponse.json(content[section as keyof typeof content]);
    }
    
    return NextResponse.json(content || {});
  } catch (error) {
    console.error('Error fetching web content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch web content' },
      { status: 500 }
    );
  }
}

// Update web content
export async function PATCH(request: NextRequest) {
  try {
    // Get admin username from query params
    const { searchParams } = new URL(request.url);
    const adminUsername = searchParams.get('adminUsername') || DEFAULT_ADMIN;
    const section = searchParams.get('section');
    
    // Get request body
    const body = await request.json();
    
    let updatedContent;
    
    // Update specific section or whole content
    if (section) {
      updatedContent = await WebContentService.updateSection(
        adminUsername,
        section as any,
        body
      );
    } else {
      updatedContent = await WebContentService.updateContent(
        adminUsername,
        body
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Content updated successfully',
      content: updatedContent
    });
  } catch (error) {
    console.error('Error updating web content:', error);
    return NextResponse.json(
      { error: 'Failed to update web content' },
      { status: 500 }
    );
  }
} 