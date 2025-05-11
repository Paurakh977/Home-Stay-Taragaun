import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';

// Import the MapLocationSelector component with dynamic import (no SSR)
const MapLocationSelector = dynamic(
  () => import('./MapLocationSelector'),
  { ssr: false }
);

interface WayToHomeStayData {
  directions?: string;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  locationDistrict?: string;
}

// Extended props to include address details
type WayToHomeStayProps = {
  formData: WayToHomeStayData & {
    province?: { en?: string; ne?: string } | string;
    district?: { en?: string; ne?: string } | string;
    municipality?: { en?: string; ne?: string } | string;
    ward?: { en?: string; ne?: string } | string;
    city?: string;
    tole?: string;
  };
  updateFormData: (data: Partial<WayToHomeStayData>) => void;
};

const WayToHomeStay: React.FC<WayToHomeStayProps> = ({ formData, updateFormData }) => {
  const [locationSaved, setLocationSaved] = useState(
    Boolean(formData.latitude && formData.longitude)
  );
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  // Generate search query from address details when component mounts
  useEffect(() => {
    // Check if we have address details to create a search query
    if (!locationSaved && hasAddressDetails()) {
      const query = buildAddressSearchQuery();
      if (query) {
        console.log('Address details found, setting search query:', query);
        
        // Check if query contains Nepali characters (basic check)
        if (/[\u0900-\u097F]/.test(query)) {
          console.warn('Warning: Query may contain Nepali characters:', query);
        }
        
        setSearchQuery(query);
      }
    } else if (locationSaved) {
      console.log('Location already saved, skipping auto-search');
    }
  }, []);
  
  // Debug function to print detailed values from formData
  const debugFormData = () => {
    const structureDetails = Object.entries(formData)
      .filter(([key]) => ['province', 'district', 'municipality', 'ward'].includes(key))
      .map(([key, value]) => {
        const type = typeof value;
        let details;
        
        if (type === 'object' && value !== null) {
          details = {
            type,
            en: (value as any).en,
            ne: (value as any).ne,
            hasEn: Boolean((value as any).en),
            hasNe: Boolean((value as any).ne),
          };
        } else {
          details = {
            type,
            value,
            stringValue: String(value || ''),
          };
        }
        
        return { field: key, details };
      });
      
    console.table(structureDetails);
    return structureDetails;
  };

  // Check if address details are filled
  const hasAddressDetails = () => {
    // Debug the form data structure first
    console.log("DEBUG: Form Data Structure for Address Fields");
    const dataStructure = debugFormData();
    
    // Handle both object structure and string structure
    const getMunicipalityValue = () => {
      if (typeof formData.municipality === 'object' && formData.municipality !== null) {
        return formData.municipality.en || '';
      }
      return '';
    };

    const getDistrictValue = () => {
      if (typeof formData.district === 'object' && formData.district !== null) {
        return formData.district.en || '';
      }
      return '';
    };

    const getProvinceValue = () => {
      if (typeof formData.province === 'object' && formData.province !== null) {
        return formData.province.en || '';
      }
      return '';
    };

    // Check if we have the necessary English values for the search
    const municipality = getMunicipalityValue();
    const district = getDistrictValue();
    const province = getProvinceValue();
    
    console.log('Extracted English values:', {
      municipality,
      district,
      province
    });
    
    if (municipality && district && province) {
      console.log('Address details check: OK - Will use these English values');
      return true;
    }
    
    console.log('Address details check: Missing required English values');
    return false;
  };

  // Helper function to extract the main part of municipality name
  const extractMainMunicipalityName = (fullName: string): string => {
    if (!fullName) return '';
    
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || '';
  };

  // Build search query from address details
  const buildAddressSearchQuery = (): string | null => {
    try {
      // Get values directly from object properties, focusing ONLY on the 'en' property
      let municipalityValue = '';
      let districtValue = '';
      let provinceValue = '';
      let wardValue = '';
      
      // Extract municipality in English
      if (typeof formData.municipality === 'object' && formData.municipality !== null) {
        municipalityValue = formData.municipality.en || '';
        // Extract just the main part of the municipality name
        municipalityValue = extractMainMunicipalityName(municipalityValue);
      }
      
      // Extract district in English
      if (typeof formData.district === 'object' && formData.district !== null) {
        districtValue = formData.district.en || '';
      }
      
      // Extract province in English
      if (typeof formData.province === 'object' && formData.province !== null) {
        provinceValue = formData.province.en || '';
      }
      
      // Extract ward in English
      if (typeof formData.ward === 'object' && formData.ward !== null) {
        wardValue = formData.ward.en || '';
      }
      
      // Log the values we'll use
      console.log('ENGLISH VALUES EXTRACTED:', {
        municipality: municipalityValue,
        ward: wardValue,
        district: districtValue,
        province: provinceValue
      });
      
      // Only form the query if we have the essential parts
      if (municipalityValue && districtValue) {
        // Format: "municipality name - ward No, district, province"
        let query = municipalityValue;
        
        if (wardValue) {
          query += ` - ${wardValue}`;
        }
        
        if (districtValue) {
          query += `, ${districtValue}`;
        }
        
        if (provinceValue) {
          query += `, ${provinceValue}`;
        }
        
        // Add Nepal as country for better results
        query += ', Nepal';
        
        console.log('Final ENGLISH search query:', query);
        return query;
      }
    } catch (error) {
      console.error('Error building address search query:', error);
    }
    
    return null;
  };

  // Handle text direction changes
  const handleDirectionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateFormData({ directions: e.target.value });
  };
  
  // Handle location selection
  const handleLocationChange = (location: {
    latitude: number;
    longitude: number;
    address?: string;
    district?: string;
  }) => {
    console.log('Location saved:', location);
    
    // Update form data
    updateFormData({
      latitude: location.latitude,
      longitude: location.longitude,
      locationAddress: location.address,
      locationDistrict: location.district
    });
    
    // Mark as saved
    setLocationSaved(true);
  };

  // Helper to translate common Nepali province names to English
  const getNepaliProvinceInEnglish = (provinceName: string): string => {
    const provinceMap: Record<string, string> = {
      "कोशी": "Koshi",
      "मधेश": "Madhesh",
      "वागमती": "Bagmati",
      "गण्डकी": "Gandaki",
      "लुम्बिनी": "Lumbini",
      "कर्णाली": "Karnali",
      "सुदुर पश्चिम": "Sudurpashchim"
    };
    
    return provinceMap[provinceName] || provinceName;
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-700 mb-4">
          Please select your homestay location on the map and click "Save Location" to confirm. 
          Then provide written directions to help guests find your homestay.
        </p>
        
        {/* Location indicator */}
        {locationSaved && formData.latitude && formData.longitude && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 font-medium">
              Location saved: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </p>
            {formData.locationAddress && (
              <p className="text-green-700 text-sm mt-1">{formData.locationAddress}</p>
            )}
          </div>
        )}
        
        {/* Map Location Selector */}
        <MapLocationSelector 
          value={{
            latitude: formData.latitude,
            longitude: formData.longitude,
            address: formData.locationAddress,
            district: formData.locationDistrict
          }}
          onChange={handleLocationChange}
          initialSearchQuery={searchQuery}
          autoSaveLocation={!locationSaved && Boolean(searchQuery)}
        />
        
        {/* Optional text directions */}
        <div className="mt-6">
          <label htmlFor="directions" className="block text-sm font-medium text-gray-700 mb-1">
            Written Directions <span className="text-sm font-normal text-gray-500">(Optional)</span> / लिखित निर्देशन <span className="text-sm font-normal text-gray-500">(वैकल्पिक)</span>
          </label>
          <textarea
            id="directions"
            name="directions"
            rows={4}
            value={formData.directions || ''}
            onChange={handleDirectionsChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="Provide written directions to your homestay..."
          />
        </div>

        <p className="text-sm text-gray-500 mt-2">
          Provide information about how to reach your homestay. Include available transportation and key landmarks that will help guests find your location.
        </p>
      </div>
    </div>
  );
};

export default WayToHomeStay; 