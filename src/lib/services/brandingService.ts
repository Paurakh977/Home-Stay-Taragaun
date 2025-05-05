import { User } from '@/lib/models';
import dbConnect from '@/lib/mongodb';
import { BrandingData } from '@/context/BrandingContext';

/**
 * Fetches branding data for a specific admin
 * @param adminUsername The username of the admin
 * @returns The branding data or default values if not found
 */
export async function getBrandingByAdminUsername(adminUsername: string): Promise<BrandingData> {
  try {
    console.log(`Fetching branding data for admin: ${adminUsername} at ${new Date().toISOString()}`);
    await dbConnect();
    
    // Find the admin user - use a query with a timestamp to avoid MongoDB query cache
    const timestamp = Date.now();
    const adminUser = await User.findOne({ 
      username: adminUsername,
      role: 'admin',
    }, null, { maxTimeMS: 30000, lean: true })
    .lean();
    
    if (!adminUser || !adminUser.branding) {
      console.warn(`Branding data not found for admin: ${adminUsername}`);
      return getDefaultBranding();
    }
    
    // Add a timestamp to image paths to force browser refresh
    const logoPath = adminUser.branding.logoPath ? 
      `${adminUser.branding.logoPath}` : '';
    
    const sliderImages = adminUser.branding.sliderImages ? 
      adminUser.branding.sliderImages.map(img => `${img}`) : [];
    
    // Prepare team members with timestamped photo paths
    const team = adminUser.branding.aboutUs?.team?.map((member: any) => ({
      name: member.name || '',
      role: member.role || '',
      photoPath: member.photoPath ? `${member.photoPath}` : '',
    })) || [];
    
    console.log(`Successfully fetched branding data for admin: ${adminUsername}`);
    
    // Return the branding data
    return {
      brandName: adminUser.branding.brandName || '',
      brandDescription: adminUser.branding.brandDescription || '',
      logoPath,
      sliderImages,
      contactInfo: {
        address: adminUser.branding.contactInfo?.address || '',
        email: adminUser.branding.contactInfo?.email || '',
        phone: adminUser.branding.contactInfo?.phone || '',
        socialLinks: {
          facebook: adminUser.branding.contactInfo?.socialLinks?.facebook || '',
          instagram: adminUser.branding.contactInfo?.socialLinks?.instagram || '',
          twitter: adminUser.branding.contactInfo?.socialLinks?.twitter || '',
          tiktok: adminUser.branding.contactInfo?.socialLinks?.tiktok || '',
          youtube: adminUser.branding.contactInfo?.socialLinks?.youtube || '',
        }
      },
      aboutUs: {
        story: adminUser.branding.aboutUs?.story || '',
        mission: adminUser.branding.aboutUs?.mission || '',
        vision: adminUser.branding.aboutUs?.vision || '',
        team
      },
      _fetchedAt: Date.now() // Add timestamp for debugging purposes
    };
  } catch (error) {
    console.error('Error fetching branding data:', error);
    return getDefaultBranding();
  }
}

/**
 * Returns default branding data
 */
function getDefaultBranding(): BrandingData {
  return {
    brandName: 'Hamro Home Stay',
    brandDescription: 'Experience authentic Nepali hospitality',
    logoPath: '/images/default-logo.png',
    sliderImages: ['/images/default-slider.jpg'],
    contactInfo: {
      address: 'Kathmandu, Nepal',
      email: 'info@hamrohomestay.com',
      phone: '+977 1234567890',
      socialLinks: {
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
      }
    },
    aboutUs: {
      story: 'Our homestay service aims to provide authentic experiences.',
      mission: 'To connect travelers with authentic local experiences.',
      vision: 'Creating memorable cultural exchanges through hospitality.',
      team: []
    },
    _fetchedAt: Date.now()
  };
} 