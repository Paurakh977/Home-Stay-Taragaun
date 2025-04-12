"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Star, MapPin, Home, Users, Bed, Phone, Mail, ChevronRight, X, Calendar, Map, Share2, Heart } from "lucide-react";
import Image from "next/image";

interface HomestayData {
  _id: string;
  homestayId: string;
  homeStayName: string;
  villageName: string;
  homeCount: number;
  roomCount: number;
  bedCount: number;
  homeStayType: string;
  profileImage: string | null;
  directions: string;
  address: {
    province: { en: string; ne: string };
    district: { en: string; ne: string };
    municipality: { en: string; ne: string };
    ward: { en: string; ne: string };
    city: string;
    tole: string;
    formattedAddress: { en: string; ne: string };
  };
  features: {
    localAttractions: string[];
    tourismServices: string[];
    infrastructure: string[];
  };
  status: string;
  averageRating: number;
  galleryImages?: string[];
  description?: string;
  dhsrNo?: string;
}

interface ContactData {
  _id: string;
  homestayId: string;
  name: string;
  mobile: string;
  email: string;
  facebook: string;
  youtube: string;
  instagram: string;
  tiktok: string;
  twitter: string;
}

interface OfficialData {
  _id: string;
  homestayId: string;
  name: string;
  role: string;
  contactNo: string;
}

// Helper function to generate initials
const getInitials = (name: string): string => {
  if (!name) return "?";
  const words = name.split(' ').filter(Boolean);
  if (words.length === 0) return "?";
  // Use first letter of the first word and first letter of the last word
  const firstInitial = words[0].charAt(0);
  const lastInitial = words.length > 1 ? words[words.length - 1].charAt(0) : '';
  return (firstInitial + lastInitial).toUpperCase();
};

// Add helper function for constructing image URLs with adminContext support
const getApiImageUrl = (
  imagePath: string, 
  homestayId: string, 
  adminContext?: string | null
): string => {
  // Add cache-busting timestamp
  const timestamp = `?t=${new Date().getTime()}`;
  
  let result = '';
  
  if (!imagePath) {
    console.error('No image path provided to getApiImageUrl');
    return '/images/placeholder-homestay.jpg';
  }
  
  if (imagePath.startsWith('/uploads/')) {
    // The image path in the database is like /uploads/admin1/homestayId/gallery/image.jpg
    // We need to make it /api/images/admin1/homestayId/gallery/image.jpg
    
    // Just replace /uploads/ with /api/images/
    result = imagePath.replace('/uploads/', '/api/images/') + timestamp;
  } else {
    // For direct API paths or other URLs
    result = `${imagePath}${timestamp}`;
  }
  
  console.log('Generated image URL:', {
    originalPath: imagePath,
    homestayId,
    adminContext,
    result
  });
  
  return result;
};

export default function HomestayPortalPage() {
  const params = useParams();
  const homestayId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homestay, setHomestay] = useState<HomestayData | null>(null);
  const [officials, setOfficials] = useState<OfficialData[]>([]);
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // New state for map modal
  const [showMapModal, setShowMapModal] = useState(false);
  
  // Fetch homestay data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Extract and validate homestayId from params
        const currentHomestayId = params.id;
        
        if (!currentHomestayId || currentHomestayId === 'undefined') {
          console.error("Invalid homestayId parameter:", currentHomestayId);
          setError("Invalid homestay ID provided. Please check the URL and try again.");
          setLoading(false);
          return;
        }
        
        // Get URL params - we might be coming from an admin route
        const urlParams = new URLSearchParams(window.location.search);
        const adminContext = urlParams.get('adminContext');
        
        let apiUrl = `/api/homestays/${currentHomestayId}`;
        if (adminContext) {
          apiUrl += `?adminUsername=${adminContext}`;
        }
        
        console.log(`Fetching homestay data from: ${apiUrl}`);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch homestay data: Status ${response.status} - ${errorText}`);
          throw new Error('Failed to fetch homestay data');
        }
        
        const data = await response.json();
        
        if (!data || !data.homestay) {
          console.error("Invalid homestay data received:", data);
          throw new Error('Invalid homestay data received');
        }
        
        console.log("Successfully fetched homestay:", data.homestay.homestayId);
        
        // Log image paths for debugging
        console.log("Profile image path:", data.homestay.profileImage);
        console.log("Gallery image paths:", data.homestay.galleryImages);
        
        setHomestay(data.homestay);
        setOfficials(data.officials || []);
        setContacts(data.contacts || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching homestay data:', err);
        setError('Failed to load homestay details. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [homestayId, params.id]);
  
  // Prepare gallery images excluding profile image
  const galleryImages = homestay ? (homestay.galleryImages || []) : [];
  
  // Image slider controls
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  }, [galleryImages.length]);
  
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  }, [galleryImages.length]);
  
  // Auto-slide functionality
  useEffect(() => {
    if (galleryImages.length <= 1) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(interval);
  }, [nextSlide, galleryImages.length]);
  
  // Function to open fullscreen image viewer
  const openFullscreenViewer = (index: number) => {
    setCurrentSlide(index);
    setShowFullImage(true);
  };
  
  // Function to render stars for rating
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };
  
  // Function to handle booking request
  const handleBookNow = () => {
    // In a real implementation, this would open a booking form or redirect to a booking page
    alert("Booking functionality will be implemented soon!");
    // For future implementation: router.push(`/booking/${homestayId}`);
  };
  
  // Function to handle map view
  const handleViewMap = () => {
    setShowMapModal(true);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }
  
  if (error || !homestay) {
    return (
      <div className="text-center py-10 text-red-600">{error || "Homestay not found"}</div>
    );
  }
  
  // Derive values after homestay is confirmed not null
  const currentImageIndex = galleryImages.length > 0 ? currentSlide % galleryImages.length : 0;
  const currentImageSrc = galleryImages.length > 0 ? galleryImages[currentImageIndex] : null;
  const profileInitials = getInitials(homestay.homeStayName); // Get initials
  
  return (
    <>
      <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen pb-16">
        {/* Hero section with image slider */}
        <div className="w-full bg-slate-900 relative">
          {/* Image Slider */}
          <div className="relative h-[50vh] md:h-[70vh] overflow-hidden">
            {galleryImages.length > 0 ? (
              <>
                {galleryImages.map((imagePath, index) => {
                  return (
                    <div
                      key={index}
                      className={`absolute inset-0 w-full h-full transition-opacity duration-1000 cursor-pointer ${
                        index === currentSlide ? "opacity-100" : "opacity-0"
                      }`}
                      onClick={() => openFullscreenViewer(index)}
                    >
                      <div className="absolute inset-0 bg-black/20 z-10"></div>
                      <img 
                        src={getApiImageUrl(imagePath, params.id, new URLSearchParams(window.location.search).get('adminContext'))}
                        alt={`${homestay.homeStayName} - Photo ${index + 1}`} 
                        className="w-full h-full object-cover"
                        onError={(e) => { console.warn(`[Public Slider] Failed to load image: ${(e.target as HTMLImageElement).src}`); }}
                      />
                    </div>
                  );
                })}
              
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
                  </>
                )}
              
                {/* Indicator dots */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                  {galleryImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        index === currentSlide ? "bg-white scale-110" : "bg-white/50"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center bg-slate-700">
                <Home className="h-24 w-24 text-slate-400" />
              </div>
            )}
          </div>
          
          {/* Overlay navigation */}
          <div className="absolute top-0 left-0 w-full p-4 z-30">
            <div className="flex justify-between">
              <Link 
                href="/" 
                className="bg-white/10 backdrop-blur-md text-white py-2 px-4 rounded-full flex items-center hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Homestays
              </Link>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`p-2 rounded-full backdrop-blur-md transition-all ${
                    isFavorite 
                      ? "bg-red-500 text-white" 
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={isFavorite ? "h-5 w-5 fill-white" : "h-5 w-5"} />
                </button>
                
                <button 
                  className="p-2 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-colors"
                  aria-label="Share"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-10">
          {/* Header Card */}
          <div className="bg-white rounded-lg shadow-lg mb-8 p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div className="flex items-center gap-4">
                {/* Profile Image or Initials */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-primary flex-shrink-0 bg-primary/10 flex items-center justify-center">
                  {homestay.profileImage ? (
                    <Image
                      src={getApiImageUrl(homestay.profileImage, params.id, new URLSearchParams(window.location.search).get('adminContext'))}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="object-cover w-full h-full rounded-xl"
                      loading="lazy"
                      onError={(e) => {
                        console.error("Failed to load profile image:", e);
                        e.currentTarget.src = '/images/placeholder-homestay.jpg';
                      }}
                    />
                  ) : (
                    <span className="text-2xl md:text-3xl font-bold text-primary">
                      {profileInitials} 
                    </span>
                  )}
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{homestay.homeStayName}</h1>
                  
                  <div className="flex items-center text-sm text-gray-600 mt-2">
                    <MapPin className="h-4 w-4 mr-1 text-primary" />
                    <span>{homestay.address.formattedAddress.en}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <span className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium inline-flex items-center">
                  {homestay.homeStayType === 'community' ? 'Community Homestay' : 'Private Homestay'}
                </span>
                <div className="flex items-center px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg">
                  <div className="flex mr-2">
                    {renderStars(homestay.averageRating)}
                  </div>
                  <span className="font-medium">
                    {homestay.averageRating > 0 
                      ? `${homestay.averageRating.toFixed(1)}` 
                      : "No ratings"}
                  </span>
                </div>
                
                {/* DHSR Number Badge */}
                {homestay.dhsrNo && (
                  <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg flex items-center">
                    <span className="text-xs uppercase tracking-wider mr-1">DHSR:</span>
                    <span className="font-mono font-medium">{homestay.dhsrNo}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-100 mt-6 pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col items-center text-center">
                <Home className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold">{homestay.homeCount}</span>
                <span className="text-sm text-gray-500">Homes</span>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <Users className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold">{homestay.roomCount}</span>
                <span className="text-sm text-gray-500">Rooms</span>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <Bed className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold">{homestay.bedCount}</span>
                <span className="text-sm text-gray-500">Beds</span>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <Star className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold">{homestay.averageRating > 0 ? homestay.averageRating.toFixed(1) : "-"}</span>
                <span className="text-sm text-gray-500">Rating</span>
              </div>
            </div>
            
            <div className="flex justify-center mt-6 gap-4">
              <button 
                onClick={handleBookNow}
                className="px-6 py-3 bg-primary text-white font-medium rounded-lg flex items-center hover:bg-primary/90 transition-colors"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Book Now
              </button>
              
              <button 
                onClick={handleViewMap}
                className="px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-lg flex items-center hover:bg-gray-50 transition-colors"
              >
                <Map className="h-5 w-5 mr-2" />
                View on Map
              </button>
            </div>
          </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="md:col-span-2 space-y-8">
            {/* Description */}
              <section className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-100">About this Homestay</h2>
              <div className="prose prose-sm max-w-none">
                {homestay.description ? (
                    <p className="text-gray-700 leading-relaxed">{homestay.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description provided</p>
                )}
              </div>
            </section>
            
            {/* Features Section */}
              <section className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-100">Features & Attractions</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Local attractions */}
                  <div className="bg-blue-50 p-5 rounded-lg">
                    <h3 className="font-medium mb-3 text-blue-700 flex items-center">
                      <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                        <MapPin className="h-4 w-4 text-blue-700" />
                      </span>
                      Local Attractions
                    </h3>
                  {homestay.features.localAttractions.length > 0 ? (
                    <ul className="space-y-2">
                      {homestay.features.localAttractions.map((attraction, index) => (
                        <li key={index} className="flex items-start">
                            <span className="inline-block h-2 w-2 rounded-full bg-blue-400 mt-1.5 mr-2"></span>
                            <span className="text-gray-700">{attraction}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">No local attractions listed</p>
                  )}
                </div>
                
                {/* Tourism services */}
                  <div className="bg-green-50 p-5 rounded-lg">
                    <h3 className="font-medium mb-3 text-green-700 flex items-center">
                      <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                        <Users className="h-4 w-4 text-green-700" />
                      </span>
                      Tourism Services
                    </h3>
                  {homestay.features.tourismServices.length > 0 ? (
                    <ul className="space-y-2">
                      {homestay.features.tourismServices.map((service, index) => (
                        <li key={index} className="flex items-start">
                            <span className="inline-block h-2 w-2 rounded-full bg-green-400 mt-1.5 mr-2"></span>
                            <span className="text-gray-700">{service}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">No tourism services listed</p>
                  )}
                </div>
              </div>
              
              {/* Infrastructure */}
              {homestay.features.infrastructure.length > 0 && (
                  <div className="mt-6 bg-amber-50 p-5 rounded-lg">
                    <h3 className="font-medium mb-3 text-amber-700 flex items-center">
                      <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-2">
                        <Home className="h-4 w-4 text-amber-700" />
                      </span>
                      Infrastructure
                    </h3>
                  <ul className="space-y-2">
                    {homestay.features.infrastructure.map((item, index) => (
                      <li key={index} className="flex items-start">
                          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 mt-1.5 mr-2"></span>
                          <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
            
            {/* Directions */}
            {homestay.directions && (
                <section className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-100">Directions</h2>
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <div className="flex items-start">
                      <Map className="h-5 w-5 mr-3 text-primary mt-0.5" />
                      <p className="text-gray-700 leading-relaxed">{homestay.directions}</p>
                    </div>
                </div>
              </section>
            )}

            {/* Image Gallery Grid */}
            {galleryImages.length > 0 && (
              <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-100">Photo Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                  {galleryImages.map((imagePath, index) => {
                    return (
                      <div 
                        key={index}
                        className="relative overflow-hidden rounded-lg shadow-md cursor-pointer h-44"
                        onClick={() => openFullscreenViewer(index)}
                      >
                        <Image
                          src={getApiImageUrl(imagePath, params.id, new URLSearchParams(window.location.search).get('adminContext'))}
                          alt={`Gallery ${index + 1}`}
                          width={176}
                          height={176}
                          className="w-full h-full object-cover"
                          onError={(e) => { console.warn(`[Public Grid] Failed to load image: ${(e.target as HTMLImageElement).src}`); }}
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white bg-black/50 px-2 py-1 rounded-md text-sm">View</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contact Info Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 border-b pb-2">Contact Information</h2>
              
              {contacts.length > 0 ? (
                  <div className="space-y-5">
                  {contacts.map((contact, index) => (
                      <div key={index} className={index > 0 ? "pt-4 border-t border-gray-100" : ""}>
                        <h3 className="font-medium text-primary mb-3">{contact.name}</h3>
                      
                        <div className="space-y-3">
                          <a 
                            href={`tel:${contact.mobile}`} 
                            className="flex items-center hover:text-primary transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20">
                              <Phone className="h-4 w-4 text-primary" />
                            </div>
                          <span>{contact.mobile}</span>
                          </a>
                        
                        {contact.email && (
                            <a 
                              href={`mailto:${contact.email}`} 
                              className="flex items-center hover:text-primary transition-colors group"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20">
                                <Mail className="h-4 w-4 text-primary" />
                              </div>
                            <span>{contact.email}</span>
                            </a>
                        )}
                        
                        {/* Social media links */}
                          <div className="flex gap-3 mt-3 pl-1">
                          {contact.facebook && (
                              <a href={contact.facebook} target="_blank" rel="noopener noreferrer" 
                                className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                              </svg>
                            </a>
                          )}
                          {contact.instagram && (
                              <a href={contact.instagram} target="_blank" rel="noopener noreferrer" 
                                className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 hover:bg-pink-200 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                            </a>
                          )}
                            {contact.youtube && (
                              <a href={contact.youtube} target="_blank" rel="noopener noreferrer" 
                                className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No contact information available</p>
              )}
            </div>
            
            {/* Officials Card */}
            {officials.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold mb-4 border-b pb-2">Officials</h2>
                
                  <div className="space-y-4">
                  {officials.map((official, index) => (
                      <div key={index} className={index > 0 ? "pt-4 border-t border-gray-100" : ""}>
                      <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-800">{official.name}</span>
                          <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-600">{official.role}</span>
                      </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-1.5" />
                          <a href={`tel:${official.contactNo}`} className="hover:text-primary">
                            {official.contactNo}
                          </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
              
              {/* Quick booking widget */}
              <div className="bg-gradient-to-br from-primary/80 to-primary rounded-lg shadow-md p-6 text-white">
                <h2 className="text-lg font-semibold mb-3">Ready to experience?</h2>
                <p className="text-white/90 text-sm mb-4">Book this amazing homestay now and create unforgettable memories!</p>
                
                <button 
                  onClick={handleBookNow}
                  className="w-full py-3 bg-white text-primary font-medium rounded-lg hover:bg-white/90 transition-colors"
                >
                  Check Availability
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Map Modal */}
      {showMapModal && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
          onClick={() => setShowMapModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl h-[80vh] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {homestay?.homeStayName} Location
              </h3>
              <button 
                onClick={() => setShowMapModal(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="h-full p-4 flex flex-col">
              <div className="bg-gray-100 rounded-lg flex-1 flex items-center justify-center">
                <div className="text-center p-6">
                  <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Map Integration Coming Soon</h3>
                  <p className="text-gray-600 max-w-md">
                    We're working on integrating maps to show the exact location of this homestay.
                    For now, please refer to the directions provided.
                  </p>
                  
                  {homestay?.directions && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-md text-left">
                      <h4 className="font-medium mb-2 text-primary">Directions:</h4>
                      <p className="text-gray-700">{homestay.directions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Fullscreen Image Viewer */}
      {showFullImage && galleryImages.length > 0 && (() => {
        const currentImagePath = galleryImages[currentSlide];
        if (!currentImagePath) {
          console.error("Error: Invalid image path for fullscreen");
          setShowFullImage(false);
          return null;
        }
        
        const currentApiUrl = getApiImageUrl(currentImagePath, params.id, new URLSearchParams(window.location.search).get('adminContext'));

        return (
          <div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={() => setShowFullImage(false)}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); prevSlide(); }} 
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-2 text-white rounded-full z-10 hover:bg-white/10"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            
            <img 
              src={currentApiUrl} 
              alt={`${homestay.homeStayName} - Photo ${currentSlide + 1}`} 
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onError={(e) => { 
                console.error(`[Fullscreen Viewer] Failed to load image: ${(e.target as HTMLImageElement).src}`); 
                setShowFullImage(false); 
              }}
            />
            
            <button 
              onClick={(e) => { e.stopPropagation(); nextSlide(); }} 
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-2 text-white rounded-full z-10 hover:bg-white/10"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); setShowFullImage(false); }}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Thumbnails row */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center overflow-x-auto py-2 px-4 gap-2 hide-scrollbar">
              {galleryImages.map((thumbPath, index) => {
                const thumbFilename = thumbPath.split('/').pop();
                if (!thumbFilename) return null;
                const thumbApiUrl = getApiImageUrl(thumbPath, params.id, new URLSearchParams(window.location.search).get('adminContext'));
                return (
                  <div 
                    key={index} 
                    className={`h-16 w-24 flex-shrink-0 rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                      index === currentSlide ? 'border-white scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    onClick={(e) => { 
                      e.stopPropagation();
                      setCurrentSlide(index);
                    }}
                  >
                    <img 
                      src={thumbApiUrl} 
                      alt={`Thumbnail ${index + 1}`} 
                      className="h-full w-full object-cover"
                      onError={(e) => { console.warn(`[Fullscreen Thumb] Failed to load image: ${(e.target as HTMLImageElement).src}`); }}
                    />
                  </div>
                );
              })}
            </div>
            
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm">
              {currentSlide + 1} / {galleryImages.length}
            </div>
          </div>
        );
      })()}
      
      {/* Add custom CSS for thumbnail scrollbar */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
} 