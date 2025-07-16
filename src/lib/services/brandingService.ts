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
      featuredSection: {
        features: adminUser.branding.featuredSection?.features?.map((feature: any) => ({
          icon: feature.icon || '',
          title: feature.title || '',
          description: feature.description || '',
          imagePath: feature.imagePath ? `${feature.imagePath}` : '',
        })) || getDefaultBranding().featuredSection?.features || []
      },
      testimonials: adminUser.branding.testimonials?.map((testimonial: any) => ({
        quote: testimonial.quote || '',
        author: testimonial.author || '',
        location: testimonial.location || '',
        avatarPath: testimonial.avatarPath ? `${testimonial.avatarPath}` : '',
      })) || getDefaultBranding().testimonials || [],
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
    featuredSection: {
      features: [
        {
          icon: '🏠',
          title: 'Authentic Local Experience',
          description: 'Stay with local families and experience authentic Nepali hospitality and culture.',
          imagePath: '/images/features/feature-1.jpg'
        },
        {
          icon: '🍽️',
          title: 'Traditional Cuisine',
          description: 'Enjoy homemade Nepali dishes prepared with locally sourced organic ingredients.',
          imagePath: '/images/features/feature-2.jpg'
        },
        {
          icon: '🌿',
          title: 'Scenic Locations',
          description: 'Our home stays are situated in beautiful locations with stunning mountain views.',
          imagePath: '/images/features/feature-3.jpg'
        },
        {
          icon: '🧳',
          title: 'Personalized Service',
          description: 'Each home stay offers personalized service to make your stay comfortable and memorable.',
          imagePath: '/images/features/feature-4.jpg'
        }
      ]
    },
    testimonials: [
      {
        quote: 'Our stay at the Hamro Home Stay was incredible. The hospitality was unmatched, and we felt like part of the family. The views were breathtaking!',
        author: 'Sarah Johnson',
        location: 'United States',
        avatarPath: '/images/testimonials/avatar-1.jpg'
      },
      {
        quote: 'The authentic food, the warm hospitality, and the cultural experience made our stay unforgettable. Definitely coming back next year!',
        author: 'James Wilson',
        location: 'United Kingdom',
        avatarPath: '/images/testimonials/avatar-2.jpg'
      },
      {
        quote: 'If you want to experience the real Nepal, this is the place. Our host family was amazing, and the home-cooked meals were the best we had during our entire trip.',
        author: 'Emma Thompson',
        location: 'Australia',
        avatarPath: '/images/testimonials/avatar-3.jpg'
      },
      {
        quote: 'The perfect blend of comfort and authentic cultural experience. Waking up to mountain views every morning was magical!',
        author: 'David Chen',
        location: 'Canada',
        avatarPath: '/images/testimonials/avatar-4.jpg'
      }
    ],
    _fetchedAt: Date.now()
  };
} 