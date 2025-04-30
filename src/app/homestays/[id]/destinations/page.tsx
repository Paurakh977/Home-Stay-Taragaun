"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, MapPin, ExternalLink, ChevronLeft, ArrowRight } from "lucide-react";
import { getApiImageUrl } from "../layout";
import { getImageUrl } from "@/lib/imageUtils";

interface Destination {
  name: string;
  description: string;
  distance: string;
  image: string;
  category: string;
  highlights: string[];
}

interface HomestayData {
  _id: string;
  homestayId: string;
  homeStayName: string;
  address: {
    formattedAddress: {
      en: string;
      ne?: string;
    };
    province?: { en: string; ne?: string };
    district?: { en: string; ne?: string };
    municipality?: { en: string; ne?: string };
  };
  destinations?: Destination[];
}

// Static destination categories
const categories = [
  { id: 'cultural', name: 'Cultural', icon: '🏛️' },
  { id: 'nature', name: 'Nature', icon: '🌿' },
  { id: 'wildlife', name: 'Wildlife', icon: '🐘' },
  { id: 'adventure', name: 'Adventure', icon: '🧗' }
];

// Static destination data - fallback if no database data
const defaultDestinations = [
  {
    name: "Kathmandu Valley",
    description: "Explore the cultural heritage sites, ancient temples, and vibrant markets of Kathmandu Valley.",
    distance: "2 hours drive",
    image: "/images/destinations/kathmandu.jpg",
    category: "cultural",
    highlights: ["Durbar Square", "Swayambhunath", "Boudhanath Stupa", "Pashupatinath Temple"]
  },
  {
    name: "Chitwan National Park",
    description: "Experience wildlife safari, jungle activities, and traditional Tharu culture in this UNESCO World Heritage Site.",
    distance: "3 hours drive",
    image: "/images/destinations/chitwan.jpg",
    category: "wildlife",
    highlights: ["Wildlife Safari", "Elephant Bathing", "Canoe Rides", "Tharu Cultural Show"]
  },
  {
    name: "Pokhara",
    description: "Enjoy stunning mountain views, peaceful lakes, and adventure activities in the tourism capital of Nepal.",
    distance: "1.5 hours drive",
    image: "/images/destinations/pokhara.jpg",
    category: "nature",
    highlights: ["Phewa Lake", "Sarangkot", "Davis Falls", "World Peace Pagoda"]
  },
  {
    name: "Local Community Forest",
    description: "Trek through lush community-managed forests with diverse flora and fauna, and panoramic views.",
    distance: "30 minutes walk",
    image: "/images/about/nepal-impact.jpg",
    category: "nature",
    highlights: ["Bird Watching", "Nature Walk", "Plant Species", "Panoramic Views"]
  },
  {
    name: "Traditional Village",
    description: "Visit nearby traditional villages to experience authentic rural lifestyle, crafts, and local cuisine.",
    distance: "45 minutes walk",
    image: "/images/about/nepal-story.jpg",
    category: "cultural",
    highlights: ["Local Cuisine", "Handicraft Workshops", "Cultural Performances", "Farm Activities"]
  }
];

// Helper function to format image URLs for destinations
const formatDestinationImage = (imagePath: string): string => {
  if (!imagePath) {
    return "/images/destinations/pokhara.jpg"; // Default image
  }
  return getImageUrl(imagePath);
};

export default function DestinationsPage() {
  const params = useParams();
  const homestayId = params.id as string;
  const [homestay, setHomestay] = useState<HomestayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Set up auto-sliding for hero carousel
  useEffect(() => {
    const interval = setInterval(() => {
      if (destinations.length > 1) {
        // Slide in reverse order
        setCurrentSlide(prev => (prev - 1 + destinations.length) % destinations.length);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [destinations.length]);

  useEffect(() => {
    const fetchBasicData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/homestays/${homestayId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch homestay data');
        }
        
        const data = await response.json();
        
        // Handle different response structures
        if (data.homestay) {
          setHomestay(data.homestay);
          // Set destinations from database or use defaults
          setDestinations(data.homestay.destinations || defaultDestinations);
        } else {
          setHomestay(data);
          // Set destinations from database or use defaults
          setDestinations(data.destinations || defaultDestinations);
        }
      } catch (err) {
        console.error('Error fetching homestay data:', err);
        
        // Use minimal static data
        setHomestay({
          _id: "static-id",
          homestayId: homestayId,
          homeStayName: "Hamro Homestay",
          address: {
            formattedAddress: { en: "Nepal" }
          }
        });
        // Use default destinations
        setDestinations(defaultDestinations);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBasicData();
  }, [homestayId]);

  // Filter destinations by selected category
  const filteredDestinations = selectedCategory
    ? destinations.filter(d => d.category === selectedCategory)
    : destinations;

  // Next and previous controls for the hero carousel - adjust for consistency with reversed direction
  const nextSlide = () => {
    // "Next" now goes to the previous slide since we're moving in reverse
    setCurrentSlide((prev) => (prev - 1 + destinations.length) % destinations.length);
  };

  const prevSlide = () => {
    // "Previous" now goes to the next slide since we're moving in reverse
    setCurrentSlide((prev) => (prev + 1) % destinations.length);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section with Image Carousel */}
      <div className="relative h-[40vh] bg-gray-900">
        {destinations.map((destination, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image 
              src={formatDestinationImage(destination.image)}
              alt={destination.name}
              fill
              className="object-cover opacity-60"
              priority={index === 0}
              unoptimized={true}
            />
          </div>
        ))}
        
        {/* Navigation controls */}
        {destinations.length > 1 && (
          <>
            <button 
              onClick={prevSlide} 
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-20 transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={nextSlide} 
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-20 transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col justify-end p-8">
          <div className="container mx-auto">
            {/* Breadcrumbs */}
            <div className="mb-4 text-sm">
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  <li>
                    <Link href="/" className="text-gray-300 hover:text-white">Home</Link>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <Link href={`/homestays/${homestayId}`} className="ml-1 text-gray-300 hover:text-white">
                        {homestay?.homeStayName}
                      </Link>
                    </div>
                  </li>
                  <li aria-current="page">
                    <div className="flex items-center">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <span className="ml-1 text-gray-100 font-medium">Destinations</span>
                    </div>
                  </li>
                </ol>
              </nav>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-2">Discover Nearby Destinations</h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Explore these amazing places during your stay at {homestay?.homeStayName}
            </p>
            
            {/* Indicator dots */}
            {destinations.length > 1 && (
              <div className="flex mt-4 gap-2">
                {destinations.map((_, index) => (
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
            )}
          </div>
        </div>
      </div>
      
      {/* Category Pills */}
      <div className="sticky top-0 z-10 bg-white shadow-md py-3 px-4">
        <div className="container mx-auto">
          <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Destinations
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Featured Destination - Large Hero Card */}
      <div className="container mx-auto px-4 py-8">
        {filteredDestinations.length > 0 && (
          <div className="bg-white rounded-xl overflow-hidden shadow-md mb-10">
            <div className="relative">
              <div className="h-[40vh] relative">
                <Image
                  src={formatDestinationImage(filteredDestinations[0].image)}
                  alt={filteredDestinations[0].name}
                  fill
                  className="object-cover"
                  unoptimized={true}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <span className="bg-primary/90 text-white text-xs font-bold px-3 py-1 rounded-full uppercase mb-2 inline-block">
                  Featured
                </span>
                <h2 className="text-3xl font-bold mb-2">{filteredDestinations[0].name}</h2>
                <p className="text-white/80 max-w-2xl mb-3">{filteredDestinations[0].description}</p>
                <div className="flex items-center text-white/90 text-sm">
                  <MapPin size={16} className="mr-2" />
                  <span>{filteredDestinations[0].distance} from {homestay?.homeStayName}</span>
                </div>
              </div>
            </div>
            <div className="p-6 bg-white">
              <div className="flex flex-wrap gap-3 mb-4">
                {filteredDestinations[0].highlights.map((highlight, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {highlight}
                  </span>
                ))}
              </div>
              <a 
                href={`https://www.google.com/maps/search/${encodeURIComponent(filteredDestinations[0].name + ' near ' + (homestay?.address?.district?.en || 'Nepal'))}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary hover:text-primary-dark font-medium"
              >
                View on map
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>
        )}
        
        {/* Horizontal Scrollable Destinations */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-between">
          <span>More Places to Explore</span>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-gray-500">Scroll to discover</span>
            <ArrowRight className="h-4 w-4 text-gray-500" />
          </div>
        </h2>
        
        <div className="relative">
          <div className="flex overflow-x-auto gap-6 pb-4 hide-scrollbar snap-x snap-mandatory px-1">
            {filteredDestinations.slice(1).map((destination) => (
              <div 
                key={destination.name} 
                className="flex-shrink-0 w-[300px] snap-start bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all transform hover:-translate-y-1"
              >
                <div className="relative h-48">
                  <Image
                    src={formatDestinationImage(destination.image)}
                    alt={destination.name}
                    fill
                    className="object-cover"
                    unoptimized={true}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-xl font-bold text-white">{destination.name}</h3>
                    <div className="flex items-center text-white/90 text-xs mt-1">
                      <MapPin size={12} className="mr-1" />
                      <span>{destination.distance}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{destination.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {destination.highlights.slice(0, 2).map((highlight, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {highlight}
                      </span>
                    ))}
                    {destination.highlights.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                        +{destination.highlights.length - 2} more
                      </span>
                    )}
                  </div>
                  
                  <a 
                    href={`https://www.google.com/maps/search/${encodeURIComponent(destination.name + ' near ' + (homestay?.address?.district?.en || 'Nepal'))}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:text-primary-dark text-sm font-medium"
                  >
                    View on map
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
} 