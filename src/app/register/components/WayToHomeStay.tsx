import React, { useState } from "react";
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

type WayToHomeStayProps = {
  formData: WayToHomeStayData;
  updateFormData: (data: Partial<WayToHomeStayData>) => void;
};

const WayToHomeStay: React.FC<WayToHomeStayProps> = ({ formData, updateFormData }) => {
  const [locationSaved, setLocationSaved] = useState(
    Boolean(formData.latitude && formData.longitude)
  );

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