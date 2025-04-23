"use client";

import React, { useState, useEffect } from "react";

interface HomestayFeaturesData {
  localAttractions: string[];
  tourismServices: string[];
  infrastructure: string[];
}

type HomestayFeaturesFormProps = {
  formData: HomestayFeaturesData;
  updateFormData: (data: Partial<HomestayFeaturesData>) => void;
};

// Common tourism services with English/Nepali translations
const commonTourismServices = [
  { value: "Welcome and Farewell/स्वागत तथा विदाई", checked: false },
  { value: "Comfortable Accommodation/आरामदायी आवास", checked: false },
  { value: "Gift or Souvenir/मायाको चिनो (उपहार)", checked: false },
  { value: "Traditional Cultural Program/परम्परागत सांस्कृतिक कार्यक्रम", checked: false },
  { value: "Local Dishes/स्थानीय परिकारहरू", checked: false },
];

// Common infrastructure with English/Nepali translations
const commonInfrastructure = [
  { value: "Community Building/सामुदायिक भवन", checked: false },
  { value: "Guest Room, Toilet, Bathroom/पाहुना कोठा, शौचालय, स्नानघर", checked: false },
  { value: "Transportation Facility/यातायात सुविधा", checked: false },
  { value: "Drinking Water and Solar Lighting/खानेपानी तथा सोलार बत्ती", checked: false },
  { value: "Security Post (Nepaltar)/सुरक्षा चौकी (नेपालटार)", checked: false },
  { value: "Health Post (Udayapurgadhi)/स्वास्थ्य चौकी (उदयपुरगढी)", checked: false },
  { value: "Communication Facility (Mobile)/सञ्चार सुविधा (मोबाइल)", checked: false },
];

const HomestayFeaturesForm: React.FC<HomestayFeaturesFormProps> = ({ formData, updateFormData }) => {
  // State for new items
  const [newAttraction, setNewAttraction] = useState("");
  const [newService, setNewService] = useState("");
  const [newInfrastructure, setNewInfrastructure] = useState("");
  
  // State for checkboxes
  const [tourismServiceCheckboxes, setTourismServiceCheckboxes] = useState(
    commonTourismServices.map(service => ({
      ...service,
      checked: formData.tourismServices.includes(service.value)
    }))
  );
  
  const [infrastructureCheckboxes, setInfrastructureCheckboxes] = useState(
    commonInfrastructure.map(infra => ({
      ...infra,
      checked: formData.infrastructure.includes(infra.value)
    }))
  );
  
  // Update checkbox states when formData changes
  useEffect(() => {
    setTourismServiceCheckboxes(
      commonTourismServices.map(service => ({
        ...service,
        checked: formData.tourismServices.includes(service.value)
      }))
    );
    
    setInfrastructureCheckboxes(
      commonInfrastructure.map(infra => ({
        ...infra,
        checked: formData.infrastructure.includes(infra.value)
      }))
    );
  }, [formData.tourismServices, formData.infrastructure]);

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
  
  // Handle checkbox change for tourism services
  const handleTourismServiceCheckboxChange = (index: number) => {
    const updatedCheckboxes = [...tourismServiceCheckboxes];
    updatedCheckboxes[index].checked = !updatedCheckboxes[index].checked;
    setTourismServiceCheckboxes(updatedCheckboxes);
    
    // Update form data based on checked boxes
    const checkedValues = updatedCheckboxes
      .filter(item => item.checked)
      .map(item => item.value);
      
    // Combine checked values with custom entries (excluding common ones)
    const customServices = services.filter(
      service => !commonTourismServices.some(common => common.value === service)
    );
    
    updateFormData({
      tourismServices: [...checkedValues, ...customServices]
    });
  };
  
  // Handle checkbox change for infrastructure
  const handleInfrastructureCheckboxChange = (index: number) => {
    const updatedCheckboxes = [...infrastructureCheckboxes];
    updatedCheckboxes[index].checked = !updatedCheckboxes[index].checked;
    setInfrastructureCheckboxes(updatedCheckboxes);
    
    // Update form data based on checked boxes
    const checkedValues = updatedCheckboxes
      .filter(item => item.checked)
      .map(item => item.value);
      
    // Combine checked values with custom entries (excluding common ones)
    const customInfrastructure = infrastructures.filter(
      infra => !commonInfrastructure.some(common => common.value === infra)
    );
    
    updateFormData({
      infrastructure: [...checkedValues, ...customInfrastructure]
    });
  };

  return (
    <div className="space-y-8">
      {/* Local Tourism Attractions/Products */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-800">
          1. Local Tourism Attractions/Products / स्थानिय पर्यटकीय आकर्षण/उत्पादनहरु
          <span className="text-red-500 ml-1">*</span>
        </h3>
        <p className="text-sm text-gray-600">At least one attraction is required.</p>
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
                disabled={attractions.length === 1}
              >
                ✕
              </button>
            </div>
          ))}
          {attractions.length === 0 && (
            <p className="text-sm text-red-500 italic">No attractions added yet. Please add at least one.</p>
          )}
        </div>
      </div>

      {/* Available Tourism Services and Facilities */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-800">
          2. Available Tourism Services and Facilities / उपलब्ध पर्यटकीय सेवा सुविधाहरु
          <span className="text-red-500 ml-1">*</span>
        </h3>
        <p className="text-sm text-gray-600">At least one service is required.</p>
        
        {/* Common tourism services checkboxes */}
        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-gray-700">Common services (check all that apply):</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tourismServiceCheckboxes.map((service, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="checkbox"
                  id={`tourism-service-${index}`}
                  checked={service.checked}
                  onChange={() => handleTourismServiceCheckboxChange(index)}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor={`tourism-service-${index}`} className="ml-2 text-sm text-gray-700">
                  {service.value.split('/')[0]} / {service.value.split('/')[1]}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleAddService)}
            placeholder="Add additional service or facility / अतिरिक्त सेवा वा सुविधा थप्नुहोस्"
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
        
        {/* List of added custom services */}
        <div className="space-y-2">
          {services
            .filter(service => !commonTourismServices.some(common => common.value === service))
            .map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                <span>{service}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveService(services.indexOf(service))}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            ))}
          {services.length === 0 && (
            <p className="text-sm text-red-500 italic">No services added yet. Please add at least one.</p>
          )}
        </div>
      </div>

      {/* Infrastructure Available in the Homestay Village */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-800">
          3. Infrastructure Available in the Homestay Village / होमस्टे गाउँमा भएका पूर्वाधारहरु
          <span className="text-red-500 ml-1">*</span>
        </h3>
        <p className="text-sm text-gray-600">At least one infrastructure item is required.</p>
        
        {/* Common infrastructure checkboxes */}
        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-gray-700">Common infrastructure (check all that apply):</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {infrastructureCheckboxes.map((infra, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="checkbox"
                  id={`infrastructure-${index}`}
                  checked={infra.checked}
                  onChange={() => handleInfrastructureCheckboxChange(index)}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor={`infrastructure-${index}`} className="ml-2 text-sm text-gray-700">
                  {infra.value.split('/')[0]} / {infra.value.split('/')[1]}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newInfrastructure}
            onChange={(e) => setNewInfrastructure(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleAddInfrastructure)}
            placeholder="Add additional infrastructure / अतिरिक्त पूर्वाधार थप्नुहोस्"
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
        
        {/* List of added custom infrastructure */}
        <div className="space-y-2">
          {infrastructures
            .filter(infra => !commonInfrastructure.some(common => common.value === infra))
            .map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveInfrastructure(infrastructures.indexOf(item))}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            ))}
          {infrastructures.length === 0 && (
            <p className="text-sm text-red-500 italic">No infrastructure added yet. Please add at least one.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomestayFeaturesForm; 