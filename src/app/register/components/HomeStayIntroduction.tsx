import React from "react";

interface HomeStayIntroductionData {
  homeStayName: string;
  villageName: string;
  homeCount: number;
  roomCount: number;
  bedCount: number;
  homeStayType: string;
}

type HomeStayIntroductionProps = {
  formData: HomeStayIntroductionData;
  updateFormData: (data: Partial<HomeStayIntroductionData>) => void;
};

const HomeStayIntroduction: React.FC<HomeStayIntroductionProps> = ({ formData, updateFormData }) => {
  // Create a range array for dropdown options
  const createRange = (start: number, end: number) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: name.includes("Count") ? parseInt(value) : value });
  };

  // Initialize default values for form data if undefined
  React.useEffect(() => {
    const defaultValues: Partial<HomeStayIntroductionData> = {};
    let needsUpdate = false;

    if (formData.homeStayName === undefined) {
      defaultValues.homeStayName = '';
      needsUpdate = true;
    }
    
    if (formData.villageName === undefined) {
      defaultValues.villageName = '';
      needsUpdate = true;
    }
    
    if (formData.homeStayType === undefined) {
      defaultValues.homeStayType = '';
      needsUpdate = true;
    }
    
    if (formData.homeCount === undefined) {
      defaultValues.homeCount = 1;
      needsUpdate = true;
    }
    
    if (formData.roomCount === undefined) {
      defaultValues.roomCount = 1;
      needsUpdate = true;
    }
    
    if (formData.bedCount === undefined) {
      defaultValues.bedCount = 1;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      updateFormData(defaultValues);
    }
  }, [formData, updateFormData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Home Stay name */}
        <div>
          <label htmlFor="homeStayName" className="block text-sm font-medium text-gray-700 mb-1">
            Home Stay name/होमस्टेको नाम
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="homeStayName"
            name="homeStayName"
            value={formData.homeStayName || ''}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 bg-white border ${
              !formData.homeStayName ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
            required
          />
          {!formData.homeStayName && 
            <p className="mt-1 text-xs text-red-500">This field is required</p>
          }
        </div>

        {/* Homestay Type */}
        <div>
          <label htmlFor="homeStayType" className="block text-sm font-medium text-gray-700 mb-1">
            Homestay Type/होमस्टेको प्रकार
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="community"
                name="homeStayType"
                value="community"
                checked={formData.homeStayType === "community"}
                onChange={handleChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                required
              />
              <label htmlFor="community" className="ml-2 block text-sm text-gray-700">
                Community Based home stay/समुदायिक होमस्टे
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="private"
                name="homeStayType"
                value="private"
                checked={formData.homeStayType === "private"}
                onChange={handleChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <label htmlFor="private" className="ml-2 block text-sm text-gray-700">
                Private homestay/निजी होमस्टे
              </label>
            </div>
          </div>
          {!formData.homeStayType && 
            <p className="mt-1 text-xs text-red-500">Please select a homestay type</p>
          }
        </div>

        {/* Village Name */}
        <div>
          <label htmlFor="villageName" className="block text-sm font-medium text-gray-700 mb-1">
            Home stays&apos; Village Name/होमस्टे गाउँको नाम
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            id="villageName"
            name="villageName"
            value={formData.villageName || ''}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 bg-white border ${
              !formData.villageName ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
            required
          />
          {!formData.villageName && 
            <p className="mt-1 text-xs text-red-500">This field is required</p>
          }
        </div>

        {/* Number dropdowns */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Number of Homes */}
            <div className="w-full flex flex-col">
              <label htmlFor="homeCount" className="block text-sm font-medium text-gray-700 mb-1 h-14 md:h-10 flex items-end">
                Number of Homes/होमस्टे सञ्चालित घर संख्या
              </label>
              <div className="relative mt-auto">
                <select
                  id="homeCount"
                  name="homeCount"
                  value={formData.homeCount || 1}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  required
                >
                  {createRange(1, 50).map((num) => (
                    <option key={`home-${num}`} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Room count */}
            <div className="w-full flex flex-col">
              <label htmlFor="roomCount" className="block text-sm font-medium text-gray-700 mb-1 h-14 md:h-10 flex items-end">
                Room count/कोठा संख्या
              </label>
              <div className="relative mt-auto">
                <select
                  id="roomCount"
                  name="roomCount"
                  value={formData.roomCount || 1}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  required
                >
                  {createRange(1, 100).map((num) => (
                    <option key={`room-${num}`} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Bed count */}
            <div className="w-full flex flex-col">
              <label htmlFor="bedCount" className="block text-sm font-medium text-gray-700 mb-1 h-14 md:h-10 flex items-end">
                Bed count/बेड संख्या
              </label>
              <div className="relative mt-auto">
                <select
                  id="bedCount"
                  name="bedCount"
                  value={formData.bedCount || 1}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  required
                >
                  {createRange(1, 200).map((num) => (
                    <option key={`bed-${num}`} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Share details about your homestay&apos;s introduction. This information helps guests understand what your homestay offers.
      </p>
    </div>
  );
};

export default HomeStayIntroduction; 