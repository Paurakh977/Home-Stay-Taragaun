import React from "react";

interface WayToHomeStayData {
  directions?: string;
}

type WayToHomeStayProps = {
  formData: WayToHomeStayData;
  updateFormData: (data: Partial<WayToHomeStayData>) => void;
};

const WayToHomeStay: React.FC<WayToHomeStayProps> = ({ formData, updateFormData }) => {
  // Handle text direction changes
  const handleDirectionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateFormData({ directions: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-700 mb-4">
          This section will allow you to specify directions to your homestay using a map. 
          Currently in development.
        </p>
        
        {/* Placeholder for Google Maps integration */}
        <div className="w-full h-[400px] bg-gray-100 border border-gray-300 rounded-md flex items-center justify-center">
          <div className="text-center p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Map Integration Coming Soon</h3>
            <p className="text-gray-600">
              You&apos;ll be able to select your location on a map and provide directions to your homestay.
            </p>
          </div>
        </div>
        
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
          Provide information about how to reach your homestay. Include available transportation and key landmarks that will help guests find your location. This field is optional and can be filled in later.
        </p>
      </div>
    </div>
  );
};

export default WayToHomeStay; 