'use client';

import React, { useEffect } from 'react';

interface MapTypeSelectorProps {
  onChange: (mapType: string) => void;
  currentType: string;
}

const MapTypeSelector: React.FC<MapTypeSelectorProps> = ({ onChange, currentType }) => {
  // Use effect to directly trigger map type change when select changes
  useEffect(() => {
    const mapTypeSelect = document.getElementById('mapTypeSelect');
    
    // Handle direct DOM change events from the map component
    const handleSelectChange = (e: Event) => {
      const target = e.target as HTMLSelectElement;
      onChange(target.value);
    };
    
    if (mapTypeSelect) {
      mapTypeSelect.addEventListener('change', handleSelectChange);
      
      // Clean up event listener
      return () => {
        mapTypeSelect.removeEventListener('change', handleSelectChange);
      };
    }
  }, [onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="absolute top-2 right-2 z-[1000] bg-white rounded shadow-md overflow-hidden">
      <select
        id="mapTypeSelect"
        value={currentType}
        onChange={handleChange}
        className="px-3 py-2 appearance-none border-none text-sm font-medium cursor-pointer bg-white"
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%23202124' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
          paddingRight: '28px'
        }}
      >
        <option value="street">Street Map</option>
        <option value="satellite">Satellite</option>
        <option value="terrain">Terrain</option>
      </select>
    </div>
  );
};

export default MapTypeSelector; 