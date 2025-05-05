import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const maxDuration = 60; // Maximum function execution time in seconds

interface RouteParams {
  params: {
    id: string;
  };
}

// Helper function to ensure a directory exists
async function ensureDirectoryExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

// Helper function to delete a file from filesystem
async function deleteFile(filePath: string): Promise<boolean> {
  try {
    if (!filePath) return false;
    
    // Convert web path to filesystem path
    const fullPath = path.join(process.cwd(), 'public', filePath);
    
    if (existsSync(fullPath)) {
      await unlink(fullPath);
      console.log(`Deleted file: ${fullPath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    return false;
  }
}

// Helper function to save a file, keeping the same path for overwrites
async function saveFile(file: File, username: string, prefix: string, fileType: string, existingPath?: string): Promise<string> {
  try {
    // Generate base directories
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', username, 'branding');
    const typeDir = path.join(uploadDir, fileType);
    
    // Ensure directories exist
    await ensureDirectoryExists(uploadDir);
    await ensureDirectoryExists(typeDir);
    
    // If we have an existing path and want to overwrite, extract the filename
    let fileName;
    if (existingPath) {
      const existingFileName = existingPath.split('/').pop();
      if (existingFileName) {
        fileName = existingFileName;
        console.log(`Reusing existing filename for overwrite: ${existingFileName}`);
      }
    }
    
    // If no existing filename or couldn't extract it, generate a new one
    if (!fileName) {
      const extension = path.extname(file.name);
      fileName = `${prefix}_${Date.now()}${extension}`;
    }
    
    const filePath = path.join(typeDir, fileName);
    console.log(`Saving file to: ${filePath}`);
    
    // Write the file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // Return a web-friendly path
    return `/uploads/${username}/branding/${fileType}/${fileName}`;
  } catch (error) {
    console.error(`Error saving file ${file.name}:`, error);
    throw error;
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  await dbConnect();
  
  try {
    const id = params.id;
    
    // Verify user exists and is an admin
    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'User is not an admin' }, 
        { status: 400 }
      );
    }
    
    const formData = await request.formData();
    console.log('Processing branding update for admin:', user.username);
    
    // Check for slider image deletion request
    const deleteSliderIndex = formData.get('deleteSliderIndex');
    if (deleteSliderIndex !== null) {
      const index = parseInt(deleteSliderIndex as string, 10);
      
      // Check if index is a valid number
      if (isNaN(index)) {
        return NextResponse.json({
          success: false,
          message: 'Invalid slider image index'
        }, { status: 400 });
      }
      
      // Get current slider images
      const sliderImages = [...(user.branding?.sliderImages || [])];
      
      // Check if index is within bounds
      if (index < 0 || index >= sliderImages.length) {
        return NextResponse.json({
          success: false,
          message: 'Invalid slider image index: out of bounds'
        }, { status: 400 });
      }
      
      // Ensure there will be at least one image remaining
      if (sliderImages.length <= 1) {
        return NextResponse.json({
          success: false,
          message: 'Cannot delete the only slider image. At least one image must remain.'
        }, { status: 400 });
      }
      
      // Get the image path to delete
      const imageToDelete = sliderImages[index];
      console.log(`Deleting slider image at index ${index}: ${imageToDelete}`);
      
      try {
        // Delete file from filesystem
        const deleted = await deleteFile(imageToDelete);
        if (!deleted) {
          console.warn(`File could not be deleted from filesystem: ${imageToDelete}`);
        }
        
        // Remove from array
        sliderImages.splice(index, 1);
        
        // Update user in database
        const updatedUser = await User.findByIdAndUpdate(
          id,
          { $set: { 'branding.sliderImages': sliderImages } },
          { new: true }
        );
        
        if (!updatedUser) {
          return NextResponse.json({
            success: false,
            message: 'Failed to update user after deleting slider image',
          }, { status: 500 });
        }
        
        return NextResponse.json({
          success: true,
          message: 'Slider image deleted successfully',
          sliderImages: updatedUser.branding?.sliderImages || []
        });
      } catch (error: any) {
        console.error('Error deleting slider image:', error);
        return NextResponse.json({
          success: false,
          message: 'Error deleting slider image',
          error: error.message
        }, { status: 500 });
      }
    }
    
    // Extract all form data
    const username = user.username;
    const brandName = formData.get('brandName') as string || user.branding?.brandName || '';
    const brandDescription = formData.get('brandDescription') as string || user.branding?.brandDescription || '';
    
    // Contact info
    const address = formData.get('address') as string || user.branding?.contactInfo?.address || '';
    const email = formData.get('email') as string || user.branding?.contactInfo?.email || '';
    const phone = formData.get('phone') as string || user.branding?.contactInfo?.phone || '';
    
    // Social links
    const facebook = formData.get('facebook') as string || user.branding?.contactInfo?.socialLinks?.facebook || '';
    const instagram = formData.get('instagram') as string || user.branding?.contactInfo?.socialLinks?.instagram || '';
    const twitter = formData.get('twitter') as string || user.branding?.contactInfo?.socialLinks?.twitter || '';
    const tiktok = formData.get('tiktok') as string || user.branding?.contactInfo?.socialLinks?.tiktok || '';
    const youtube = formData.get('youtube') as string || user.branding?.contactInfo?.socialLinks?.youtube || '';
    
    // About us
    const story = formData.get('story') as string || user.branding?.aboutUs?.story || '';
    const mission = formData.get('mission') as string || user.branding?.aboutUs?.mission || '';
    const vision = formData.get('vision') as string || user.branding?.aboutUs?.vision || '';
    
    // Build updated branding object
    const updatedBranding: any = {
      brandName,
      brandDescription,
      logoPath: user.branding?.logoPath || '',
      sliderImages: [...(user.branding?.sliderImages || [])],
      contactInfo: {
        address,
        email,
        phone,
        socialLinks: {
          facebook,
          instagram,
          twitter,
          tiktok,
          youtube
        }
      },
      aboutUs: {
        story,
        mission,
        vision,
        team: [...(user.branding?.aboutUs?.team || [])]
      }
    };
    
    // Process logo if uploaded
    const logo = formData.get('logo') as File | null;
    if (logo && logo instanceof File) {
      const logoPath = await saveFile(
        logo, 
        username, 
        'logo', 
        'logo', 
        user.branding?.logoPath // Pass existing path to overwrite it
      );
      
      console.log(`Logo updated: ${logoPath}`);
      updatedBranding.logoPath = logoPath;
    }
    
    // Process slider images
    for (let i = 0; i < 5; i++) {
      const sliderImage = formData.get(`slider_${i}`) as File | null;
      if (sliderImage && sliderImage instanceof File) {
        const sliderPath = await saveFile(
          sliderImage, 
          username, 
          `slider_${i}`, 
          'slider',
          updatedBranding.sliderImages[i]
        );
        
        // Update or add to slider images array
        if (i < updatedBranding.sliderImages.length) {
          updatedBranding.sliderImages[i] = sliderPath;
        } else {
          updatedBranding.sliderImages.push(sliderPath);
        }
        
        console.log(`Slider image ${i} updated:`, sliderPath);
      }
    }
    
    // Process team members
    const teamMembers: any[] = [];
    let teamIndex = 0;
    
    // Get existing team members to compare and handle deletions
    const existingTeam = user.branding?.aboutUs?.team || [];
    
    while (formData.has(`teamMember_${teamIndex}_name`) || formData.has(`teamMember_${teamIndex}_role`)) {
      const name = formData.get(`teamMember_${teamIndex}_name`) as string;
      const role = formData.get(`teamMember_${teamIndex}_role`) as string;
      
      if (name || role) {
        // Get existing photo path if available
        const existingPhotoPath = existingTeam[teamIndex]?.photoPath || '';
        
        // Process team photo if uploaded
        const teamPhoto = formData.get(`team_${teamIndex}`) as File | null;
        let photoPath = existingPhotoPath;
        
        if (teamPhoto && teamPhoto instanceof File) {
          photoPath = await saveFile(
            teamPhoto, 
            username, 
            `team_${teamIndex}`, 
            'team',
            existingPhotoPath
          );
          console.log(`Team photo ${teamIndex} updated:`, photoPath);
        }
        
        teamMembers.push({
          name: name || '',
          role: role || '',
          photoPath
        });
      }
      
      teamIndex++;
    }
    
    // Clean up: Delete photos for team members that were removed
    if (existingTeam.length > teamMembers.length) {
      for (let i = teamMembers.length; i < existingTeam.length; i++) {
        const photoPath = existingTeam[i]?.photoPath;
        if (photoPath) {
          const deleted = await deleteFile(photoPath);
          if (deleted) {
            console.log(`Deleted photo for removed team member at index ${i}: ${photoPath}`);
          }
        }
      }
    }
    
    // If we got team members, update the team array
    if (teamMembers.length > 0) {
      updatedBranding.aboutUs.team = teamMembers;
    }
    
    // Update the user's branding in the database
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { branding: updatedBranding } },
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: 'Failed to update user branding',
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Branding updated successfully',
      branding: updatedUser.branding
    });
    
  } catch (error: any) {
    console.error('Error updating branding:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update branding', error: error.message },
      { status: 500 }
    );
  }
} 