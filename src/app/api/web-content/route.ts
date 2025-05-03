import { NextRequest, NextResponse } from 'next/server';
import WebContentService from '@/lib/services/webContentService';

const DEFAULT_ADMIN = 'main';

// Helper to add no-cache headers
const addNoCacheHeaders = (response: NextResponse) => {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  return response;
};

// Get web content
export async function GET(request: NextRequest) {
  try {
    // Get admin username from query params
    const { searchParams } = new URL(request.url);
    const adminUsername = searchParams.get('adminUsername') || DEFAULT_ADMIN;
    const section = searchParams.get('section');
    
    console.log(`📄 Web Content API GET - Admin: ${adminUsername}, Section: ${section || 'all'}`);
    
    // Get content from database
    const content = await WebContentService.getContent(adminUsername);
    
    // If specific section is requested, return only that section
    if (section && content && content[section as keyof typeof content]) {
      console.log(`✅ Web Content API - Successfully fetched section: ${section}`);
      return addNoCacheHeaders(NextResponse.json(content[section as keyof typeof content]));
    }
    
    console.log(`✅ Web Content API - Successfully fetched all content`);
    return addNoCacheHeaders(NextResponse.json(content || {}));
  } catch (error) {
    console.error('❌ Error fetching web content:', error);
    return addNoCacheHeaders(NextResponse.json(
      { error: 'Failed to fetch web content', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    ));
  }
}

// Update web content
export async function PATCH(request: NextRequest) {
  try {
    // Get admin username from query params
    const { searchParams } = new URL(request.url);
    const adminUsername = searchParams.get('adminUsername') || DEFAULT_ADMIN;
    const section = searchParams.get('section');
    
    console.log(`📄 Web Content API PATCH - Admin: ${adminUsername}, Section: ${section || 'all'}`);
    
    // Get request body
    const body = await request.json();
    
    // Validate that body is not empty
    if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
      console.error('❌ Web Content API - Empty request body');
      return addNoCacheHeaders(NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      ));
    }
    
    let updatedContent;
    
    // Update specific section or whole content
    if (section) {
      console.log(`📄 Web Content API - Updating section: ${section}`);
      
      try {
        updatedContent = await WebContentService.updateSection(
          adminUsername,
          section as any,
          body
        );
        console.log(`✅ Web Content API - Successfully updated section: ${section}`);
      } catch (sectionError) {
        console.error(`❌ Error updating section ${section}:`, sectionError);
        return addNoCacheHeaders(NextResponse.json(
          { 
            error: `Failed to update ${section} content`, 
            details: sectionError instanceof Error ? sectionError.message : String(sectionError)
          },
          { status: 500 }
        ));
      }
    } else {
      console.log(`📄 Web Content API - Updating all content`);
      
      try {
        updatedContent = await WebContentService.updateContent(
          adminUsername,
          body
        );
        console.log(`✅ Web Content API - Successfully updated all content`);
      } catch (contentError) {
        console.error('❌ Error updating all content:', contentError);
        return addNoCacheHeaders(NextResponse.json(
          { 
            error: 'Failed to update web content', 
            details: contentError instanceof Error ? contentError.message : String(contentError) 
          },
          { status: 500 }
        ));
      }
    }
    
    return addNoCacheHeaders(NextResponse.json({
      success: true,
      message: 'Content updated successfully',
      content: updatedContent
    }));
  } catch (error) {
    console.error('❌ Error in web content update API:', error);
    return addNoCacheHeaders(NextResponse.json(
      { 
        error: 'Failed to update web content', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    ));
  }
} 