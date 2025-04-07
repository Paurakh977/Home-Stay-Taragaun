"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, Star, Bed, Home, Filter, X, ChevronDown, ArrowRight, Utensils, Wifi, Users, Mountain } from "lucide-react";

// Types
interface HomestayListing {
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
  address: {
    province: string;
    district: string;
    municipality: string;
    ward: string;
    city: string;
    tole: string;
    formattedAddress: string;
    translations?: {
      province: { en: string; ne: string };
      district: { en: string; ne: string };
      municipality: { en: string; ne: string };
      ward: { en: string; ne: string };
      formattedAddress: { en: string; ne: string };
    };
  };
  features?: {
    localAttractions: string[];
    tourismServices: string[];
    infrastructure: string[];
  };
  profileImage?: string;
  dhsrNo?: string;
}

// Address translations
const provinceTranslations: Record<string, string> = {
  "कोशी": "Koshi",
  "मधेश": "Madhesh",
  "वागमती": "Bagmati",
  "गण्डकी": "Gandaki",
  "लुम्बिनी": "Lumbini",
  "कर्णाली": "Karnali",
  "सुदुर पश्चिम": "Sudurpashchim"
};

// Facility categories for filtering
const facilityCategories = [
  { name: "Local Attractions", key: "localAttractions", icon: <Mountain size={16} className="mr-1" /> },
  { name: "Tourism Services", key: "tourismServices", icon: <Users size={16} className="mr-1" /> },
  { name: "Infrastructure", key: "infrastructure", icon: <Wifi size={16} className="mr-1" /> }
];

// New component to contain the logic using searchParams
function HomestayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State variables
  const [homestays, setHomestays] = useState<HomestayListing[]>([]);
  const [filteredHomestays, setFilteredHomestays] = useState<HomestayListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Address data state
  const [addressData, setAddressData] = useState<{
    allProvinces: string[];
    provinceDistrictsMap: Record<string, string[]>;
    districtMunicipalitiesMap: Record<string, string[]>;
    districtTranslations: Record<string, string>;
    municipalityTranslations: Record<string, string>;
  }>({
    allProvinces: [],
    provinceDistrictsMap: {},
    districtMunicipalitiesMap: {},
    districtTranslations: {},
    municipalityTranslations: {}
  });
  
  // Filter states
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);
  
  // Facility filter states
  const [allFacilities, setAllFacilities] = useState<{
    localAttractions: string[];
    tourismServices: string[];
    infrastructure: string[];
  }>({
    localAttractions: [],
    tourismServices: [],
    infrastructure: []
  });
  const [selectedFacilities, setSelectedFacilities] = useState<{
    localAttractions: string[];
    tourismServices: string[];
    infrastructure: string[];
  }>({
    localAttractions: [],
    tourismServices: [],
    infrastructure: []
  });

  // Load address data
  useEffect(() => {
    const fetchAddressData = async () => {
      try {
        // Fetch all the required JSON files
        const responses = await Promise.all([
          fetch('/address/all-provinces.json').then(res => res.json()),
          fetch('/address/map-province-districts.json').then(res => res.json()),
          fetch('/address/map-districts-municipalities.json').then(res => res.json()),
          fetch('/address/all-districts.json').then(res => res.json()),
          fetch('/address/all-municipalities.json').then(res => res.json())
        ]);

        // Type assertions to fix linter errors
        const provinces = responses[0] as string[];
        const provinceDistricts = responses[1] as Record<string, string[]>;
        const districtMunicipalities = responses[2] as Record<string, string[]>;
        const districtTranslations = responses[3] as Record<string, string>;
        const municipalityTranslations = responses[4] as Record<string, string>;

        setAddressData({
          allProvinces: provinces,
          provinceDistrictsMap: provinceDistricts,
          districtMunicipalitiesMap: districtMunicipalities,
          districtTranslations,
          municipalityTranslations
        });
      } catch (error) {
        console.error("Error loading address data:", error);
      }
    };

    fetchAddressData();
  }, []);
  
  // Update available districts when province changes
  useEffect(() => {
    if (selectedProvince && addressData.provinceDistrictsMap) {
      const districts = addressData.provinceDistrictsMap[selectedProvince] || [];
      setAvailableDistricts(districts);
      
      // Reset district if it's no longer valid
      if (selectedDistrict && !districts.includes(selectedDistrict)) {
        setSelectedDistrict("");
        setSelectedMunicipality(""); // Also reset municipality
        setAvailableMunicipalities([]);
      }
    } else {
      setAvailableDistricts([]);
      setSelectedDistrict("");
      setSelectedMunicipality("");
      setAvailableMunicipalities([]);
    }
  }, [selectedProvince, addressData.provinceDistrictsMap, selectedDistrict]);
  
  // Update available municipalities when district changes
  useEffect(() => {
    if (selectedDistrict && addressData.districtMunicipalitiesMap) {
      const municipalities = addressData.districtMunicipalitiesMap[selectedDistrict] || [];
      setAvailableMunicipalities(municipalities);
      
      // Reset municipality if it's no longer valid
      if (selectedMunicipality && !municipalities.includes(selectedMunicipality)) {
        setSelectedMunicipality("");
      }
    } else {
      setAvailableMunicipalities([]);
      setSelectedMunicipality("");
    }
  }, [selectedDistrict, addressData.districtMunicipalitiesMap, selectedMunicipality]);
  
  // Fetch homestays
  useEffect(() => {
    async function fetchHomestays() {
      try {
        setLoading(true);
        console.log("Fetching homestays from API...");
        const response = await fetch("/api/homestays?limit=100");
        
        if (!response.ok) {
          console.error("API response not OK:", response.status, response.statusText);
          throw new Error("Failed to fetch homestays");
        }
        
        const data = await response.json();
        console.log("API response data:", data);
        console.log("Number of homestays returned:", data.data?.length || 0);
        
        // Set homestays from API data (empty array if no data)
        setHomestays(data.data || []);
        setFilteredHomestays(data.data || []);
        
        // Extract all unique facilities for filter options
        const allLocalAttractions = new Set<string>();
        const allTourismServices = new Set<string>();
        const allInfrastructure = new Set<string>();
        
        if (data.data && data.data.length > 0) {
          data.data.forEach((homestay: HomestayListing) => {
            if (homestay.features) {
              homestay.features.localAttractions?.forEach(item => allLocalAttractions.add(item));
              homestay.features.tourismServices?.forEach(item => allTourismServices.add(item));
              homestay.features.infrastructure?.forEach(item => allInfrastructure.add(item));
            }
          });
        } else {
          console.warn("No homestays found or empty data returned");
        }
        
        setAllFacilities({
          localAttractions: Array.from(allLocalAttractions),
          tourismServices: Array.from(allTourismServices),
          infrastructure: Array.from(allInfrastructure)
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching homestays:", err);
        setError("Could not load homestays. Please try again later.");
        setLoading(false);
        
        // Set empty arrays on error
        setHomestays([]);
        setFilteredHomestays([]);
        setAllFacilities({
          localAttractions: [],
          tourismServices: [],
          infrastructure: []
        });
      }
    }
    
    fetchHomestays();
  }, []);
  
  // Apply filters and search
  useEffect(() => {
    let results = [...homestays];
    
    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(homestay =>
        homestay.homeStayName.toLowerCase().includes(query) ||
        homestay.villageName.toLowerCase().includes(query) ||
        (homestay.address.formattedAddress && homestay.address.formattedAddress.toLowerCase().includes(query)) ||
        (homestay.description && homestay.description.toLowerCase().includes(query))
      );
    }
    
    // Apply province filter
    if (selectedProvince) {
      results = results.filter(homestay => homestay.address.province === selectedProvince);
    }
    
    // Apply district filter
    if (selectedDistrict) {
      results = results.filter(homestay => homestay.address.district === selectedDistrict);
    }
    
    // Apply municipality filter
    if (selectedMunicipality) {
      results = results.filter(homestay => homestay.address.municipality === selectedMunicipality);
    }
    
    // Apply homestay type filter
    if (selectedType) {
      results = results.filter(homestay => homestay.homeStayType === selectedType);
    }
    
    // Apply facility filters
    for (const category of facilityCategories) {
      const key = category.key as keyof typeof selectedFacilities;
      if (selectedFacilities[key].length > 0) {
        results = results.filter(homestay =>
          selectedFacilities[key].every(facility => 
            homestay.features?.[key]?.some(f => f.toLowerCase().includes(facility.toLowerCase()))
          )
        );
      }
    }
    
    setFilteredHomestays(results);
  }, [homestays, searchQuery, selectedProvince, selectedDistrict, selectedMunicipality, selectedType, selectedFacilities]);
  
  // Handle facility selection
  const toggleFacility = (category: keyof typeof selectedFacilities, facility: string) => {
    setSelectedFacilities(prev => {
      const isSelected = prev[category].includes(facility);
      return {
        ...prev,
        [category]: isSelected 
          ? prev[category].filter(f => f !== facility)
          : [...prev[category], facility]
      };
    });
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedMunicipality("");
    setSelectedType("");
    setSelectedFacilities({
      localAttractions: [],
      tourismServices: [],
      infrastructure: []
    });
  };
  
  // Helper to translate address components
  const getTranslatedAddress = (homestay: HomestayListing) => {
    const address = homestay.address;
    
    const province = provinceTranslations[address.province] || address.province;
    const district = addressData.districtTranslations[address.district] || address.district;
    
    return `${address.city}, ${district}, ${province}`;
  };
  
  // Render star ratings
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={16} 
            className={i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };
  
  // Format description for display
  const formatDescription = (description: string | undefined, maxLength: number = 120) => {
    if (!description) return "No description available";
    
    if (description.length <= maxLength) return description;
    
    return description.substring(0, maxLength) + '...';
  };
  
  // Initialize state from searchParams (Example)
  useEffect(() => {
    const initialSearch = searchParams.get('q') || "";
    setSearchQuery(initialSearch);
    const initialProvince = searchParams.get('province') || "";
    setSelectedProvince(initialProvince);
    // ... initialize other filters from searchParams ...
  }, [searchParams]);
  
  // Format the image path correctly
  const getImageUrl = (imagePath: string | undefined): string => {
    if (!imagePath) return '';
    
    // Check if it's already a full URL (e.g., https://...)
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Check if it's an upload path (/uploads/...)
    if (imagePath.startsWith('/uploads/')) {
      // Extract homestayId and filename from the path
      const parts = imagePath.split('/');
      console.log("Image path parts:", parts);
      
      if (parts.length >= 3) {
        const homestayId = parts[2];
        const filename = parts[parts.length - 1];
        
        // If it's a gallery image
        if (parts.includes('gallery')) {
          const galleryUrl = `/api/images/${homestayId}/gallery/${filename}?t=${new Date().getTime()}`;
          console.log("Processing gallery image:", imagePath, "→", galleryUrl);
          return galleryUrl;
        }
        
        // If it's a profile image
        if (parts.includes('profile') || filename.startsWith('profile.')) {
          const profileUrl = `/api/images/${homestayId}/profile/${filename}?t=${new Date().getTime()}`;
          console.log("Processing profile image:", imagePath, "→", profileUrl);
          return profileUrl;
        }
        
        // For older profile images that might not have the /profile/ segment
        // Default to profile directory
        const defaultUrl = `/api/images/${homestayId}/profile/${filename}?t=${new Date().getTime()}`;
        console.log("Processing image with default profile path:", imagePath, "→", defaultUrl);
        return defaultUrl;
      }
    }
    
    // Return as is if we can't determine the format
    console.log("Unable to process image path, returning as is:", imagePath);
    return imagePath;
  };
  
  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/90 to-primary text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Discover Authentic Homestays</h1>
          <p className="text-lg md:text-xl max-w-2xl opacity-90">Experience the true essence of Nepalese hospitality and culture with our curated homestays.</p>
        </div>
      </div>
      
      {/* Search and Filter Section */}
      <div className="container mx-auto px-4 py-6 -mt-8">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Search bar */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search homestays by name or location..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            {/* Filter button */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={20} className="text-primary" />
              <span className="font-medium">Filters</span>
              <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {/* Filter options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              {/* Address filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Province filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                  <div className="relative">
                    <select
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="appearance-none w-full p-2 pr-8 rounded border border-gray-200 focus:outline-none focus:border-primary"
                    >
                      <option value="">All Provinces</option>
                      {addressData.allProvinces.map((province, index) => (
                        <option key={index} value={province}>
                          {provinceTranslations[province] || province} / {province}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* District filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <div className="relative">
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="appearance-none w-full p-2 pr-8 rounded border border-gray-200 focus:outline-none focus:border-primary"
                      disabled={!selectedProvince}
                    >
                      <option value="">All Districts</option>
                      {availableDistricts.map((district, index) => (
                        <option key={index} value={district}>
                          {addressData.districtTranslations[district] || district} / {district}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Municipality filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
                  <div className="relative">
                    <select
                      value={selectedMunicipality}
                      onChange={(e) => setSelectedMunicipality(e.target.value)}
                      className="appearance-none w-full p-2 pr-8 rounded border border-gray-200 focus:outline-none focus:border-primary"
                      disabled={!selectedDistrict}
                    >
                      <option value="">All Municipalities</option>
                      {availableMunicipalities.map((municipality) => (
                        <option key={municipality} value={municipality}>
                          {addressData.municipalityTranslations[municipality] || municipality}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Homestay type filter */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Homestay Type</h4>
                <div className="flex gap-4">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="homeStayType"
                      value=""
                      checked={selectedType === ""}
                      onChange={() => setSelectedType("")}
                      className="form-radio text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="ml-2 text-sm text-gray-700">All Types</span>
                  </label>
                  
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="homeStayType"
                      value="community"
                      checked={selectedType === "community"}
                      onChange={() => setSelectedType("community")}
                      className="form-radio text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="ml-2 text-sm text-gray-700">Community</span>
                  </label>
                  
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="homeStayType"
                      value="private"
                      checked={selectedType === "private"}
                      onChange={() => setSelectedType("private")}
                      className="form-radio text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="ml-2 text-sm text-gray-700">Private</span>
                  </label>
                </div>
              </div>
              
              {/* Facilities filters */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-800 mb-3">Facilities</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {facilityCategories.map((category) => {
                    const key = category.key as keyof typeof allFacilities;
                    const facilities = allFacilities[key];
                    
                    return (
                      <div key={category.key} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          {category.icon} {category.name}
                        </h4>
                        
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {facilities.length > 0 ? (
                            facilities.map((facility, idx) => (
                              <div key={idx} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`${category.key}-${idx}`}
                                  checked={selectedFacilities[key].includes(facility)}
                                  onChange={() => toggleFacility(key, facility)}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label 
                                  htmlFor={`${category.key}-${idx}`}
                                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                                >
                                  {facility}
                                </label>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 italic">No options available</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Clear filters button */}
              <div className="flex justify-end">
                <button 
                  onClick={clearFilters}
                  className="px-4 py-2 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 flex items-center"
                >
                  <X size={16} className="mr-1" />
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Results count */}
      <div className="container mx-auto px-4 pt-6 pb-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            {filteredHomestays.length} {filteredHomestays.length === 1 ? 'homestay' : 'homestays'} found
          </p>
          
          {/* Could add sorting options here in the future */}
        </div>
      </div>
      
      {/* Homestays List */}
      <div className="container mx-auto px-4 pb-16">
        {filteredHomestays.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Home size={24} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No homestays found</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              We couldn't find any homestays matching your search criteria. Try adjusting your filters or search query.
            </p>
            <button 
              onClick={clearFilters}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHomestays.map((homestay) => (
              <div 
                key={homestay._id} 
                onClick={() => router.push(`/homestays/${homestay.homestayId}`)}
                className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
              >
                {/* Image */}
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  {homestay.profileImage ? (
                    <img 
                      src={getImageUrl(homestay.profileImage)} 
                      alt={homestay.homeStayName} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        console.warn(`[Homestay List] Failed to load image: ${homestay.profileImage}`, e);
                        // Hide the broken image and show placeholder
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        
                        // Find parent and add placeholder
                        const parent = target.parentElement;
                        if (parent) {
                          // Create placeholder with consistent styling
                          const placeholder = document.createElement('div');
                          placeholder.className = "w-full h-full flex flex-col items-center justify-center bg-gray-100";
                          
                          // Add house icon
                          const icon = document.createElement('div');
                          icon.className = "text-gray-400 mb-2";
                          icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>';
                          
                          // Add text explanation
                          const text = document.createElement('div');
                          text.className = "text-sm text-gray-500";
                          text.textContent = "Image unavailable";
                          
                          placeholder.appendChild(icon);
                          placeholder.appendChild(text);
                          parent.appendChild(placeholder);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                      <Home size={32} className="text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">No image available</span>
                    </div>
                  )}
                  
                  {/* Type badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`
                      text-xs font-medium px-2 py-1 rounded-full ${
                        homestay.homeStayType === 'community' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }
                    `}>
                      {homestay.homeStayType === 'community' ? 'Community' : 'Private'} Homestay
                    </span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                      {homestay.homeStayName}
                    </h3>
                    {renderRating(homestay.averageRating)}
                  </div>
                  
                  <div className="flex items-start gap-1 text-gray-500 mb-2">
                    <MapPin size={16} className="mt-0.5 min-w-4 text-gray-400" />
                    <span className="text-sm">{getTranslatedAddress(homestay)}</span>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {formatDescription(homestay.description)}
                  </p>
                  
                  {/* DHSR Number */}
                  {homestay.dhsrNo && (
                    <div className="mb-3">
                      <span className="inline-flex items-center text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-mono">
                        DHSR: {homestay.dhsrNo}
                      </span>
                    </div>
                  )}
                  
                  {/* Key Facilities */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {homestay.features?.localAttractions?.slice(0, 2).map((attraction, idx) => (
                      <span key={`attr-${idx}`} className="inline-flex items-center text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                        <Mountain size={10} className="mr-1" /> {attraction}
                      </span>
                    ))}
                    {homestay.features?.tourismServices?.slice(0, 2).map((service, idx) => (
                      <span key={`serv-${idx}`} className="inline-flex items-center text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                        <Utensils size={10} className="mr-1" /> {service}
                      </span>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Home size={14} className="text-primary" />
                        <span>{homestay.homeCount} {homestay.homeCount === 1 ? 'Home' : 'Homes'}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Bed size={14} className="text-primary" />
                        <span>{homestay.roomCount} {homestay.roomCount === 1 ? 'Room' : 'Rooms'}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {homestay.bedCount} {homestay.bedCount === 1 ? 'Bed' : 'Beds'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* View button */}
                <div className="px-4 pb-4 flex">
                  <div className="w-full group-hover:bg-primary/5 rounded-lg p-2 text-center text-sm font-medium text-primary flex justify-center items-center transition-colors">
                    <span>View Details</span>
                    <ArrowRight size={16} className="ml-1 transform transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Custom scrollbar style */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c5c5c5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
}

// Main page component now wraps HomestayContent in Suspense
export default function AllHomestaysPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center text-gray-600">Loading homestay filters and listings...</div>}>
      <HomestayContent />
    </Suspense>
  );
} 