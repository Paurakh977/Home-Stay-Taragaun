import React, { useState } from "react";
import { X, Plus, Tag } from "lucide-react";

interface FeaturesFormData {
  localAttractions: string[];
  tourismServices: string[];
  infrastructure: string[];
}

interface FeaturesSectionProps {
  formData: FeaturesFormData;
  updateFormData: (data: Partial<FeaturesFormData>) => void;
  isEditing: boolean;
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  formData,
  updateFormData,
  isEditing
}) => {
  // New item input states
  const [newAttraction, setNewAttraction] = useState("");
  const [newService, setNewService] = useState("");
  const [newInfrastructure, setNewInfrastructure] = useState("");

  // Handle adding new items
  const addItem = (type: keyof FeaturesFormData, value: string) => {
    if (!value.trim()) return;
    
    const updatedList = [...formData[type], value.trim()];
    updateFormData({ [type]: updatedList });
    
    // Clear input field
    switch (type) {
      case "localAttractions":
        setNewAttraction("");
        break;
      case "tourismServices":
        setNewService("");
        break;
      case "infrastructure":
        setNewInfrastructure("");
        break;
    }
  };

  // Handle removing items
  const removeItem = (type: keyof FeaturesFormData, index: number) => {
    const updatedList = [...formData[type]];
    updatedList.splice(index, 1);
    updateFormData({ [type]: updatedList });
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(e.target.value);
  };

  // Handle keypress (add on Enter)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, type: keyof FeaturesFormData, value: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem(type, value);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-8">
        <div className="border-b border-gray-100 pb-5">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Homestay Features</h3>
          <p className="mt-1 text-sm text-gray-500">
            Highlight what makes your homestay special
          </p>
        </div>
        
        {/* Local Attractions */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-700">Local Attractions</h4>
            <span className="text-xs text-gray-500">
              {formData.localAttractions.length} item(s)
            </span>
          </div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={newAttraction}
              onChange={(e) => handleInputChange(e, setNewAttraction)}
              onKeyPress={(e) => handleKeyPress(e, "localAttractions", newAttraction)}
              placeholder="Add a local attraction..."
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
            />
            <button
              type="button"
              onClick={() => addItem("localAttractions", newAttraction)}
              className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              disabled={!newAttraction.trim()}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.localAttractions.map((attraction, index) => (
              <div
                key={`${attraction}-${index}`}
                className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center"
              >
                <Tag className="h-3 w-3 mr-1 text-gray-500" />
                <span>{attraction}</span>
                <button
                  type="button"
                  onClick={() => removeItem("localAttractions", index)}
                  className="ml-2 text-gray-500 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Tourism Services */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-700">Tourism Services</h4>
            <span className="text-xs text-gray-500">
              {formData.tourismServices.length} item(s)
            </span>
          </div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={newService}
              onChange={(e) => handleInputChange(e, setNewService)}
              onKeyPress={(e) => handleKeyPress(e, "tourismServices", newService)}
              placeholder="Add a tourism service..."
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
            />
            <button
              type="button"
              onClick={() => addItem("tourismServices", newService)}
              className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              disabled={!newService.trim()}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tourismServices.map((service, index) => (
              <div
                key={`${service}-${index}`}
                className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center"
              >
                <Tag className="h-3 w-3 mr-1 text-gray-500" />
                <span>{service}</span>
                <button
                  type="button"
                  onClick={() => removeItem("tourismServices", index)}
                  className="ml-2 text-gray-500 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Infrastructure */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-700">Infrastructure</h4>
            <span className="text-xs text-gray-500">
              {formData.infrastructure.length} item(s)
            </span>
          </div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={newInfrastructure}
              onChange={(e) => handleInputChange(e, setNewInfrastructure)}
              onKeyPress={(e) => handleKeyPress(e, "infrastructure", newInfrastructure)}
              placeholder="Add infrastructure..."
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
            />
            <button
              type="button"
              onClick={() => addItem("infrastructure", newInfrastructure)}
              className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              disabled={!newInfrastructure.trim()}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.infrastructure.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center"
              >
                <Tag className="h-3 w-3 mr-1 text-gray-500" />
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => removeItem("infrastructure", index)}
                  className="ml-2 text-gray-500 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Read-only view
  return (
    <div className="space-y-8">
      <div className="border-b border-gray-100 pb-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Homestay Features</h3>
        <p className="mt-1 text-sm text-gray-500">
          Special features of your homestay
        </p>
      </div>
      
      {/* Local Attractions */}
      {formData.localAttractions.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-700">Local Attractions</h4>
          <div className="flex flex-wrap gap-2">
            {formData.localAttractions.map((attraction, index) => (
              <div
                key={`${attraction}-${index}`}
                className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center"
              >
                <Tag className="h-3 w-3 mr-1 text-gray-500" />
                <span>{attraction}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Tourism Services */}
      {formData.tourismServices.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-700">Tourism Services</h4>
          <div className="flex flex-wrap gap-2">
            {formData.tourismServices.map((service, index) => (
              <div
                key={`${service}-${index}`}
                className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center"
              >
                <Tag className="h-3 w-3 mr-1 text-gray-500" />
                <span>{service}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Infrastructure */}
      {formData.infrastructure.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-700">Infrastructure</h4>
          <div className="flex flex-wrap gap-2">
            {formData.infrastructure.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center"
              >
                <Tag className="h-3 w-3 mr-1 text-gray-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturesSection; 