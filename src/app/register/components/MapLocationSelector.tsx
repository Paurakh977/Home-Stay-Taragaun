'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import MapTypeSelector from './MapTypeSelector';

interface MapLocationSelectorProps {
  value: {
    latitude?: number;
    longitude?: number;
    address?: string;
    district?: string;
  };
  onChange: (location: {
    latitude: number;
    longitude: number;
    address?: string;
    district?: string;
  }) => void;
  initialSearchQuery?: string | null;
  autoSaveLocation?: boolean;
}

declare global {
  interface Window {
    L: any;
    GeoSearch: {
      OpenStreetMapProvider: any;
      GeoSearchControl: any;
    };
    mapTypeSelector?: {
      handleMapTypeChange: (mapType: string) => void;
    };
    mapInstance?: {
      map: any;
      marker: any;
      currentLat: number | null;
      currentLng: number | null;
    };
    mapSearchControl?: any; // Store search control separately
  }
}

const MapLocationSelector: React.FC<MapLocationSelectorProps> = ({ 
  value, 
  onChange, 
  initialSearchQuery = null, 
  autoSaveLocation = false 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState<string>('street');
  const [address, setAddress] = useState<string>(value.address || 'Finding location...');
  const [district, setDistrict] = useState<string>(value.district || 'Finding district...');
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);
  const [currentCoordinates, setCurrentCoordinates] = useState<{lat: number, lng: number} | null>(
    value.latitude && value.longitude ? {lat: value.latitude, lng: value.longitude} : null
  );
  const [hasPerformedInitialSearch, setHasPerformedInitialSearch] = useState(false);

  // Create refs at the component level
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchControlRef = useRef<any>(null);

  // Load Leaflet scripts when component mounts
  useEffect(() => {
    // Check if Leaflet is already loaded
    if (typeof window !== 'undefined' && window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Function to create Leaflet CSS link
    const loadLeafletCSS = () => {
      const linkEl = document.createElement('link');
      linkEl.rel = 'stylesheet';
      linkEl.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      document.head.appendChild(linkEl);
    };

    // Function to create GeoSearch CSS link
    const loadGeoSearchCSS = () => {
      const linkEl = document.createElement('link');
      linkEl.rel = 'stylesheet';
      linkEl.href = 'https://cdn.jsdelivr.net/npm/leaflet-geosearch@3.8.0/dist/geosearch.css';
      document.head.appendChild(linkEl);
    };

    // Function to load Leaflet script
    const loadLeafletScript = () => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
      script.onload = () => {
        // Once Leaflet is loaded, load GeoSearch
        const geoSearchScript = document.createElement('script');
        geoSearchScript.src = 'https://cdn.jsdelivr.net/npm/leaflet-geosearch@3.8.0/dist/bundle.min.js';
        geoSearchScript.onload = () => {
          setLeafletLoaded(true);
        };
        document.body.appendChild(geoSearchScript);
      };
      document.body.appendChild(script);
    };

    // Load all required resources
    loadLeafletCSS();
    loadGeoSearchCSS();
    loadLeafletScript();
  }, []);

  // Add custom marker style to document head
  useEffect(() => {
    const markerStyle = document.createElement('style');
    markerStyle.textContent = `
      .marker-pin {
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        background-color: #1A73E8;
        transform: rotate(-45deg);
        position: absolute;
        top: -15px;
        left: -15px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
      .marker-pin::after {
        content: '';
        width: 14px;
        height: 14px;
        position: absolute;
        background-color: #fff;
        border-radius: 50%;
        top: 8px;
        left: 8px;
      }
      .save-location-button {
        background-color: #1A73E8;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .save-location-button:hover {
        background-color: #1565C0;
      }
      .save-location-button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }
      .save-success {
        background-color: #4CAF50;
      }
    `;
    document.head.appendChild(markerStyle);

    return () => {
      document.head.removeChild(markerStyle);
    };
  }, []);

  // Initialize map once Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;

    // Nepal center coordinates
    const NEPAL_CENTER = [28.3949, 84.1240];
    const INITIAL_ZOOM = 7;
    
    // Initialize map with default view
    const map = window.L.map(mapRef.current).setView(NEPAL_CENTER, INITIAL_ZOOM);
    mapInstanceRef.current = map;
    
    // Add tile layers
    const streetLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const satelliteLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    const terrainLayer = window.L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });

    // Store layers for map type switching
    const layers = {
      street: streetLayer,
      satellite: satelliteLayer,
      terrain: terrainLayer
    };

    // Custom marker icon for better visibility
    const customIcon = window.L.divIcon({
      className: 'custom-map-marker',
      html: `<div class="marker-pin"></div>`,
      iconSize: [30, 42],
      iconAnchor: [15, 42]
    });
    
    // Initialize marker if coordinates exist
    let marker: any = null;
    if (value.latitude && value.longitude) {
      marker = window.L.marker([value.latitude, value.longitude], {
        draggable: true,
        icon: customIcon
      }).addTo(map);
      
      map.setView([value.latitude, value.longitude], 14);
      setCurrentCoordinates({lat: value.latitude, lng: value.longitude});
      
      // Store marker reference
      markerRef.current = marker;
      
      // Update coordinates when marker is dragged
      marker.on('dragend', function() {
        const position = marker.getLatLng();
        updateLocation(position.lat, position.lng);
      });
    }

    // Add search control for location search
    const provider = new window.GeoSearch.OpenStreetMapProvider({
      params: {
        'accept-language': 'en',
        countrycodes: 'np' // Nepal country code
      }
    });
    
    const searchControl = new window.GeoSearch.GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: 'Search in Nepal'
    });
    
    map.addControl(searchControl);
    searchControlRef.current = searchControl;

    // Handle map click to add/move marker
    map.on('click', function(e: any) {
      const { lat, lng } = e.latlng;
      
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = window.L.marker([lat, lng], {
          draggable: true,
          icon: customIcon
        }).addTo(map);
        
        // Store marker reference
        markerRef.current = marker;
        
        // Update coordinates when marker is dragged
        marker.on('dragend', function() {
          const position = marker.getLatLng();
          updateLocation(position.lat, position.lng);
        });
      }
      
      updateLocation(lat, lng);
      // Reset saved state when location changes
      setLocationSaved(false);
    });

    // Handle search results
    map.on('geosearch/showlocation', function(e: any) {
      const { location } = e;
      
      if (marker) {
        marker.setLatLng([location.y, location.x]);
      } else {
        marker = window.L.marker([location.y, location.x], {
          draggable: true,
          icon: customIcon
        }).addTo(map);
        
        // Store marker reference
        markerRef.current = marker;
        
        // Update coordinates when marker is dragged
        marker.on('dragend', function() {
          const position = marker.getLatLng();
          updateLocation(position.lat, position.lng);
        });
      }
      
      // Update location data
      updateLocation(location.y, location.x);
      
      console.log('Search result found:', location.y, location.x);
      console.log('Auto-save setting:', autoSaveLocation, 'Location saved:', locationSaved);
      
      // Auto-save the location if requested
      if (autoSaveLocation && !locationSaved) {
        console.log('Auto-saving location from search result');
        // Use a timeout to ensure the location data is updated
        setTimeout(() => {
          if (currentCoordinates) {
            handleSaveLocation();
          }
        }, 800);
      } else {
        // Reset saved state when location changes if not auto-saving
        setLocationSaved(false);
      }
    });

    // Function to update location data
    function updateLocation(lat: number, lng: number) {
      // Round to 6 decimal places
      const roundedLat = Math.round(lat * 1000000) / 1000000;
      const roundedLng = Math.round(lng * 1000000) / 1000000;
      
      // Update current coordinates
      setCurrentCoordinates({lat: roundedLat, lng: roundedLng});
      
      // Reverse geocode to get address
      reverseGeocode(roundedLat, roundedLng);
    }

    // Function to reverse geocode coordinates to address
    async function reverseGeocode(lat: number, lng: number) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await response.json();
        
        if (data && data.display_name) {
          const displayAddress = data.display_name;
          setAddress(displayAddress);
          
          // Extract district if available
          let districtName = '';
          if (data.address) {
            districtName = data.address.county || data.address.state_district || '';
            setDistrict(districtName);
          }
        }
      } catch (error) {
        console.error('Error reverse geocoding:', error);
      }
    }

    // Store map type switching function for the dropdown
    window.mapTypeSelector = {
      handleMapTypeChange: (newMapType: string) => {
        // Remove all current layers
        Object.values(layers).forEach(layer => {
          if (map.hasLayer(layer)) {
            map.removeLayer(layer);
          }
        });
        
        // Add selected layer
        switch (newMapType) {
          case 'satellite':
            satelliteLayer.addTo(map);
            break;
          case 'terrain':
            terrainLayer.addTo(map);
            break;
          default:
            streetLayer.addTo(map);
        }
        
        setMapType(newMapType);
      }
    };

    // Store global reference for debugging/testing
    window.mapInstance = {
      map,
      marker,
      currentLat: value.latitude || null,
      currentLng: value.longitude || null
    };
    
    // Store search control separately
    window.mapSearchControl = searchControl;

    // Clean up function to run when component unmounts
    return () => {
      map.remove();
      if (window.mapTypeSelector) {
        delete window.mapTypeSelector;
      }
      if (window.mapInstance) {
        delete window.mapInstance;
      }
      if (window.mapSearchControl) {
        delete window.mapSearchControl;
      }
    };
  }, [leafletLoaded, value.latitude, value.longitude, autoSaveLocation]);

  // Handle programmatic search if initialSearchQuery is provided
  useEffect(() => {
    if (
      leafletLoaded && 
      initialSearchQuery && 
      !hasPerformedInitialSearch && 
      mapInstanceRef.current
    ) {
      console.log('Performing initial search with query:', initialSearchQuery);
      
      try {
        // Find the input element within the search control
        const searchInput = document.querySelector('.leaflet-control-geosearch form input');
        if (searchInput) {
          // Set the value and dispatch events to trigger the search
          (searchInput as HTMLInputElement).value = initialSearchQuery;
          
          // Focus the input
          (searchInput as HTMLInputElement).focus();
          
          // Dispatch input event to trigger search suggestions
          const inputEvent = new Event('input', { bubbles: true });
          searchInput.dispatchEvent(inputEvent);
          
          // Wait a bit then dispatch keydown event for Enter key
          setTimeout(() => {
            const keyEvent = new KeyboardEvent('keydown', { 
              bubbles: true, 
              key: 'Enter',
              keyCode: 13,
              which: 13
            });
            searchInput.dispatchEvent(keyEvent);
            
            setHasPerformedInitialSearch(true);
          }, 500);
        }
      } catch (error) {
        console.error('Error during programmatic search:', error);
      }
    }
  }, [leafletLoaded, initialSearchQuery, hasPerformedInitialSearch]);

  // Handle map type selection
  const handleMapTypeChange = (newMapType: string) => {
    if (window.mapTypeSelector) {
      window.mapTypeSelector.handleMapTypeChange(newMapType);
    }
  };

  // Handle save location button click
  const handleSaveLocation = () => {
    if (currentCoordinates) {
      // Call the parent component's onChange function with current coordinates and address info
      onChange({
        latitude: currentCoordinates.lat,
        longitude: currentCoordinates.lng,
        address,
        district
      });
      
      // Mark as saved
      setLocationSaved(true);
      
      // Show success feedback
      const saveButton = document.getElementById('saveLocationButton');
      if (saveButton) {
        saveButton.classList.add('save-success');
        saveButton.textContent = 'Location Saved';
        
        // Reset button after 2 seconds
        setTimeout(() => {
          saveButton.classList.remove('save-success');
          saveButton.textContent = 'Save Location';
        }, 2000);
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      <div 
        ref={mapRef} 
        className="w-full h-[400px] bg-gray-100 border border-gray-300 rounded-md relative"
      >
        {leafletLoaded && (
          <MapTypeSelector 
            onChange={handleMapTypeChange}
            currentType={mapType}
          />
        )}
      </div>
      
      <div className="flex flex-col space-y-2 mt-4">
        <div className="flex items-start">
          <span className="text-sm font-medium text-gray-700 w-24">Coordinates:</span>
          <span className="text-sm text-gray-800">
            {currentCoordinates 
              ? `${currentCoordinates.lat}, ${currentCoordinates.lng}` 
              : 'Not selected'}
          </span>
        </div>
        
        <div className="flex items-start">
          <span className="text-sm font-medium text-gray-700 w-24">Address:</span>
          <span className="text-sm text-gray-800">{address}</span>
        </div>
        
        <div className="flex items-start">
          <span className="text-sm font-medium text-gray-700 w-24">District:</span>
          <span className="text-sm text-gray-800">{district}</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          <p>Click on the map to select the exact location of your homestay.</p>
        </div>
        
        <button 
          id="saveLocationButton"
          className="save-location-button"
          onClick={handleSaveLocation}
          disabled={!currentCoordinates}
        >
          Save Location
        </button>
      </div>
    </div>
  );
};

export default MapLocationSelector; 