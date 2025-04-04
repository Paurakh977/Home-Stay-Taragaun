"use client";

import React, { useState } from "react";

interface HomestayFeaturesData {
  localAttractions: string[];
  tourismServices: string[];
  infrastructure: string[];
}

type HomestayFeaturesFormProps = {
  formData: HomestayFeaturesData;
  updateFormData: (data: Partial<HomestayFeaturesData>) => void;
};

const HomestayFeaturesForm: React.FC<HomestayFeaturesFormProps> = ({ formData, updateFormData }) => {
  // State for new items
  const [newAttraction, setNewAttraction] = useState("");
  const [newService, setNewService] = useState("");
  const [newInfrastructure, setNewInfrastructure] = useState("");

  // Make sure arrays exist
  const attractions = Array.isArray(formData.localAttractions) ? formData.localAttractions : [];
  const services = Array.isArray(formData.tourismServices) ? formData.tourismServices : [];
  const infrastructures = Array.isArray(formData.infrastructure) ? formData.infrastructure : [];

  // Handle adding attractions
  const handleAddAttraction = () => {
    if (newAttraction.trim() === "") return;
    updateFormData({
      localAttractions: [...attractions, newAttraction]
    });
    setNewAttraction("");
  };

  // Handle adding services
  const handleAddService = () => {
    if (newService.trim() === "") return;
    updateFormData({
      tourismServices: [...services, newService]
    });
    setNewService("");
  };

  // Handle adding infrastructure
  const handleAddInfrastructure = () => {
    if (newInfrastructure.trim() === "") return;
    updateFormData({
      infrastructure: [...infrastructures, newInfrastructure]
    });
    setNewInfrastructure("");
  };

  // Handle removing items
  const handleRemoveAttraction = (index: number) => {
    updateFormData({
      localAttractions: attractions.filter((_, i) => i !== index)
    });
  };

  const handleRemoveService = (index: number) => {
    updateFormData({
      tourismServices: services.filter((_, i) => i !== index)
    });
  };

  const handleRemoveInfrastructure = (index: number) => {
    updateFormData({
      infrastructure: infrastructures.filter((_, i) => i !== index)
    });
  };

  // Handle keydown for enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, addFunction: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFunction();
    }
  };

  return (
    <div className="space-y-8">
      {/* Local Tourism Attractions/Products */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-800">
          1. Local Tourism Attractions/Products / स्थानिय पर्यटकीय आकर्षण/उत्पादनहरु
        </h3>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newAttraction}
            onChange={(e) => setNewAttraction(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleAddAttraction)}
            placeholder="Add attraction / आकर्षण थप्नुहोस्"
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
          <button
            type="button"
            onClick={handleAddAttraction}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Add / थप्नुहोस्
          </button>
        </div>
        
        {/* List of added attractions */}
        <div className="space-y-2">
          {attractions.map((attraction, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
              <span>{attraction}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttraction(index)}
                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}
          {attractions.length === 0 && (
            <p className="text-sm text-gray-500 italic">No attractions added yet. Please add at least one.</p>
          )}
        </div>
      </div>

      {/* Available Tourism Services and Facilities */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-800">
          2. Available Tourism Services and Facilities / उपलब्ध पर्यटकीय सेवा सुविधाहरु
        </h3>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleAddService)}
            placeholder="Add service or facility / सेवा वा सुविधा थप्नुहोस्"
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
          <button
            type="button"
            onClick={handleAddService}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Add / थप्नुहोस्
          </button>
        </div>
        
        {/* List of added services */}
        <div className="space-y-2">
          {services.map((service, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
              <span>{service}</span>
              <button
                type="button"
                onClick={() => handleRemoveService(index)}
                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}
          {services.length === 0 && (
            <p className="text-sm text-gray-500 italic">No services added yet. Please add at least one.</p>
          )}
        </div>
      </div>

      {/* Infrastructure Available in the Homestay Village */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-800">
          3. Infrastructure Available in the Homestay Village / होमस्टे गाउँमा भएका पूर्वाधारहरु
        </h3>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newInfrastructure}
            onChange={(e) => setNewInfrastructure(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleAddInfrastructure)}
            placeholder="Add infrastructure / पूर्वाधार थप्नुहोस्"
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
          <button
            type="button"
            onClick={handleAddInfrastructure}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Add / थप्नुहोस्
          </button>
        </div>
        
        {/* List of added infrastructure */}
        <div className="space-y-2">
          {infrastructures.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemoveInfrastructure(index)}
                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}
          {infrastructures.length === 0 && (
            <p className="text-sm text-gray-500 italic">No infrastructure added yet. Please add at least one.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomestayFeaturesForm; 