"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
// Replace static imports with dynamic fetching
// import allProvinces from "../../../../address/all-provinces.json";
// import provinceDistrictsMap from "../../../../address/map-province-districts.json";
// import districtMunicipalitiesMap from "../../../../address/map-districts-municipalities.json";
// import municipalitiesWardsMap from "../../../../address/map-municipalities-wards.json";

// English translation of provinces
const provinceTranslations: Record<string, string> = {
  "कोशी": "Koshi",
  "मधेश": "Madhesh",
  "वागमती": "Bagmati",
  "गण्डकी": "Gandaki",
  "लुम्बिनी": "Lumbini",
  "कर्णाली": "Karnali",
  "सुदुर पश्चिम": "Sudurpashchim"
};

interface AddressFormData {
  province: string;
  district: string;
  municipality: string;
  ward: string;
}

type AddressDetailsProps = {
  formData: AddressFormData;
  updateFormData: (data: Partial<AddressFormData>) => void;
};

const AddressDetails: React.FC<AddressDetailsProps> = ({ formData, updateFormData }) => {
  // Local state for data and translations
  const [addressData, setAddressData] = useState<{
    allProvinces: string[];
    provinceDistrictsMap: Record<string, string[]>;
    districtMunicipalitiesMap: Record<string, string[]>;
    municipalitiesWardsMap: Record<string, string[]>;
    districtTranslations: Record<string, string>;
    municipalityTranslations: Record<string, string>;
  }>({
    allProvinces: [],
    provinceDistrictsMap: {},
    districtMunicipalitiesMap: {},
    municipalitiesWardsMap: {},
    districtTranslations: {},
    municipalityTranslations: {}
  });
  const [isLoading, setIsLoading] = useState(true);

  // Available options based on selections
  const [districts, setDistricts] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [wards, setWards] = useState<string[]>([]);
  
  // Refs to track previous values
  const prevProvinceRef = useRef(formData.province);
  const prevDistrictRef = useRef(formData.district);
  const prevMunicipalityRef = useRef(formData.municipality);
  const isUpdatingRef = useRef(false);

  // Load all address data from public directory
  useEffect(() => {
    const fetchAddressData = async () => {
      try {
        setIsLoading(true);
        // Fetch all the required JSON files
        const [provinces, provinceDistricts, districtMunicipalities, municipalitiesWards, districtTranslations, municipalityTranslations] = await Promise.all([
          fetch('/address/all-provinces.json').then(res => res.json()),
          fetch('/address/map-province-districts.json').then(res => res.json()),
          fetch('/address/map-districts-municipalities.json').then(res => res.json()),
          fetch('/address/map-municipalities-wards.json').then(res => res.json()),
          fetch('/address/all-districts.json').then(res => res.json()),
          fetch('/address/all-municipalities.json').then(res => res.json())
        ]);

        setAddressData({
          allProvinces: provinces,
          provinceDistrictsMap: provinceDistricts,
          districtMunicipalitiesMap: districtMunicipalities,
          municipalitiesWardsMap: municipalitiesWards,
          districtTranslations: districtTranslations,
          municipalityTranslations: municipalityTranslations
        });
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading address data:", error);
        setIsLoading(false);
      }
    };

    fetchAddressData();
  }, []);

  // Add debugging useEffect
  useEffect(() => {
    console.log("AddressDetails rendered with:", {
      province: formData.province,
      district: formData.district,
      municipality: formData.municipality,
      ward: formData.ward
    });
  }, [formData.province, formData.district, formData.municipality, formData.ward]);

  // Update districts when province changes
  useEffect(() => {
    if (isLoading || !addressData.provinceDistrictsMap || isUpdatingRef.current) return;

    if (formData.province) {
      const selectedDistricts = addressData.provinceDistrictsMap[formData.province] || [];
      setDistricts(selectedDistricts);
      
      // Only reset if province changed and district is no longer valid
      if (prevProvinceRef.current !== formData.province && 
          formData.district && 
          !selectedDistricts.includes(formData.district)) {
        isUpdatingRef.current = true;
        const resetData = {
          district: "",
          municipality: "",
          ward: ""
        };
        updateFormData(resetData);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
      
      prevProvinceRef.current = formData.province;
    } else {
      setDistricts([]);
    }
  }, [formData.province, formData.district, isLoading, addressData.provinceDistrictsMap]);

  // Add additional debugging for municipalities
  useEffect(() => {
    if (formData.district && addressData.districtMunicipalitiesMap && addressData.municipalityTranslations) {
      console.log("District selected:", formData.district);
      const districtMunicipalities = addressData.districtMunicipalitiesMap[formData.district] || [];
      console.log("Municipalities for district:", districtMunicipalities.length);
      
      // Check for missing translations
      const missingTranslations = districtMunicipalities.filter(
        municipality => !addressData.municipalityTranslations[municipality.trim()]
      );
      
      if (missingTranslations.length > 0) {
        console.log("Municipalities missing translations:", missingTranslations);
      }
    }
  }, [formData.district, addressData.districtMunicipalitiesMap, addressData.municipalityTranslations]);

  // Update municipalities when district changes
  useEffect(() => {
    if (isLoading || !addressData.districtMunicipalitiesMap || isUpdatingRef.current) return;

    if (formData.district) {
      const selectedMunicipalities = addressData.districtMunicipalitiesMap[formData.district] || [];
      setMunicipalities(selectedMunicipalities);
      
      // Only reset if district changed and municipality is no longer valid
      if (prevDistrictRef.current !== formData.district && 
          formData.municipality && 
          !selectedMunicipalities.includes(formData.municipality)) {
        isUpdatingRef.current = true;
        const resetData = {
          municipality: "",
          ward: ""
        };
        updateFormData(resetData);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
      
      prevDistrictRef.current = formData.district;
    } else {
      setMunicipalities([]);
    }
  }, [formData.district, formData.municipality, isLoading, addressData.districtMunicipalitiesMap]);

  // Update wards when municipality changes
  useEffect(() => {
    if (isLoading || !addressData.municipalitiesWardsMap || isUpdatingRef.current) return;

    if (formData.municipality) {
      const selectedWards = addressData.municipalitiesWardsMap[formData.municipality] || [];
      setWards(selectedWards);
      
      // Only reset if municipality changed and ward is no longer valid
      if (prevMunicipalityRef.current !== formData.municipality && 
          formData.ward && 
          !selectedWards.includes(formData.ward)) {
        isUpdatingRef.current = true;
        const resetData = {
          ward: ""
        };
        updateFormData(resetData);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
      
      prevMunicipalityRef.current = formData.municipality;
    } else {
      setWards([]);
    }
  }, [formData.municipality, formData.ward, isLoading, addressData.municipalitiesWardsMap]);

  // Handle dropdown changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  }, [updateFormData]);

  // Convert numeric wards to English
  const translateWard = (ward: string): string => {
    const wardMap: Record<string, string> = {
      '१': '1', '२': '2', '३': '3', '४': '4', '५': '5',
      '६': '6', '७': '7', '८': '8', '९': '9', '०': '0'
    };
    
    let englishWard = '';
    for (let i = 0; i < ward.length; i++) {
      const char = ward[i];
      englishWard += wardMap[char] || char;
    }
    
    return englishWard;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-3 text-gray-700">Loading address data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Province Dropdown */}
        <div>
          <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
            Province/प्रदेश
          </label>
          <div className="relative">
            <select
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              required
            >
              <option value="">Select Province / प्रदेश छनोट गर्नुहोस्</option>
              {addressData.allProvinces.map((province) => (
                <option key={province} value={province}>
                  {provinceTranslations[province] || province} / {province}
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

        {/* District Dropdown */}
        <div>
          <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
            District/जिल्ला
          </label>
          <div className="relative">
            <select
              id="district"
              name="district"
              value={formData.district}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              required
              disabled={!formData.province}
            >
              <option value="">Select District / जिल्ला छनोट गर्नुहोस्</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {addressData.districtTranslations[district] || district} / {district}
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

        {/* Municipality Dropdown */}
        <div>
          <label htmlFor="municipality" className="block text-sm font-medium text-gray-700 mb-1">
            Municipality/नगरपालिका
          </label>
          <div className="relative">
            <select
              id="municipality"
              name="municipality"
              value={formData.municipality}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              required
              disabled={!formData.district}
            >
              <option value="">Select Municipality / नगरपालिका छनोट गर्नुहोस्</option>
              {municipalities.map((municipality) => {
                // Trim municipality name to handle whitespace issues
                const trimmedMunicipality = municipality.trim();
                return (
                  <option key={municipality} value={municipality}>
                    {addressData.municipalityTranslations[trimmedMunicipality] || trimmedMunicipality} / {municipality}
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Ward Dropdown */}
        <div>
          <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">
            Ward/वडा
          </label>
          <div className="relative">
            <select
              id="ward"
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              required
              disabled={!formData.municipality}
            >
              <option value="">Select Ward / वडा छनोट गर्नुहोस्</option>
              {wards.map((ward) => (
                <option key={ward} value={ward}>
                  {translateWard(ward)} / {ward}
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
  );
};

export default AddressDetails; 