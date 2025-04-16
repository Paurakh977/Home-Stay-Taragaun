import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const maxDuration = 30; // This function can run for a max of 30 seconds

// Helper function to create directory if it doesn't exist
async function ensureDirectoryExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

// Helper function to save a file with a unique name
async function saveFile(file: File, directory: string, prefix: string) {
  try {
    // Generate a unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = path.extname(originalName);
    const fileName = `${prefix}_${timestamp}${extension}`;
    const filePath = path.join(directory, fileName);
    
    // Convert file to buffer and write to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // Return a web-friendly URL path instead of filesystem path
    // Extract the path after "public" directory
    const publicDirIndex = filePath.indexOf(path.join('public'));
    if (publicDirIndex !== -1) {
      const relativePath = filePath.substring(publicDirIndex + 'public'.length);
      // Convert backslashes to forward slashes for web URLs
      return relativePath.replace(/\\/g, '/');
    }
    
    return '/error-path-not-found';
  } catch (error) {
    console.error(`Error saving file ${file.name}:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log('Branding upload API called');
  try {
    const formData = await request.formData();
    
    // Log all form data fields for debugging
    console.log('Form data fields:', Array.from(formData.entries()).map(([key]) => key));
    
    // Get username (required)
    const username = formData.get('username') as string;
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }
    
    // Log branding details
    console.log(`Processing branding upload for user: ${username}`);
    
    // Create upload directories if they don't exist - FIXED DIRECTORY STRUCTURE
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', username, 'branding');
    const logoDir = path.join(uploadDir, 'logo');
    const sliderDir = path.join(uploadDir, 'slider');
    const teamDir = path.join(uploadDir, 'team');
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
      console.log(`Created directory: ${uploadDir}`);
    }
    if (!existsSync(logoDir)) {
      await mkdir(logoDir, { recursive: true });
      console.log(`Created directory: ${logoDir}`);
    }
    if (!existsSync(sliderDir)) {
      await mkdir(sliderDir, { recursive: true });
      console.log(`Created directory: ${sliderDir}`);
    }
    if (!existsSync(teamDir)) {
      await mkdir(teamDir, { recursive: true });
      console.log(`Created directory: ${teamDir}`);
    }
    
    // Prepare response paths object
    const paths = {
      logoPath: '',
      sliderPaths: [] as string[],
      teamPhotoPaths: [] as string[]
    };
    
    // Process logo
    const logo = formData.get('logo') as File | null;
    if (logo && logo instanceof File) {
      paths.logoPath = await saveFile(logo, logoDir, 'logo');
      console.log("Logo saved:", paths.logoPath);
    }
    
    // Process slider images
    for (let i = 0; i < 5; i++) {
      const sliderImage = formData.get(`slider_${i}`) as File | null;
      if (sliderImage && sliderImage instanceof File) {
        const sliderPath = await saveFile(sliderImage, sliderDir, `slider_${i}`);
        paths.sliderPaths.push(sliderPath);
        console.log(`Slider image ${i} saved:`, sliderPath);
      }
    }
    
    // Process team member photos
    for (let i = 0; i < 10; i++) { // Support up to 10 team members
      const teamPhoto = formData.get(`team_${i}`) as File | null;
      if (teamPhoto && teamPhoto instanceof File) {
        const teamPath = await saveFile(teamPhoto, teamDir, `team_${i}`);
        paths.teamPhotoPaths.push(teamPath);
        console.log(`Team photo ${i} saved:`, teamPath);
      } else {
        // Push empty string to maintain index alignment with team members
        paths.teamPhotoPaths.push('');
      }
    }
    
    // Get social media data
    const socialData = {
      facebook: formData.get('facebook') || '',
      instagram: formData.get('instagram') || '',
      twitter: formData.get('twitter') || '',
      tiktok: formData.get('tiktok') || '',
      youtube: formData.get('youtube') || '',
    };
    
    // Collect branding details
    const brandingData = {
      brandName: formData.get('brandName') || '',
      brandDescription: formData.get('brandDescription') || '',
      ...socialData
    };
    
    console.log('Branding upload complete', {
      brandingData,
      paths: {
        logoPath: paths.logoPath,
        sliderPaths: paths.sliderPaths,
        teamPhotoPaths: paths.teamPhotoPaths
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Branding assets uploaded successfully',
      paths: {
        logoPath: paths.logoPath,
        sliderPaths: paths.sliderPaths,
        teamPhotoPaths: paths.teamPhotoPaths
      },
      branding: brandingData
    });
    
  } catch (error: any) {
    console.error('Error in branding upload:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to upload branding assets',
        error: error.message 
      }, 
      { status: 500 }
    );
  }
} 