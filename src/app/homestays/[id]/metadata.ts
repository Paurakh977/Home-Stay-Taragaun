import { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import HomestaySingle from '@/lib/models/HomestaySingle';

// Generate metadata for individual homestay pages
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  await dbConnect();
  
  try {
    // Fetch the homestay data
    const homestay = await HomestaySingle.findOne({
      $or: [
        { homestayId: params.id },
        { slug: params.id }
      ]
    }).lean();
    
    if (!homestay) {
      return {
        title: 'Homestay Not Found',
        description: 'We could not find the homestay you were looking for.',
      };
    }
    
    // Create metadata based on homestay data
    const title = `${homestay.homeStayName} - Homestay in ${homestay.address.district.en}, Nepal`;
    
    const description = homestay.description 
      ? `${homestay.description.substring(0, 155)}...` 
      : `Experience authentic Nepali hospitality at ${homestay.homeStayName} in ${homestay.address.formattedAddress.en}. ${homestay.homeCount} homes, ${homestay.bedCount} beds.`;
    
    const hostingDistrict = homestay.address.district.en;
    const hostingRegion = homestay.address.province.en;
    
    // Custom keywords for this homestay
    const keywords = [
      'homestay', 
      'Nepal', 
      homestay.homeStayName,
      hostingDistrict, 
      hostingRegion, 
      'accommodation', 
      'authentic', 
      'travel',
      'tourism',
      homestay.address.municipality.en,
      'Nepali culture',
      homestay.villageName,
      homestay.homeStayType === 'community' ? 'community homestay' : 'private homestay',
    ];
    
    // Build Open Graph and Twitter image URLs
    const profileImage = homestay.profileImage 
      ? `https://hamrohomestay.com/api/images/${homestay.homestayId}/${homestay.homestayId}_profile.jpg` 
      : 'https://hamrohomestay.com/images/placeholder-homestay.jpg';
    
    return {
      title,
      description,
      keywords,
      alternates: {
        canonical: `https://hamrohomestay.com/homestays/${params.id}`,
      },
      openGraph: {
        title,
        description,
        url: `https://hamrohomestay.com/homestays/${params.id}`,
        siteName: 'Hamro Home Stay',
        images: [
          {
            url: profileImage,
            width: 1200,
            height: 630,
            alt: `${homestay.homeStayName} in ${homestay.address.formattedAddress.en}`,
          },
        ],
        locale: 'en_US',
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [profileImage],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    
    // Fallback metadata
    return {
      title: 'Homestay Details | Hamro Home Stay',
      description: 'View detailed information about this authentic Nepali homestay.',
    };
  }
} 