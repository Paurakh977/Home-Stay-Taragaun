import React from "react";

const WayToHomeStay: React.FC = () => {
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
            Written Directions (Optional)/लिखित निर्देशन (वैकल्पिक)
          </label>
          <textarea
            id="directions"
            name="directions"
            rows={4}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="Provide written directions to your homestay..."
          />
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Provide information about how to reach your homestay. Include available transportation and key landmarks that will help guests find your location.
        </p>
      </div>
    </div>
  );
};

export default WayToHomeStay; 