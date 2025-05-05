import React from "react";

interface GeneralInfoProps {
  formData: {
    homeStayName: string;
    villageName: string;
    homeCount: number;
    roomCount: number;
    bedCount: number;
    homeStayType: string;
    directions?: string;
  };
  updateFormData: (data: any) => void;
  isEditing: boolean;
}

const GeneralInfoSection: React.FC<GeneralInfoProps> = ({
  formData,
  updateFormData,
  isEditing
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number = value;
    
    // Convert number inputs to numbers
    if (type === 'number') {
      processedValue = parseInt(value, 10) || 0;
    }
    
    updateFormData({ [name]: processedValue });
  };

  // Render form or readonly view based on isEditing prop
  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-100 pb-5">
          <h3 className="text-lg font-medium leading-6 text-gray-900">General Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Basic information about your homestay
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="homeStayName" className="block text-sm font-medium text-gray-700">
              Homestay Name *
            </label>
            <input
              type="text"
              name="homeStayName"
              id="homeStayName"
              value={formData.homeStayName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="villageName" className="block text-sm font-medium text-gray-700">
              Village Name *
            </label>
            <input
              type="text"
              name="villageName"
              id="villageName"
              value={formData.villageName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="homeStayType" className="block text-sm font-medium text-gray-700">
              Homestay Type *
            </label>
            <select
              name="homeStayType"
              id="homeStayType"
              value={formData.homeStayType}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
            >
              <option value="community">Community Homestay</option>
              <option value="private">Private Homestay</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="homeCount" className="block text-sm font-medium text-gray-700">
              Number of Homes *
            </label>
            <input
              type="number"
              name="homeCount"
              id="homeCount"
              min="1"
              value={formData.homeCount}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="roomCount" className="block text-sm font-medium text-gray-700">
              Number of Rooms *
            </label>
            <input
              type="number"
              name="roomCount"
              id="roomCount"
              min="1"
              value={formData.roomCount}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="bedCount" className="block text-sm font-medium text-gray-700">
              Number of Beds *
            </label>
            <input
              type="number"
              name="bedCount"
              id="bedCount"
              min="1"
              value={formData.bedCount}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="directions" className="block text-sm font-medium text-gray-700">
            Directions to Homestay
          </label>
          <textarea
            name="directions"
            id="directions"
            rows={4}
            value={formData.directions || ""}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
            placeholder="Provide detailed directions to reach your homestay..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Include landmarks, bus stops, or other helpful information for guests to find your homestay.
          </p>
        </div>
      </div>
    );
  }
  
  // Read-only view
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">General Information</h3>
        <p className="mt-1 text-sm text-gray-500">
          Basic information about your homestay
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Homestay Name</h4>
          <p className="mt-1 text-base">{formData.homeStayName}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Village Name</h4>
          <p className="mt-1 text-base">{formData.villageName}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Homestay Type</h4>
          <p className="mt-1 text-base">
            {formData.homeStayType === 'community' ? 'Community Homestay' : 'Private Homestay'}
          </p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Number of Homes</h4>
          <p className="mt-1 text-base">{formData.homeCount}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Number of Rooms</h4>
          <p className="mt-1 text-base">{formData.roomCount}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Number of Beds</h4>
          <p className="mt-1 text-base">{formData.bedCount}</p>
        </div>
      </div>
      
      {formData.directions && (
        <div>
          <h4 className="text-sm font-medium text-gray-500">Directions to Homestay</h4>
          <p className="mt-1 text-base whitespace-pre-wrap">{formData.directions}</p>
        </div>
      )}
    </div>
  );
};

export default GeneralInfoSection; 