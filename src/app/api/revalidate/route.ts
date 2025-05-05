import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  try {
    // Extract path from query params
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/';
    
    // Revalidate the path
    revalidatePath(path);
    
    // Log for debugging
    console.log(`Revalidated path: ${path} at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      revalidated: true,
      path,
      now: Date.now(),
    });
  } catch (error) {
    console.error('Error during revalidation:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error revalidating path', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 