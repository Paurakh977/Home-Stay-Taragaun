import { MetadataRoute } from 'next';
import dbConnect from '@/lib/mongodb';
import HomestaySingle from '@/lib/models/HomestaySingle';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URLs that are static
  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: 'https://hamrohomestay.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://hamrohomestay.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://hamrohomestay.com/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://hamrohomestay.com/homestays',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  try {
    // Check if we're in build/static generation phase
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.NEXT_PHASE === 'phase-export';
    
    // During build time, return only static routes
    if (isBuildTime) {
      console.log('Build time detected, returning only static sitemap routes');
      return baseEntries;
    }
    
    // Connect to MongoDB only during runtime
    await dbConnect();

    // Get all published homestays for dynamic routes
    const homestays = await HomestaySingle.find({ status: 'approved' })
      .select('_id homestayId homeStayName adminUsername updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const homestayEntries = homestays.map((homestay: any) => {
      // Generate a slug from the name if not available in the database
      const slugFromName = homestay.homeStayName
        ? homestay.homeStayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        : '';
      
      // Determine URL based on availability of adminUsername
      let url;
      if (homestay.adminUsername) {
        url = `https://hamrohomestay.com/${homestay.adminUsername}/homestays/${homestay.homestayId}`;
      } else {
        url = `https://hamrohomestay.com/homestays/${homestay.homestayId}`;
      }
      
      return {
        url,
        lastModified: homestay.updatedAt || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });

    return [...baseEntries, ...homestayEntries];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return only static routes if there's an error
    return baseEntries;
  }
} 