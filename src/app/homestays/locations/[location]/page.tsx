'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Star, Bed, Home } from "lucide-react";
import HomestayListing from '@/components/homestays/HomestayListing';

// Updated interface to include index signature for string types
interface LocationParams {
  location: string;
  [key: string]: string | string[];
}

export default function LocationHomestayPage() {
  const params = useParams<LocationParams>();
  const [locationInfo, setLocationInfo] = useState<{
    name: string;
    type: 'province' | 'district' | 'municipality' | 'city';
    description: string;
  }>({
    name: '',
    type: 'district',
    description: ''
  });
  
  useEffect(() => {
    // Parse the location param to determine what type of location it is
    const location = params.location;
    
    if (!location) return;
    
    let locationType: 'province' | 'district' | 'municipality' | 'city' = 'district';
    let locationName = location.replace(/-/g, ' ');
    
    // Determine location type from URL structure (simplified)
    if (locationName.toLowerCase().includes('province')) {
      locationType = 'province';
    } else if (locationName.toLowerCase().includes('municipality')) {
      locationType = 'municipality';
    } else if (locationName.toLowerCase().includes('city')) {
      locationType = 'city';
    } else {
      locationType = 'district';
    }
    
    // Clean up the name
    locationName = locationName
      .replace(/province|district|municipality|city/gi, '')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Generate a description based on location type
    let description = '';
    switch (locationType) {
      case 'province':
        description = `Discover authentic homestays in ${locationName} Province, Nepal. Experience local culture, cuisine, and hospitality in comfortable accommodations.`;
        break;
      case 'district':
        description = `Find the perfect homestay in ${locationName} District, Nepal. Immerse yourself in local traditions, explore scenic landscapes, and enjoy authentic Nepali hospitality.`;
        break;
      case 'municipality':
        description = `Browse homestays in ${locationName} Municipality, Nepal. Stay with local families, taste homemade Nepali food, and experience the authentic way of life.`;
        break;
      case 'city':
        description = `Looking for homestays in ${locationName}, Nepal? Our selection offers comfortable accommodations with local families, providing an authentic cultural experience.`;
        break;
    }
    
    setLocationInfo({
      name: locationName,
      type: locationType,
      description
    });
    
    // Set page metadata dynamically
    document.title = `Homestays in ${locationName}, Nepal | Hamro Home Stay`;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);
    
    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `https://hamrohomestay.com/homestays/locations/${params.location}`);
    
  }, [params.location]);
  
  // Query string for filtering (simplified - in a real app, this would be more sophisticated)
  const getQueryParam = () => {
    const { name, type } = locationInfo;
    if (!name) return '';
    
    switch (type) {
      case 'province': return `province=${encodeURIComponent(name)}`;
      case 'district': return `district=${encodeURIComponent(name)}`;
      case 'municipality': return `municipality=${encodeURIComponent(name)}`;
      case 'city': return `city=${encodeURIComponent(name)}`;
      default: return `district=${encodeURIComponent(name)}`;
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Homestays in {locationInfo.name}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {locationInfo.description}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">About {locationInfo.name}</h2>
          <p className="text-gray-700 mb-4">
            {locationInfo.type === 'province' && `${locationInfo.name} Province is one of the seven provinces of Nepal, offering diverse landscapes, cultural experiences, and authentic homestay options.`}
            {locationInfo.type === 'district' && `${locationInfo.name} District in Nepal provides travelers with stunning natural beauty, local traditions, and warm hospitality through its homestay accommodations.`}
            {locationInfo.type === 'municipality' && `${locationInfo.name} Municipality offers visitors a chance to experience authentic Nepali lifestyle through homestays, local cuisine, and cultural exchanges.`}
            {locationInfo.type === 'city' && `${locationInfo.name} is a vibrant location in Nepal where travelers can enjoy homestay experiences with local families while exploring nearby attractions.`}
          </p>
          <p className="text-gray-700">
            When you stay at a homestay in {locationInfo.name}, you'll get to experience daily life, taste authentic cuisine, and learn about local customs directly from your hosts.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Homestays</h2>
          {/* This will display homestays filtered by the location */}
          <HomestayListing locationFilter={getQueryParam()} />
        </div>
        
        <div className="bg-primary-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-3">Explore Other Locations</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/homestays/locations/kathmandu-district" className="bg-white p-3 rounded shadow-sm hover:shadow-md transition">
              <span className="block font-medium">Kathmandu District</span>
            </Link>
            <Link href="/homestays/locations/kaski-district" className="bg-white p-3 rounded shadow-sm hover:shadow-md transition">
              <span className="block font-medium">Kaski District</span>
            </Link>
            <Link href="/homestays/locations/chitwan-district" className="bg-white p-3 rounded shadow-sm hover:shadow-md transition">
              <span className="block font-medium">Chitwan District</span>
            </Link>
            <Link href="/homestays/locations/lalitpur-district" className="bg-white p-3 rounded shadow-sm hover:shadow-md transition">
              <span className="block font-medium">Lalitpur District</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 