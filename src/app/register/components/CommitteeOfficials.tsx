import React from "react";
import { FormButton } from "@/components/ui/form-button";
import { Plus, Trash2 } from "lucide-react";

interface Official {
  name: string;
  role: string;
  contactNo: string;
}

interface CommitteeData {
  officials: Official[];
}

type CommitteeOfficialsProps = {
  formData: CommitteeData;
  updateFormData: (data: Partial<CommitteeData>) => void;
};

const CommitteeOfficials: React.FC<CommitteeOfficialsProps> = ({ formData, updateFormData }) => {
  // Validate Nepali phone number (country code +977 followed by 10 digits)
  const isValidPhoneNumber = (phoneNumber: string): boolean => {
    // Allow +977 followed by 10 digits
    const phoneRegex = /^\+977\d{10}$/;
    return phoneRegex.test(phoneNumber);
  };

  // Handle input changes
  const handleOfficialChange = (index: number, field: string, value: string) => {
    const updatedOfficials = [...formData.officials];
    updatedOfficials[index] = {
      ...updatedOfficials[index],
      [field]: value,
    };
    updateFormData({ officials: updatedOfficials });
  };

  // Format phone number input
  const formatPhoneNumber = (value: string): string => {
    // Keep the +977 prefix
    if (!value.startsWith('+977')) {
      return '+977';
    }
    
    // Remove any non-digit characters after +977
    const digits = value.replace(/\+977/, '').replace(/\D/g, '');
    
    // Limit to 10 digits after +977
    return `+977${digits.substring(0, 10)}`;
  };

  // Handle phone number input with formatting
  const handlePhoneChange = (index: number, value: string) => {
    const formattedValue = formatPhoneNumber(value);
    handleOfficialChange(index, "contactNo", formattedValue);
  };

  // Add a new official
  const addOfficial = () => {
    updateFormData({
      officials: [...formData.officials, { name: "", role: "", contactNo: "+977" }],
    });
  };

  // Remove an official
  const removeOfficial = (index: number) => {
    if (formData.officials.length > 1) {
      const updatedOfficials = formData.officials.filter((_, i) => i !== index);
      updateFormData({ officials: updatedOfficials });
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <p className="text-gray-700">
          Please provide information about the committee officials responsible for managing the homestay.
          <span className="text-red-500 ml-1">*</span>
        </p>
        <p className="text-sm text-gray-600 mt-1">
          At least one official with complete information is required.
        </p>
      </div>

      {formData.officials.map((official, index) => (
        <div key={index} className="border border-gray-200 rounded-md p-5 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium text-gray-900">
              Official #{index + 1}
              {index === 0 && <span className="text-red-500 ml-1">*</span>}
            </h3>
            
            {formData.officials.length > 1 && (
              <button
                type="button"
                onClick={() => removeOfficial(index)}
                className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Name */}
            <div>
              <label htmlFor={`name-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Name of the official/पदाधिकारीको नाम
                {index === 0 && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                id={`name-${index}`}
                value={official.name}
                onChange={(e) => handleOfficialChange(index, "name", e.target.value)}
                className={`mt-1 block w-full px-3 py-2 bg-white border ${
                  index === 0 && !official.name ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                required={index === 0}
              />
              {index === 0 && !official.name && 
                <p className="mt-1 text-xs text-red-500">This field is required</p>
              }
            </div>

            {/* Role */}
            <div>
              <label htmlFor={`role-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Role/पद
                {index === 0 && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                id={`role-${index}`}
                value={official.role}
                onChange={(e) => handleOfficialChange(index, "role", e.target.value)}
                className={`mt-1 block w-full px-3 py-2 bg-white border ${
                  index === 0 && !official.role ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                required={index === 0}
              />
              {index === 0 && !official.role && 
                <p className="mt-1 text-xs text-red-500">This field is required</p>
              }
            </div>

            {/* Contact Number */}
            <div>
              <label htmlFor={`contactNo-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Contact No/सम्पर्क नं.
                {index === 0 && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="tel"
                id={`contactNo-${index}`}
                value={official.contactNo}
                onChange={(e) => handlePhoneChange(index, e.target.value)}
                className={`mt-1 block w-full px-3 py-2 bg-white border ${
                  (index === 0 && !official.contactNo) || 
                  (official.contactNo && official.contactNo !== "+977" && !isValidPhoneNumber(official.contactNo))
                    ? 'border-red-300' 
                    : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                placeholder="+977"
                required={index === 0}
              />
              {index === 0 && !official.contactNo && 
                <p className="mt-1 text-xs text-red-500">This field is required</p>
              }
              {official.contactNo && official.contactNo !== "+977" && !isValidPhoneNumber(official.contactNo) && 
                <p className="mt-1 text-xs text-red-500">Please enter a valid Nepali phone number (+977 followed by 10 digits)</p>
              }
              <p className="mt-1 text-xs text-gray-500">Format: +977 followed by 10 digits (e.g. +9779812345678)</p>
            </div>
          </div>
        </div>
      ))}

      <div>
        <FormButton
          type="button"
          variant="secondary"
          onClick={addOfficial}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Another Official
        </FormButton>
      </div>
    </div>
  );
};

export default CommitteeOfficials; 