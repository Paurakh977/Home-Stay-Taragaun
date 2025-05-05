"use client";

import React from "react";

interface HomestayDetailsData {
  homestayName: string;
  roomCount: string;
  bedCount: string;
  pricePerNight: string;
}

type HomestayDetailsFormProps = {
  formData: HomestayDetailsData;
  updateFormData: (data: Partial<HomestayDetailsData>) => void;
};

const HomestayDetailsForm: React.FC<HomestayDetailsFormProps> = ({ formData, updateFormData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="homestayName" className="block text-sm font-medium text-gray-700 mb-1">
          Homestay Name / होमस्टेको नाम
        </label>
        <input
          type="text"
          id="homestayName"
          name="homestayName"
          value={formData.homestayName}
          onChange={handleChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="roomCount" className="block text-sm font-medium text-gray-700 mb-1">
            Number of Rooms / कोठाहरूको संख्या
          </label>
          <input
            type="number"
            id="roomCount"
            name="roomCount"
            value={formData.roomCount}
            onChange={handleChange}
            min="1"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            required
          />
        </div>

        <div>
          <label htmlFor="bedCount" className="block text-sm font-medium text-gray-700 mb-1">
            Number of Beds / बेडहरूको संख्या
          </label>
          <input
            type="number"
            id="bedCount"
            name="bedCount"
            value={formData.bedCount}
            onChange={handleChange}
            min="1"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="pricePerNight" className="block text-sm font-medium text-gray-700 mb-1">
          Price Per Night (NPR) / प्रति रात मूल्य (रु.)
        </label>
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
            Rs.
          </span>
          <input
            type="number"
            id="pricePerNight"
            name="pricePerNight"
            value={formData.pricePerNight}
            onChange={handleChange}
            min="0"
            className="block w-full flex-1 px-3 py-2 border border-gray-300 rounded-none rounded-r-md focus:outline-none focus:ring-primary focus:border-primary"
            required
          />
        </div>
      </div>
    </div>
  );
};

export default HomestayDetailsForm; 