"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  MapPin, Star, Home, Users, Bed, Calendar, Phone, Mail, 
  ChevronLeft, ChevronRight, ArrowLeft, Globe, Check,
  Navigation, ExternalLink, Info
} from "lucide-react";
import { TGDCPopup } from "@/components/ui/ScrollPopup";

// Add CSS to explicitly hide any navigation elements that might be visible
const HideNavStyles = () => (
  <style jsx global>{`
    /* Hide any potential navigation and footer for temporary page */
    .temporary-page header.sticky,
    .temporary-page footer.border-t {
      display: none !important;
    }
  `}</style>
);

// Define interfaces for typing
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

// Helper function to convert text to title case (like Python's .title())
const toTitleCase = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Simple star rating component
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < Math.floor(rating) 
              ? "text-yellow-400 fill-yellow-400" 
              : "text-gray-300"
          }`}
        />
      ))}
      <span className="ml-1 text-sm">{rating?.toFixed(1) || "0.0"}</span>
    </div>
  );
};

// Format image URL
const formatImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return '';
  
  // Add timestamp to prevent caching
  const timestamp = `?t=${new Date().getTime()}`;
  
  // Handle uploads path
  if (imagePath.startsWith('/uploads/')) {
    return imagePath.replace('/uploads/', '/api/images/') + timestamp;
  }
  
  return imagePath;
};

// Add useEffect to redirect superadmins
export default function TemporaryHomestayPage() {
  const router = useRouter();
  const params = useParams();
  const homestayId = params.id as string;
  
  // State variables
  const [homestay, setHomestay] = useState<HomestayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<{src: string, alt: string}[]>([]);
  const [redirecting, setRedirecting] = useState(false);
  
  // Separate state for contacts and officials
  const [contacts, setContacts] = useState<HomestayData['contacts']>([]);
  const [officials, setOfficials] = useState<HomestayData['officials']>([]);
  
  // Add useEffect to add class to body for CSS targeting
  useEffect(() => {
    // Add class to body for CSS targeting
    document.body.classList.add('temporary-page');
    
    // Clean up on unmount
    return () => {
      document.body.classList.remove('temporary-page');
    };
  }, []);
  
  // Check for superadmin and redirect if necessary
  useEffect(() => {
    const checkSuperadminStatus = async () => {
      try {
        const response = await fetch('/api/superadmin/auth/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user && data.user.role === 'superadmin') {
            // Set redirecting state
            setRedirecting(true);
            // Redirect superadmins to the main page
            router.replace(`/homestays/${homestayId}`);
          }
        }
      } catch (err) {
        console.error('Error checking superadmin status:', err);
      }
    };

    checkSuperadminStatus();
  }, [homestayId, router]);
  
  // If redirecting, show a loading state
  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  // Fetch homestay data
  useEffect(() => {
    const fetchHomestayData = async () => {
      try {
        setLoading(true);
        console.log("Fetching homestay with ID:", homestayId);
        
        // First try using the raw ID
        let response = await fetch(`/api/homestays/${homestayId}?include=contacts,officials`);
        
        // If that fails, try adding a query parameter
        if (!response.ok) {
          console.log("First attempt failed, trying alternative endpoint");
          response = await fetch(`/api/homestays?homestayId=${homestayId}`);
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch homestay data');
        }
        
        const data = await response.json();
        console.log("API Response:", data);
        
        // Get homestay data from response
        let homestayData: HomestayData;
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          // Handle response from search endpoint
          homestayData = data.data[0];
        } else if (data.homestay) {
          // Handle nested response
          homestayData = data.homestay;
        } else {
          // Handle direct response
          homestayData = data;
        }
        
        // Set up contacts - handle whether they're in nested data or direct
        if (data.contacts && Array.isArray(data.contacts)) {
          setContacts(data.contacts);
          // Also add to homestay object for compatibility
          homestayData.contacts = data.contacts;
        } else if (homestayData.contacts && Array.isArray(homestayData.contacts)) {
          setContacts(homestayData.contacts);
        } else {
          setContacts([]);
        }
        
        // Set up officials - handle whether they're in nested data or direct
        if (data.officials && Array.isArray(data.officials)) {
          setOfficials(data.officials);
          // Also add to homestay object for compatibility
          homestayData.officials = data.officials;
        } else if (homestayData.officials && Array.isArray(homestayData.officials)) {
          setOfficials(homestayData.officials);
        } else {
          setOfficials([]);
        }
        
        // Prepare gallery images
        const images: {src: string, alt: string}[] = [];
        
        // Add profile image if available
        if (homestayData.profileImage) {
          images.push({
            src: formatImageUrl(homestayData.profileImage),
            alt: `${homestayData.homeStayName} Profile`
          });
        }
        
        // Add gallery images if available
        if (homestayData.galleryImages && homestayData.galleryImages.length > 0) {
          homestayData.galleryImages.forEach((img, index) => {
            images.push({
              src: formatImageUrl(img),
              alt: `${homestayData.homeStayName} Image ${index + 1}`
            });
          });
        } else if (homestayData.gallery && homestayData.gallery.length > 0) {
          homestayData.gallery.forEach((img, index) => {
            if (typeof img === 'string') {
              images.push({
                src: formatImageUrl(img),
                alt: `${homestayData.homeStayName} Image ${index + 1}`
              });
            } else if (img.path) {
              images.push({
                src: formatImageUrl(img.path),
                alt: img.caption || `${homestayData.homeStayName} Image ${index + 1}`
              });
            }
          });
        }
        
        // Set state
        setHomestay(homestayData);
        setGalleryImages(images);
        setError(null);
        
        console.log("Processed homestay data:", {
          name: homestayData.homeStayName,
          contacts: contacts?.length || 0,
          officials: officials?.length || 0
        });
      } catch (err) {
        console.error('Error fetching homestay data:', err);
        setError('Failed to load homestay details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHomestayData();
  }, [homestayId]);
  
  // Gallery navigation
  const nextSlide = () => {
    if (galleryImages.length <= 1) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % galleryImages.length);
  };
  
  const prevSlide = () => {
    if (galleryImages.length <= 1) return;
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + galleryImages.length) % galleryImages.length);
  };
  
  // Go back to homestay listing
  const goBack = () => {
    router.push('/homestays');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error || !homestay) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-bold mb-4">Homestay Not Found</h2>
          <p className="mb-6 text-gray-600">{error || "We couldn't find the homestay you're looking for"}</p>
          <button 
            onClick={goBack}
            className="px-4 py-2 bg-primary text-white rounded-lg flex items-center mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Homestays
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16 temporary-page">
      {/* Include the style component to hide navigation */}
      <HideNavStyles />
      
      {/* TGDC Popup */}
      <TGDCPopup />
      
      {/* Back button */}
      <div className="sticky top-0 z-10 bg-white shadow-sm p-4">
        <div className="container mx-auto">
          <button 
            onClick={goBack}
            className="flex items-center text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Back to Homestays</span>
          </button>
        </div>
      </div>
      
      {/* Hero section */}
      <div className="relative h-[300px] md:h-[400px]">
        {galleryImages.length > 0 ? (
          <>
            <div className="relative h-full">
              <Image
                src={galleryImages[currentImageIndex].src}
                alt={galleryImages[currentImageIndex].alt}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/30"></div>
            </div>
            
            {galleryImages.length > 1 && (
              <>
                <button 
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="container mx-auto">
                <h1 className="text-3xl font-bold text-white">{homestay.homeStayName}</h1>
                <div className="flex items-center text-white/90 mt-2">
                  <MapPin size={16} className="mr-1" />
                  <span>
                    {homestay.address.formattedAddress.en}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full bg-gray-200 flex items-center justify-center">
            <div className="text-center">
              <Home className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {/* <p className="text-gray-500">No images available</p> */}
            </div>
          </div>
        )}
      </div>
      
      {/* Basic info */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div>
              <div className="flex items-center">
                <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full mr-2 ${
                  homestay.homeStayType === 'community' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {homestay.homestayType || (homestay.homeStayType === 'community' ? 'Community Homestay' : 'Private Homestay')}
                </span>
                
                {homestay.dhsrNo && (
                  <span className="inline-flex items-center text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-mono">
                    DHSR: {homestay.dhsrNo}
                  </span>
                )}
              </div>
              
              {/* Commenting out the rating as requested */}
              {/* {(homestay.averageRating || homestay.rating) && (
                <div className="mt-2">
                  <StarRating rating={homestay.averageRating || homestay.rating || 0} />
                </div>
              )} */}
            </div>
          </div>
          
          {/* Homestay stats */}
          <div className="grid grid-cols-3 gap-4 my-6 p-4 bg-gray-50 rounded-lg text-center">
            <div>
              <Home className="h-6 w-6 mx-auto text-primary mb-1" />
              <div className="text-lg font-semibold">{homestay.homeCount || 0}</div>
              <div className="text-sm text-gray-600">Homes</div>
            </div>
            <div>
              <Bed className="h-6 w-6 mx-auto text-primary mb-1" />
              <div className="text-lg font-semibold">{homestay.roomCount || 0}</div>
              <div className="text-sm text-gray-600">Rooms</div>
            </div>
            <div>
              <Users className="h-6 w-6 mx-auto text-primary mb-1" />
              <div className="text-lg font-semibold">{homestay.bedCount || 0}</div>
              <div className="text-sm text-gray-600">Beds</div>
            </div>
          </div>
          
          {/* Description */}
          {homestay.description && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">About</h2>
              <p className="text-gray-700">{homestay.description}</p>
            </div>
          )}
        </div>
        
        {/* Contact Information - Made more prominent */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Phone className="w-5 h-5 text-primary mr-2" />
            Contact Information
          </h2>
          
          {contacts && contacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border-l-4 border-primary">
                  <h3 className="font-medium text-gray-800 mb-2">{toTitleCase(contact.name)}</h3>
                  
                  <div className="space-y-3">
                    <a href={`tel:${contact.mobile}`} className="flex items-center text-gray-700 hover:text-primary">
                      <Phone className="w-4 h-4 text-primary mr-2" />
                      <span>{contact.mobile}</span>
                    </a>
                    
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex items-center text-gray-700 hover:text-primary">
                        <Mail className="w-4 h-4 text-primary mr-2" />
                        <span>{contact.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
              <p className="flex items-center text-gray-700">
                <Info className="w-5 h-5 text-yellow-500 mr-2" />
                No contact information available
              </p>
            </div>
          )}
        </div>
        
        {/* Officials - Enhanced */}
        {/* <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Users className="w-5 h-5 text-primary mr-2" />
            Homestay Officials
          </h2>
          
          {officials && officials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {officials.map((official, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border-l-4 border-blue-400">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-800">{toTitleCase(official.name)}</h3>
                    <span className="text-xs bg-primary/10 px-2 py-1 rounded text-primary">{official.role}</span>
                  </div>
                  
                  <a href={`tel:${official.contactNo}`} className="flex items-center text-gray-700 hover:text-primary">
                    <Phone className="w-4 h-4 text-primary mr-2" />
                    <span>{official.contactNo}</span>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
              <p className="flex items-center text-gray-700">
                <Info className="w-5 h-5 text-yellow-500 mr-2" />
                No official information available
              </p>
            </div>
          )}
        </div> */}
        
        {/* Location - Enhanced and more prominent */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <MapPin className="w-5 h-5 text-primary mr-2" />
            Location
          </h2>
          
          {/* Location address - More prominent */}
          <div className="bg-gray-50 p-4 rounded-lg mb-5 border-l-4 border-primary">
            <h3 className="font-medium text-gray-900 mb-2">Address</h3>
            <p className="text-gray-700 font-medium">{toTitleCase(homestay.address.formattedAddress.en)}</p>
            {homestay.address.formattedAddress.ne && (
              <p className="text-gray-600 mt-1">{homestay.address.formattedAddress.ne}</p>
            )}
            {(homestay.address.province?.en || homestay.address.district?.en) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {homestay.address.province?.en && (
                  <span className="inline-flex items-center text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                    Province: {toTitleCase(homestay.address.province.en)}
                  </span>
                )}
                {homestay.address.district?.en && (
                  <span className="inline-flex items-center text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                    District: {toTitleCase(homestay.address.district.en)}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Map - Adjusted height and responsiveness */}
          {homestay.latitude && homestay.longitude ? (
            <div className="rounded-lg overflow-hidden h-56 sm:h-72 md:h-80 relative mb-4">
              <iframe 
                src={`https://maps.google.com/maps?q=${homestay.latitude},${homestay.longitude}&z=14&output=embed`}
                width="100%"
                height="100%"
                className="border-0"
                title="Homestay Location"
              ></iframe>
              
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${homestay.latitude},${homestay.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md px-3 py-2 flex items-center text-sm font-medium transition-colors hover:bg-gray-50"
              >
                <Navigation className="w-4 h-4 mr-1 text-primary" />
                Get Directions
                <ExternalLink className="w-3 h-3 ml-1 text-gray-500" />
              </a>
            </div>
          ) : (
            <div className="flex items-center bg-yellow-50 p-4 rounded-lg mb-4 border-l-4 border-yellow-400">
              <MapPin className="w-5 h-5 text-yellow-500 flex-shrink-0 mr-3" />
              <p className="text-gray-700">Map coordinates not available</p>
            </div>
          )}
          
          {/* Directions - if available */}
          {homestay.directions && (
            <div className="flex items-start bg-gray-50 p-4 rounded-lg">
              <Navigation className="w-5 h-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">Directions</h3>
                <p className="text-gray-700 text-sm">{homestay.directions}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Features and amenities - Simplified */}
        {(homestay.features || homestay.localAttractions || homestay.tourismServices || homestay.infrastructure) && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Features & Amenities</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* All features in a responsive grid */}
              {[
                ...(homestay.features?.localAttractions || []),
                ...(Array.isArray(homestay.localAttractions) ? 
                  homestay.localAttractions.map(a => typeof a === 'string' ? a : a.name) : 
                  []),
                ...(homestay.features?.tourismServices || homestay.tourismServices || []),
                ...(homestay.features?.infrastructure || homestay.infrastructure || [])
              ].map((feature, index) => (
                <div key={index} className="flex items-center bg-gray-50 p-3 rounded-lg transition-all hover:bg-gray-100">
                  <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{toTitleCase(feature)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Back to homestays button */}
        <div className="flex justify-center">
          <button 
            onClick={goBack}
            className="bg-primary text-white px-6 py-2 rounded-lg flex items-center hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Homestays
          </button>
        </div>
      </div>
    </div>
  );
} 