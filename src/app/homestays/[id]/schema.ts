import HomestaySingle from '@/lib/models/HomestaySingle';
import Official from '@/lib/models/Official';
import Contact from '@/lib/models/Contact';

type HomestayWithRelated = {
  homestay: any;
  officials: any[];
  contacts: any[];
};

export function generateHomestayStructuredData(data: HomestayWithRelated) {
  const { homestay, officials, contacts } = data;
  
  if (!homestay) return null;
  
  // Get primary contact information if available
  const primaryContact = contacts && contacts.length > 0 ? contacts[0] : null;
  
  // Get official information if available
  const officialNames = officials && officials.length > 0 
    ? officials.map((official) => official.name)
    : [];
  
  // Format address properly
  const address = homestay.address;
  const formattedAddress = `${address.tole}, ${address.city || ''}, ${address.municipality.en}, ${address.district.en}, ${address.province.en}, Nepal`;
  
  // Prepare structured data
  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": homestay.homeStayName,
    "description": homestay.description || `Authentic homestay experience in ${homestay.address.formattedAddress.en}`,
    "url": typeof window !== 'undefined' ? window.location.href : `https://hamrohomestay.com/homestays/${homestay.homestayId}`,
    "telephone": primaryContact?.mobile || "",
    "email": primaryContact?.email || "",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": homestay.address.city || homestay.address.municipality.en,
      "addressRegion": homestay.address.district.en,
      "addressCountry": "Nepal",
      "streetAddress": `${homestay.address.tole}, Ward ${homestay.address.ward.en}`
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "0", // Placeholder - to be replaced with actual data when available
      "longitude": "0"  // Placeholder - to be replaced with actual data when available
    },
    "starRating": {
      "@type": "Rating",
      "ratingValue": homestay.averageRating.toString(),
      "bestRating": "5"
    },
    "priceRange": "$$", // Placeholder - adjust based on actual pricing data
    "numberOfRooms": homestay.roomCount,
    "amenityFeature": [
      ...homestay.features.localAttractions.map((attraction: string) => ({
        "@type": "LocationFeatureSpecification",
        "name": attraction,
        "value": true
      })),
      ...homestay.features.tourismServices.map((service: string) => ({
        "@type": "LocationFeatureSpecification",
        "name": service,
        "value": true
      })),
      ...homestay.features.infrastructure.map((item: string) => ({
        "@type": "LocationFeatureSpecification",
        "name": item,
        "value": true
      }))
    ],
    "image": homestay.profileImage 
      ? `https://hamrohomestay.com/api/images/${homestay.homestayId}/${homestay.homestayId}_profile.jpg`
      : "https://hamrohomestay.com/images/placeholder-homestay.jpg",
    "sameAs": [
      // Social media links - include based on availability
      primaryContact?.facebook ? primaryContact.facebook : null,
      primaryContact?.instagram ? primaryContact.instagram : null,
      primaryContact?.twitter ? primaryContact.twitter : null
    ].filter(Boolean),
    "areaServed": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "Nepal",
        "addressRegion": homestay.address.province.en
      },
      "name": homestay.address.district.en
    },
    // Add location keywords as full text for search engines to parse
    "keywords": `homestay Nepal ${homestay.homeStayName} ${homestay.address.district.en} ${homestay.address.province.en} accommodation ${homestay.address.municipality.en} ${homestay.address.city || ''} authentic travel tourism ${homestay.villageName || ''}`,
    // Enhanced location data with additional descriptions
    "location": {
      "@type": "Place",
      "name": `${homestay.homeStayName} in ${homestay.address.district.en}`,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": homestay.address.city || homestay.address.municipality.en,
        "addressRegion": homestay.address.district.en,
        "addressCountry": "Nepal",
        "streetAddress": `${homestay.address.tole}, Ward ${homestay.address.ward.en}`
      },
      "hasMap": "https://maps.google.com/?q=" + encodeURIComponent(formattedAddress),
      "description": `Located in ${homestay.address.municipality.en}, ${homestay.address.district.en}, Nepal. Nearby ${homestay.villageName || homestay.address.city || 'local attractions'}. Perfect for travelers exploring ${homestay.address.province.en}.`
    },
    "makesOffer": {
      "@type": "Offer",
      "name": "Authentic Homestay Experience",
      "description": `Experience authentic Nepali hospitality at ${homestay.homeStayName}`,
      "availability": "https://schema.org/InStock",
      "priceSpecification": {
        "@type": "PriceSpecification",
        "priceCurrency": "NPR"
      }
    }
  };
  
  // Add employee information if available
  if (officials && officials.length > 0) {
    structuredData.employee = officials.map((official) => ({
      "@type": "Person",
      "name": official.name,
      "jobTitle": official.role,
      "telephone": official.contactNo
    }));
  }
  
  return structuredData;
} 