"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, MapPin, Star, Home, Users, Bed, Calendar, Phone, Mail, Globe, Navigation, ArrowLeft, Heart, Map, Check, ExternalLink } from "lucide-react";
import { getApiImageUrl } from "./layout";

// Define interfaces for typing
interface GalleryImage {
  src: string;
  alt: string;
}

interface HomestayData {
  _id: string;
  homestayId?: string;
  homeStayName: string;
  description?: string;
  address: {
    formattedAddress: {
      en: string;
      ne?: string;
    };
    province?: { en: string; ne?: string };
    district?: { en: string; ne?: string };
    municipality?: { en: string; ne?: string };
    ward?: { en: string; ne?: string };
    city?: string;
    tole?: string;
  };
  contacts?: {
    name: string;
    mobile: string;
    email?: string;
  }[];
  officials?: {
    name: string;
    role: string;
    contactNo: string;
  }[];
  gallery?: any[];
  galleryImages?: string[];
  latitude?: number;
  longitude?: number;
  homestayType?: 'Community Homestay' | 'Private Homestay';
  homeStayType?: 'community' | 'private';
  dhsrNo?: string;
  village?: string;
  villageName?: string;
  roomCount?: number;
  bedCount?: number;
  homeCount?: number;
  profileImage?: string;
  rating?: number;
  ratingCount?: number;
  averageRating?: number;
  reviewCount?: number;
  localAttractions?: string[] | { name: string; category?: string }[];
  tourismServices?: string[];
  infrastructure?: string[];
  features?: {
    localAttractions?: string[];
    tourismServices?: string[];
    infrastructure?: string[];
  };
  directions?: string;
  status?: string;
  testimonials?: {
    name: string;
    location: string;
    rating: number;
    quote: string;
    photoPath: string;
    date: string | Date;
  }[];
  pageContent?: {
    heroSection?: {
      slogan?: string;
      welcomeMessage?: string;
    };
    whyChooseUs?: string[];
  };
  teamMembers?: {
    name: string;
    position: string;
    contactNo?: string;
    photoPath: string;
    bio: string;
    order: number;
  }[];
  destinations?: {
    name: string;
    description: string;
    distance: string;
    image: string;
    category: string;
    highlights: string[];
  }[];
}

// Define interface for testimonial
interface Testimonial {
  name: string;
  location: string;
  rating: number;
  quote: string;
  photoPath: string;
  date: string | Date;
}

// Helper function to provide static data
function getStaticHomestayData(): HomestayData {
  return {
    _id: "static-id",
    homeStayName: "Peaceful Village Homestay",
    description: "Experience the authentic Nepali village lifestyle at our peaceful homestay. Our family-run accommodations offer a unique opportunity to immerse yourself in local culture, traditions, and daily life.",
    address: {
      formattedAddress: { 
        en: "Thamel, Kathmandu, Ward 7, Kathmandu Municipality, Kathmandu, Bagmati",
        ne: "ठमेल, काठमाडौं, वडा ७, काठमाडौं नगरपालिका, काठमाडौं, बागमती"
      },
      province: { en: "Bagmati", ne: "बागमती" },
      district: { en: "Kathmandu", ne: "काठमाडौं" },
      municipality: { en: "Kathmandu", ne: "काठमाडौं" },
      ward: { en: "7", ne: "७" },
      city: "Kathmandu",
      tole: "Thamel",
    },
    latitude: 28.2096,
    longitude: 83.9856,
    contacts: [
      {
        name: "Ram Bahadur",
        mobile: "+977-9812345678",
        email: "contact@peacefulvillagehomestay.com"
      }
    ],
    officials: [
      {
        name: "Shyam Kumar",
        role: "Manager",
        contactNo: "+977-9807654321"
      }
    ],
    features: {
      localAttractions: [
        "Nepal's deepest and widest Narayani River",
        "Fish Pond",
        "Indigenous Tharu Museum",
        "Royal Bengal Tiger",
        "Eco-tourism based exploration",
        "Fishing in the fish pond",
        "Elephant Bathing"
      ],
      tourismServices: [
        "Comfortable Accommodation",
        "Cultural Dance Performances",
        "Traditional Cooking Classes",
        "Gift or Souvenir",
        "Local Handicraft Workshops",
        "Guided Village Tours"
      ],
      infrastructure: [
        "Clean Drinking Water",
        "Guest Room, Toilet, Bathroom",
        "24/7 Electricity with Backup",
        "Wi-Fi Internet",
        "Hot Water",
        "Transportation Facility"
      ]
    },
    localAttractions: [
      { name: "Local Temple", category: "Cultural" },
      { name: "Mountain Viewpoint", category: "Nature" },
      { name: "Traditional Village", category: "Cultural" },
      { name: "Waterfall", category: "Nature" }
    ],
    homestayType: 'Community Homestay',
    homeStayType: 'community',
    villageName: "Peaceful Village",
    dhsrNo: "P-3-0-003-9",
    status: "approved",
    averageRating: 4.7,
    rating: 4.7,
    reviewCount: 24,
    ratingCount: 24,
    roomCount: 5,
    bedCount: 8,
    homeCount: 3,
    directions: "From Thamel, head north for 500 meters. Turn right at the main temple and follow the path for 200 meters. Our homestay is the blue house with a traditional wooden gate.",
    testimonials: [
      {
        name: "Sarah Johnson",
        location: "United States",
        rating: 5,
        quote: "My stay here was incredible! The hosts were warm and welcoming, and I learned so much about the local culture.",
        photoPath: "/images/testimonials/guest1.jpg",
        date: new Date().toISOString()
      },
      {
        name: "Michael Chen",
        location: "Canada",
        rating: 4,
        quote: "A truly authentic experience. The food was amazing and the natural surroundings are breathtaking.",
        photoPath: "/images/testimonials/guest2.jpg",
        date: new Date().toISOString()
      },
      {
        name: "Emma Wilson",
        location: "Australia",
        rating: 5,
        quote: "The homestay offers a perfect blend of comfort and cultural immersion. I'll definitely be back!",
        photoPath: "/images/testimonials/guest3.jpg",
        date: new Date().toISOString()
      }
    ],
    pageContent: {
      heroSection: {
        slogan: "Experience the Authenticity of Nepal",
        welcomeMessage: "Welcome to Peaceful Village Homestay"
      },
      whyChooseUs: [
        "Authentic local experience",
        "Beautiful natural surroundings",
        "Traditional homemade meals",
        "Cultural activities and workshops"
      ]
    },
    teamMembers: [
      {
        name: "Ram Bahadur",
        position: "Manager",
        contactNo: "+977-9812345678",
        photoPath: "/images/team/ram.jpg",
        bio: "Ram has been managing the homestay for over 10 years. He loves sharing his knowledge about the local culture and traditions.",
        order: 1
      },
      {
        name: "Shyam Kumar",
        position: "Assistant Manager",
        contactNo: "+977-9807654321",
        photoPath: "/images/team/shyam.jpg",
        bio: "Shyam is a local expert who loves to share his knowledge about the Nepali culture and history.",
        order: 2
      }
    ],
    destinations: [
      {
        name: "Kathmandu",
        description: "The capital city of Nepal",
        distance: "15 minutes drive",
        image: "/images/destinations/kathmandu.jpg",
        category: "City",
        highlights: ["Thamel", "Swayambhunath", "Boudhanath"]
      },
      {
        name: "Pokhara",
        description: "A beautiful city by the lake",
        distance: "4 hours drive",
        image: "/images/destinations/pokhara.jpg",
        category: "Nature",
        highlights: ["Fewa Lake", "Sarangkot", "Gupteshwor Cave"]
      },
      {
        name: "Chitwan",
        description: "A national park known for its one-horned rhinoceros",
        distance: "6 hours drive",
        image: "/images/destinations/chitwan.jpg",
        category: "Nature",
        highlights: ["Elephant Safari", "Tharu Cultural Show", "Bird Watching"]
      }
    ]
  };
}

// Add this helper function to generate star rating display
const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star className="w-4 h-4 text-yellow-400" />
          <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4 text-yellow-400" />
      ))}
    </div>
  );
};

// Add default testimonials when no data is available
const defaultTestimonials = [
  {
    name: "Sarah Johnson",
    location: "United States",
    rating: 5,
    quote: "My stay here was incredible! The hosts were warm and welcoming, and I learned so much about the local culture.",
    photoPath: "/images/testimonials/guest1.jpg",
    date: new Date().toISOString()
  },
  {
    name: "Michael Chen",
    location: "Canada",
    rating: 4,
    quote: "A truly authentic experience. The food was amazing and the natural surroundings are breathtaking.",
    photoPath: "/images/testimonials/guest2.jpg",
    date: new Date().toISOString()
  },
  {
    name: "Emma Wilson",
    location: "Australia",
    rating: 5,
    quote: "The homestay offers a perfect blend of comfort and cultural immersion. I'll definitely be back!",
    photoPath: "/images/testimonials/guest3.jpg",
    date: new Date().toISOString()
  }
];

export default function HomestayDetailPage() {
  const router = useRouter();
  const params = useParams();
  const homestayId = params.id as string;

  // State for the homestay data
  const [homestay, setHomestay] = useState<HomestayData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Gallery state
  const [showGallery, setShowGallery] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  
  // Active tab state with more meaningful tabs
  const [activeTab, setActiveTab] = useState<'amenities' | 'attractions' | 'location' | 'contact'>('amenities');
  
  // Combine data and ensure it exists
  const infrastructure = useMemo(() => 
    homestay?.features?.infrastructure || homestay?.infrastructure || [], 
  [homestay]);
  
  const tourismServices = useMemo(() => 
    homestay?.features?.tourismServices || homestay?.tourismServices || [], 
  [homestay]);
  
  const localAttractions = useMemo(() => {
    const attractions = homestay?.features?.localAttractions || homestay?.localAttractions || [];
    if (Array.isArray(attractions)) {
      return attractions.map(attraction => {
        if (typeof attraction === 'string') {
          return { name: attraction, category: null };
        } else {
          return attraction;
        }
      });
    }
    return [];
  }, [homestay]);
  
  // Contact and Officials data
  const contacts = useMemo(() => {
    return homestay?.contacts || [];
  }, [homestay]);
  
  const officials = useMemo(() => {
    return homestay?.officials || [];
  }, [homestay]);
  
  // State for testimonials - properly typed
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  // Helper function to prepare gallery images from different data formats
  const prepareGalleryImages = (data: HomestayData): GalleryImage[] => {
    let images: GalleryImage[] = [];
    
    console.log("PrepareGalleryImages - homestay data:", {
      id: data.homestayId || data._id,
      name: data.homeStayName,
      profileImage: data.profileImage,
      galleryImagesCount: data.galleryImages?.length || 0
    });
    
    // Check for galleryImages array (standard format from API)
    if (data.galleryImages && data.galleryImages.length > 0) {
      console.log("PrepareGalleryImages - Using galleryImages from API", data.galleryImages);
      images = data.galleryImages.map((img: string) => {
        const imgSrc = getApiImageUrl(img);
        console.log(`PrepareGalleryImages - Transformed ${img} to ${imgSrc}`);
        return {
          src: imgSrc,
          alt: data.homeStayName || 'Homestay Image'
        };
      });
    }
    // Fallback to gallery array if galleryImages is not available
    else if (data.gallery && data.gallery.length > 0) {
      console.log("PrepareGalleryImages - Using gallery array fallback", data.gallery);
      images = data.gallery.map((img: any) => {
        // Handle different possible formats in the gallery
        if (typeof img === 'string') {
          const imgSrc = getApiImageUrl(img);
          console.log(`PrepareGalleryImages - String format: Transformed ${img} to ${imgSrc}`);
          return { src: imgSrc, alt: data.homeStayName || 'Homestay Image' };
        } else if (img.image) {
          const imgSrc = getApiImageUrl(img.image);
          console.log(`PrepareGalleryImages - Object.image format: Transformed ${img.image} to ${imgSrc}`);
          return { src: imgSrc, alt: img.caption || data.homeStayName || 'Homestay Image' };
        } else if (img.src) {
          const imgSrc = getApiImageUrl(img.src);
          console.log(`PrepareGalleryImages - Object.src format: Transformed ${img.src} to ${imgSrc}`);
          return { src: imgSrc, alt: img.alt || data.homeStayName || 'Homestay Image' };
        }
        // Default case if the structure is unexpected
        console.log("PrepareGalleryImages - Unknown format for gallery item:", img);
        return { src: '', alt: 'Homestay Image' };
      }).filter(img => img.src); // Filter out any images with empty src
    }
    
    // If gallery is empty, use profile image if available
    if (images.length === 0 && data.profileImage) {
      console.log("PrepareGalleryImages - Using profile image as fallback:", data.profileImage);
      const profileImgSrc = getApiImageUrl(data.profileImage);
      console.log(`PrepareGalleryImages - Transformed profile ${data.profileImage} to ${profileImgSrc}`);
      images.push({ src: profileImgSrc, alt: data.homeStayName || 'Homestay Profile Image' });
    }
    
    // If still no images, use high-quality fallback images
    if (images.length === 0) {
      console.log("PrepareGalleryImages - No images found, using default placeholder images");
      images = [
        { src: '/images/homestay-placeholder-1.jpg', alt: 'Homestay' },
        { src: '/images/homestay-placeholder-2.jpg', alt: 'Homestay' },
        { src: '/images/homestay-placeholder-3.jpg', alt: 'Homestay' },
        { src: '/images/destinations/kathmandu.jpg', alt: 'Kathmandu Valley' },
        { src: '/images/destinations/pokhara.jpg', alt: 'Pokhara' },
        { src: '/images/destinations/chitwan.jpg', alt: 'Chitwan National Park' }
      ];
      
      // Log that we're using default images
      console.log("Using default gallery images for homestay:", data.homeStayName);
    }
    
    console.log("PrepareGalleryImages - Final image count:", images.length);
    return images;
  };
  
  // Next and previous controls for the slider
  const nextSlide = () => {
    setCurrentImageIndex((prevSlide) => (prevSlide + 1) % galleryImages.length);
  };

  const prevSlide = () => {
    setCurrentImageIndex((prevSlide) => (prevSlide - 1 + galleryImages.length) % galleryImages.length);
  };
  
  // Auto-slide functionality
  useEffect(() => {
    if (galleryImages.length <= 1) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(interval);
  }, [galleryImages.length]);

  // Fetch the homestay data
  useEffect(() => {
    const fetchHomestayData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/homestays/${homestayId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch homestay data: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Properly handle the API response structure
        let homestayData: HomestayData;
        
        if (data.homestay) {
          // If data comes in the expected format with a homestay object
          homestayData = data.homestay;
          
          // Make sure contacts and officials are added to the homestay object
          if (data.contacts) {
            homestayData.contacts = data.contacts;
          }
          
          if (data.officials) {
            homestayData.officials = data.officials;
          }
          
          // Set testimonials
          setTestimonials(homestayData.testimonials || defaultTestimonials);
        } else {
          // For backward compatibility if the data is returned directly
          homestayData = data;
          
          // Set testimonials
          setTestimonials(data.testimonials || defaultTestimonials);
        }
        
        // Only use static data for missing critical fields
        if (!homestayData.homeStayName) {
          console.warn("Homestay missing critical fields, using some static data");
          const staticData = getStaticHomestayData();
          homestayData.homeStayName = homestayData.homeStayName || staticData.homeStayName;
          homestayData.address = homestayData.address || staticData.address;
          
          // Set testimonials
          setTestimonials(staticData.testimonials || defaultTestimonials);
        }
        
        setHomestay(homestayData);
        setGalleryImages(prepareGalleryImages(homestayData));
        setError(null);
      } catch (err) {
        console.error("Error fetching homestay data:", err);
        setError("Failed to load homestay data. Using fallback data.");
        
        // Use static data as fallback only when the API fails
        const staticData = getStaticHomestayData();
        setHomestay(staticData);
        setGalleryImages(prepareGalleryImages(staticData));
        
        // Set testimonials
        setTestimonials(defaultTestimonials);
      } finally {
        setLoading(false);
      }
    };

    if (homestayId) {
      fetchHomestayData();
    }
  }, [homestayId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!homestay) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Homestay Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "We couldn't find the homestay you're looking for."}</p>
          <button 
            onClick={() => router.push('/')}
            className="inline-block bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Format homestay type for display
  const displayHomestayType = homestay.homestayType || 
    (homestay.homeStayType === 'community' ? 'Community Homestay' : 'Private Homestay');

  // Get rating for display
  const rating = homestay.rating || homestay.averageRating || 0;
  const ratingCount = homestay.ratingCount || homestay.reviewCount || 0;
  
  // Testimonials section (add this code at an appropriate location in the component)
  const renderTestimonialsSection = () => {
    if (!testimonials || testimonials.length === 0) return null;
    
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Guest Experiences</h2>
            <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
              Here's what our guests have to say about their stay with us
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 rounded-full overflow-hidden mr-3">
                      <Image 
                        src={testimonial.photoPath || '/images/avatar-placeholder.png'} 
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.location}</p>
                    </div>
                  </div>
                  
                  <StarRating rating={testimonial.rating} />
                  
                  <p className="mt-3 text-gray-700 italic">"{testimonial.quote}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button - Minimal and Clean */}
      <div className="container mx-auto px-4 py-4">
        <button 
          onClick={() => router.back()} 
          className="flex items-center text-gray-600 hover:text-primary transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          <span className="text-sm font-medium">Back to Homestays</span>
        </button>
      </div>

      {/* Hero Section - Modern and Eye-Catching */}
      <div className="relative mb-16">
        {/* Main Image with Overlay Gradient */}
        <div className="relative h-[60vh] overflow-hidden">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
                index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />
          
          {/* Image navigation controls */}
          {galleryImages.length > 1 && (
            <>
              <button 
                onClick={prevSlide} 
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-20 transition-all hover:scale-110"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={nextSlide} 
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-20 transition-all hover:scale-110"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              
              {/* Indicator dots */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                {galleryImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === currentImageIndex ? "bg-white scale-110" : "bg-white/50"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Save button */}
          <button className="absolute top-6 right-6 z-10 rounded-full bg-white/20 backdrop-blur-sm p-3 hover:bg-white/30 transition-colors">
            <Heart size={20} className="text-white" />
          </button>
        </div>
        
        {/* Hero Content - Floating Card */}
        <div className="container mx-auto px-4 relative -mt-32">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
              {/* Profile Image - Higher Quality & Circular */}
              <div className="lg:mr-6 mb-4 lg:mb-0 flex-shrink-0">
                <div className="relative h-28 w-28 lg:h-36 lg:w-36 rounded-full overflow-hidden border-4 border-white shadow-md -mt-20 bg-white">
                  <Image
                    src={homestay.profileImage ? getApiImageUrl(homestay.profileImage) : '/images/homestay-placeholder-1.jpg'}
                    alt={homestay.homeStayName}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              
              {/* Main Details - Clean Layout */}
              <div className="flex-grow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{homestay.homeStayName}</h1>
                    {/* Display hero section slogan from database */}
                    {homestay.pageContent?.heroSection?.slogan && (
                      <p className="text-primary text-lg font-medium mb-2">{homestay.pageContent.heroSection.slogan}</p>
                    )}
                    {/* Display welcome message from database */}
                    {homestay.pageContent?.heroSection?.welcomeMessage && (
                      <p className="text-gray-700 mb-3">{homestay.pageContent.heroSection.welcomeMessage}</p>
                    )}
                    <p className="text-gray-600 mb-3 flex items-center">
                      <MapPin size={16} className="mr-2 text-gray-500 flex-shrink-0" />
                      {homestay.address.formattedAddress.en}
                    </p>
                    
                    {/* Badges - Modern and Clean */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {displayHomestayType && (
                        <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-700">
                          {displayHomestayType}
                        </span>
                      )}
                      
                      {homestay.dhsrNo && (
                        <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                          DHSR: {homestay.dhsrNo}
                        </span>
                      )}

                      {(homestay.villageName || homestay.village) && (
                        <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                          {homestay.villageName || homestay.village}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Rating - Visual Appeal */}
                  <div className="lg:text-right">
                    <div className="inline-flex items-center gap-1 bg-yellow-50 px-3 py-2 rounded-lg">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={16} 
                            className={star <= Math.round(rating) 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-gray-300"
                            } 
                          />
                        ))}
                      </div>
                      <span className="font-bold text-gray-700 ml-1">{rating.toFixed(1)}</span>
                      <span className="text-sm text-gray-500">({ratingCount})</span>
                    </div>
                  </div>
                </div>
                
                {/* Capacity Details - Clear Visual Icons */}
                <div className="grid grid-cols-3 gap-4 my-6 bg-gray-50 rounded-xl p-4">
                  <div className="flex flex-col items-center text-center">
                    <Home size={20} className="mb-2 text-primary" />
                    <span className="font-bold text-xl text-gray-800">{homestay.homeCount || 0}</span>
                    <span className="text-xs text-gray-500">Homes</span>
                  </div>
                  
                  <div className="flex flex-col items-center text-center">
                    <Users size={20} className="mb-2 text-primary" />
                    <span className="font-bold text-xl text-gray-800">{homestay.roomCount || 0}</span>
                    <span className="text-xs text-gray-500">Rooms</span>
                  </div>
                  
                  <div className="flex flex-col items-center text-center">
                    <Bed size={20} className="mb-2 text-primary" />
                    <span className="font-bold text-xl text-gray-800">{homestay.bedCount || 0}</span>
                    <span className="text-xs text-gray-500">Beds</span>
                  </div>
                </div>
                
                {/* Description - Clean and Concise */}
                <div className="mt-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">Welcome to {homestay.homeStayName}</h2>
                  <p className="text-gray-700 line-clamp-3">
                    {homestay.description || "Experience the authentic local lifestyle at our homestay. Enjoy comfortable accommodations, homemade meals, and cultural experiences in a family environment."}
                  </p>
                  {homestay.description && homestay.description.length > 240 && (
                    <button className="text-primary hover:text-primary-dark font-medium text-sm mt-1">
                      Read more
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="container mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section - Main Content */}
          <div className="lg:col-span-2">
            {/* Photo Gallery Section - Clean Grid */}
            <div className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">Photo Gallery</h2>
              </div>
              <div className="grid grid-cols-3 gap-2 p-2">
                {galleryImages.slice(0, 6).map((image, index) => (
                  <div 
                    key={index} 
                    className={`relative overflow-hidden ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
                    style={{height: index === 0 ? '320px' : '160px'}}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => { setCurrentImageIndex(index); setShowGallery(true); }}
                    />
                    {index === 5 && galleryImages.length > 6 && (
                      <div 
                        className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer"
                        onClick={() => setShowGallery(true)}
                      >
                        <span className="text-white font-medium">+{galleryImages.length - 6} more</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs Section - Modern Design */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
              <div className="border-b">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('amenities')}
                    className={`px-6 py-4 font-medium text-sm transition-colors ${
                      activeTab === 'amenities' 
                        ? 'border-b-2 border-primary text-primary' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Amenities
                  </button>
                  <button
                    onClick={() => setActiveTab('attractions')}
                    className={`px-6 py-4 font-medium text-sm transition-colors ${
                      activeTab === 'attractions' 
                        ? 'border-b-2 border-primary text-primary' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Local Attractions
                  </button>
                  <button
                    onClick={() => setActiveTab('location')}
                    className={`px-6 py-4 font-medium text-sm transition-colors ${
                      activeTab === 'location' 
                        ? 'border-b-2 border-primary text-primary' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Location
                  </button>
                  <button
                    onClick={() => setActiveTab('contact')}
                    className={`px-6 py-4 font-medium text-sm transition-colors ${
                      activeTab === 'contact' 
                        ? 'border-b-2 border-primary text-primary' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Contact
                  </button>
                </div>
              </div>
              
              {/* Tab content */}
              <div className="p-6">
                {activeTab === 'amenities' && (
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Infrastructure */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                          <Home className="h-4 w-4 text-primary" />
                        </div>
                        Infrastructure
                      </h3>
                      <ul className="space-y-3">
                        {infrastructure.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Tourism Services */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        Tourism Services
                      </h3>
                      <ul className="space-y-3">
                        {tourismServices.map((service, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{service}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'attractions' && (
                  <div>
                    <h3 className="text-xl font-semibold mb-6">Nearby Attractions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {localAttractions.map((attraction, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-medium text-gray-800">{attraction.name}</h4>
                            {attraction.category && (
                              <span className="text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded">
                                {attraction.category}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'location' && (
                  <div>
                    {/* Address */}
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-4">Address</h3>
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-gray-700">{homestay.address.formattedAddress.en}</p>
                          {homestay.address.formattedAddress.ne && (
                            <p className="text-gray-600 mt-1 font-nepali">{homestay.address.formattedAddress.ne}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Map with Directions */}
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-4">Map</h3>
                      <div className="relative bg-gray-100 h-80 rounded-lg overflow-hidden">
                        {homestay.latitude && homestay.longitude ? (
                          <iframe 
                            title="Homestay location"
                            className="w-full h-full border-0"
                            src={`https://maps.google.com/maps?q=${homestay.latitude},${homestay.longitude}&z=15&output=embed`}
                          ></iframe>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">Map location not available</p>
                          </div>
                        )}
                        
                        {/* Get Directions Button */}
                        {homestay.latitude && homestay.longitude && (
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${homestay.latitude},${homestay.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-4 right-4 bg-white shadow-lg rounded-lg px-4 py-2 flex items-center font-medium text-primary hover:bg-gray-50 transition-colors"
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Get Directions
                            <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-70" />
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* Directions */}
                    {homestay.directions && (
                      <div className="bg-primary/5 p-5 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2 text-primary">Directions</h3>
                        <p className="text-gray-700">{homestay.directions}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Contact Information */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                      
                      {contacts.length > 0 ? (
                        <ul className="space-y-5">
                          {contacts.map((contact, index) => (
                            <li key={index} className="bg-gray-50 p-4 rounded-lg">
                              <div className="font-medium text-gray-800 mb-2">{contact.name}</div>
                              
                              {contact.mobile && (
                                <div className="flex items-center text-gray-700 mb-2">
                                  <Phone className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                                  <a href={`tel:${contact.mobile}`} className="hover:text-primary">
                                    {contact.mobile}
                                  </a>
                                </div>
                              )}
                              
                              {contact.email && (
                                <div className="flex items-center text-gray-700">
                                  <Mail className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                                  <a href={`mailto:${contact.email}`} className="hover:text-primary">
                                    {contact.email}
                                  </a>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 italic">Contact information not available</p>
                      )}
                    </div>
                    
                    {/* Officials */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Officials</h3>
                      
                      {officials.length > 0 ? (
                        <ul className="space-y-5">
                          {officials.map((official, index) => (
                            <li key={index} className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex justify-between">
                                <div className="font-medium text-gray-800">{official.name}</div>
                                <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-700">
                                  {official.role}
                                </span>
                              </div>
                              
                              {official.contactNo && (
                                <div className="flex items-center text-gray-700 mt-2">
                                  <Phone className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                                  <a href={`tel:${official.contactNo}`} className="hover:text-primary">
                                    {official.contactNo}
                                  </a>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 italic">Official information not available</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Section - Booking Card */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Book your stay</h3>
              
              <div className="bg-primary/5 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Availability</span>
                  <span className="text-green-600 font-medium flex items-center">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-1.5"></span>
                    Available
                  </span>
                </div>
                <p className="text-sm text-gray-600">Book your authentic homestay experience today!</p>
              </div>
              
              <div className="space-y-3 mb-6">
                <Link 
                  href={`/homestays/${homestayId}/contact`} 
                  className="block w-full py-3 bg-primary text-white text-center font-medium rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Book Stay
                </Link>
                
                <Link 
                  href={`/homestays/${homestayId}/about`}
                  className="block w-full py-3 bg-gray-100 text-gray-700 text-center font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Learn More
                </Link>
              </div>
              
              <div className="border-t pt-5">
                <h4 className="font-medium text-gray-700 mb-3">Why choose this homestay?</h4>
                <ul className="space-y-2.5">
                  {homestay.pageContent?.whyChooseUs && homestay.pageContent.whyChooseUs.length > 0 ? (
                    // Use whyChooseUs from database
                    homestay.pageContent.whyChooseUs.map((reason, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2.5 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{reason}</span>
                      </li>
                    ))
                  ) : (
                    // Fallback points
                    <>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2.5 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">Authentic local experience</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2.5 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">Beautiful natural surroundings</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2.5 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">Traditional homemade meals</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2.5 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">Cultural activities and workshops</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fullscreen Image Viewer */}
      {showGallery && galleryImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowGallery(false)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/30 hover:bg-black/50 z-20"
            onClick={(e) => { e.stopPropagation(); setShowGallery(false); }}
          >
            &times;
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); prevSlide(); }} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-full bg-black/30 hover:bg-black/50 z-20"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="relative max-h-full max-w-full">
            <Image
              src={galleryImages[currentImageIndex].src}
              alt={galleryImages[currentImageIndex].alt}
              width={1200}
              height={800}
              className="object-contain max-h-[90vh]"
            />
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); nextSlide(); }} 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-full bg-black/30 hover:bg-black/50 z-20"
          >
            <ChevronRight size={24} />
          </button>
          
          <div className="absolute bottom-4 left-0 right-0 text-center text-white z-20">
            {currentImageIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}
      
      {/* After the existing content but before the closing main tag */}
      {renderTestimonialsSection()}
      
      {/* Mobile bottom action bar */}
      {/* ... existing code ... */}
    </div>
  );
} 