"use client";

import React from "react";

interface PersonalDetailsData {
  fullName: string;
  gender: string;
  citizenship: string;
}

type PersonalDetailsFormProps = {
  formData: PersonalDetailsData;
  updateFormData: (data: Partial<PersonalDetailsData>) => void;
};

const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({ formData, updateFormData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name / पूरा नाम
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          required
        />
      </div>

      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
          Gender / लिङ्ग
        </label>
        <select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          required
        >
          <option value="">Select Gender / लिङ्ग छनोट गर्नुहोस्</option>
          <option value="male">Male / पुरुष</option>
          <option value="female">Female / महिला</option>
          <option value="other">Other / अन्य</option>
        </select>
      </div>

      <div>
        <label htmlFor="citizenship" className="block text-sm font-medium text-gray-700 mb-1">
          Citizenship Number / नागरिकता नम्बर
        </label>
        <input
          type="text"
          id="citizenship"
          name="citizenship"
          value={formData.citizenship}
          onChange={handleChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          required
        />
      </div>
    </div>
  );
};

export default PersonalDetailsForm; 