"use client";

import { useState, useEffect } from "react";
import { MapPin, Star, Bed, Home } from "lucide-react";
import Link from "next/link";

interface HomestayListingProps {
  adminUsername?: string;
  locationFilter?: string;
}

interface Homestay {
  _id: string;
  homestayId: string;
  homeStayName: string;
  villageName: string;
  homeCount: number;
  roomCount: number;
  bedCount: number;
  homeStayType: string;
  description?: string;
  averageRating: number;
  status: string;
  profileImage?: string;
  address: {
    province: { en: string; ne: string };
    district: { en: string; ne: string };
    municipality: { en: string; ne: string };
    ward: { en: string; ne: string };
    city: string;
    tole: string;
    formattedAddress: { en: string; ne: string };
  };
}

export default function HomestayListing({ adminUsername, locationFilter }: HomestayListingProps) {
  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHomestays = async () => {
      try {
        setLoading(true);
        
        // Create URL based on parameters
        let url = `/api/homestays?limit=50`;
        if (adminUsername) {
          url += `&adminUsername=${adminUsername}`;
        }
        
        // Add location filter if provided
        if (locationFilter) {
          url += `&${locationFilter}`;
        }
        
        console.log("Fetching homestays from:", url);
        const response = await fetch(url);
        
        if (!response.ok) {
          // Log more details about the error
          const errorText = await response.text();
          console.error(`Error ${response.status}: ${errorText}`);
          throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Debug check - with more detailed logging
        console.log("Response data:", data);
        
        // Handle different response formats
        if (data && Array.isArray(data)) {
          // If data is directly an array of homestays
          console.log(`Received ${data.length} homestays (array format)`);
          setHomestays(data);
        } else if (data && Array.isArray(data.homestays)) {
          // If data has a homestays property which is an array
          console.log(`Received ${data.homestays.length} homestays (object.homestays format)`);
          setHomestays(data.homestays);
        } else if (data && typeof data === 'object') {
          // If data is an object but doesn't have a homestays array
          console.error("Unexpected response format:", data);
          // Try to extract an array from any property that might contain homestays
          const possibleArrays = Object.values(data).filter(value => Array.isArray(value));
          if (possibleArrays.length > 0) {
            const longestArray = possibleArrays.reduce((a, b) => a.length > b.length ? a : b);
            console.log(`Found possible homestays array with ${longestArray.length} items`);
            setHomestays(longestArray);
          } else {
            throw new Error("Invalid response format from server");
          }
        } else {
          console.error("Invalid response format:", data);
          throw new Error("Invalid response format from server");
        }
      } catch (error) {
        console.error("Failed to fetch homestays:", error);
        setError("Failed to load homestays. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchHomestays();
  }, [adminUsername, locationFilter]);

  // Helper function to get image URL
  const getImageUrl = (imagePath: string | undefined, adminUsername?: string): string => {
    if (!imagePath) {
      return '/images/placeholder-homestay.jpg';
    }
    
    // Add cache-busting timestamp
    const timestamp = `?t=${new Date().getTime()}`;
    
    // Handle profile images
    if (imagePath.startsWith('/uploads/')) {
      // Simply replace '/uploads/' with '/api/images/'
      // This maintains the exact same path structure that was stored in the database
      return imagePath.replace('/uploads/', '/api/images/') + timestamp;
    }
    
    // Handle full URLs or other paths
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // For all other cases, use as is with cache-busting 
    return `${imagePath}${timestamp}`;
  };

  // Format description for cards
  const formatDescription = (description: string | undefined, maxLength: number = 120) => {
    if (!description) return "Experience authentic Nepali hospitality in this beautiful homestay...";
    
    if (description.length <= maxLength) return description;
    
    // Find the last space before maxLength
    const lastSpace = description.substring(0, maxLength).lastIndexOf(' ');
    const truncated = description.substring(0, lastSpace > 0 ? lastSpace : maxLength);
    
    return `${truncated}...`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 mb-4">❌</div>
        <h3 className="text-xl font-semibold mb-2">Error Loading Homestays</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!homestays || homestays.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="text-gray-400 mb-4">🏠</div>
        <h3 className="text-xl font-semibold mb-2">No Homestays Found</h3>
        <p className="text-gray-600">
          There are currently no approved homestays available.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {homestays.map((homestay) => (
        <div 
          key={homestay._id} 
          className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          {/* Homestay Image */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={getImageUrl(homestay.profileImage, adminUsername)}
              alt={homestay.homeStayName}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              onError={(e) => {
                // Log the error with more detail
                console.warn(`[Homestay List] Failed to load image: ${(e.target as HTMLImageElement).src}`);
                // Fallback image if there's an error
                (e.target as HTMLImageElement).src = '/images/placeholder-homestay.jpg';
              }}
            />
            <div className="absolute top-0 left-0 m-3 px-2 py-1 bg-white/90 rounded-md text-xs font-medium">
              {homestay.homeStayType === 'community' ? 'Community' : 'Private'} Homestay
            </div>
          </div>
          
          {/* Homestay Info */}
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{homestay.homeStayName}</h3>
              <div className="flex items-center bg-primary/10 text-primary rounded px-2 py-0.5 text-sm font-medium">
                <Star className="h-3.5 w-3.5 mr-1 fill-primary text-primary" />
                {homestay.averageRating.toFixed(1)}
              </div>
            </div>
            
            <div className="flex items-start mb-3">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
              <p className="text-sm text-gray-600 line-clamp-1">
                {homestay.address.formattedAddress.en}
              </p>
            </div>
            
            <p className="text-sm text-gray-700 mb-4 line-clamp-2">
              {formatDescription(homestay.description)}
            </p>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Home className="h-4 w-4 mr-1 text-gray-500" />
                <span>{homestay.homeCount} {homestay.homeCount === 1 ? 'Home' : 'Homes'}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Bed className="h-4 w-4 mr-1 text-gray-500" />
                <span>{homestay.bedCount} {homestay.bedCount === 1 ? 'Bed' : 'Beds'}</span>
              </div>
            </div>
            
            {/* View Details Button */}
            <Link href={adminUsername 
              ? `/${adminUsername}/homestays/${homestay.homestayId}` 
              : `/homestays/${homestay.homestayId}`
            }>
              <button className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark transition-colors text-sm font-medium">
                View Details
              </button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
} 