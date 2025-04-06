import React, { useState, useEffect, useRef } from "react";

// Define bilingual field structure to match database schema
interface BilingualField {
  en: string;
  ne: string;
}

interface LocationFormData {
  province: BilingualField;
  district: BilingualField;
  municipality: BilingualField;
  ward: BilingualField;
  city: string;
  tole: string;
}

interface LocationSectionProps {
  formData: LocationFormData;
  updateFormData: (data: Partial<LocationFormData>) => void;
  isEditing: boolean;
}

interface AddressData {
  allProvinces: string[];
  provinceDistrictsMap: Record<string, string[]>;
  districtMunicipalitiesMap: Record<string, string[]>;
  municipalitiesWardsMap: Record<string, string[]>;
  districtTranslations: Record<string, string>;
  municipalityTranslations: Record<string, string>;
}

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

const LocationSection: React.FC<LocationSectionProps> = ({
  formData,
  updateFormData,
  isEditing
}) => {
  // State for loaded address data
  const [addressData, setAddressData] = useState<AddressData>({
    allProvinces: [],
    provinceDistrictsMap: {},
    districtMunicipalitiesMap: {},
    municipalitiesWardsMap: {},
    districtTranslations: {},
    municipalityTranslations: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Available options based on current selections
  const [districts, setDistricts] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [wards, setWards] = useState<string[]>([]);

  // Refs to track previous values and prevent cascading resets during loading
  const prevProvinceRef = useRef(formData.province?.ne);
  const prevDistrictRef = useRef(formData.district?.ne);
  const prevMunicipalityRef = useRef(formData.municipality?.ne);
  const isUpdatingRef = useRef(false);

  // Load address data
  useEffect(() => {
    const fetchAddressData = async () => {
      try {
        setIsLoading(true);
        // Fetch all required address data
        const [provinces, provinceDistricts, districtMunicipalities, municipalitiesWards, 
               districtTranslations, municipalityTranslations] = await Promise.all([
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
      } catch (error) {
        console.error("Error loading address data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddressData();
  }, []);

  // Helper function to get best translation match for municipalities
  const findBestTranslationMatch = (municipality: string, translations: Record<string, string>): string => {
    // Clean and normalize the municipality name
    const cleanMunicipality = municipality.trim().replace(/\s+/g, ' ');
    
    // First try direct lookup
    if (translations[cleanMunicipality]) {
      return translations[cleanMunicipality];
    } 
    // Then try with a space
    else if (translations[cleanMunicipality + ' ']) {
      return translations[cleanMunicipality + ' '];
    }
    // Then try to find it in a different way - searching for a partial match
    else {
      // Look for keys that contain this municipality or vice versa
      const possibleKey = Object.keys(translations)
        .find(key => key.includes(cleanMunicipality) || cleanMunicipality.includes(key));
      
      if (possibleKey) {
        return translations[possibleKey];
      }
      
      // If all else fails, return the original name
      return cleanMunicipality;
    }
  };

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

  // Update districts when province changes
  useEffect(() => {
    if (isLoading || !addressData.provinceDistrictsMap || isUpdatingRef.current) return;

    if (formData.province?.ne) {
      const availableDistricts = addressData.provinceDistrictsMap[formData.province.ne] || [];
      setDistricts(availableDistricts);
      
      // Reset dependent fields if province changes
      if (prevProvinceRef.current !== formData.province.ne && 
          (!formData.district?.ne || !availableDistricts.includes(formData.district.ne))) {
        isUpdatingRef.current = true;
        updateFormData({
          district: { en: "", ne: "" },
          municipality: { en: "", ne: "" },
          ward: { en: "", ne: "" }
        });
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
      
      prevProvinceRef.current = formData.province.ne;
    }
  }, [formData.province?.ne, isLoading, addressData.provinceDistrictsMap, updateFormData]);

  // Update municipalities when district changes
  useEffect(() => {
    if (isLoading || !addressData.districtMunicipalitiesMap || isUpdatingRef.current) return;

    if (formData.district?.ne) {
      const availableMunicipalities = addressData.districtMunicipalitiesMap[formData.district.ne] || [];
      setMunicipalities(availableMunicipalities);
      
      // Reset dependent fields if district changes
      if (prevDistrictRef.current !== formData.district.ne && 
          (!formData.municipality?.ne || !availableMunicipalities.includes(formData.municipality.ne))) {
        isUpdatingRef.current = true;
        updateFormData({
          municipality: { en: "", ne: "" },
          ward: { en: "", ne: "" }
        });
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
      
      prevDistrictRef.current = formData.district.ne;
    }
  }, [formData.district?.ne, isLoading, addressData.districtMunicipalitiesMap, updateFormData]);

  // Update wards when municipality changes
  useEffect(() => {
    if (isLoading || !addressData.municipalitiesWardsMap || isUpdatingRef.current) return;

    if (formData.municipality?.ne) {
      const availableWards = addressData.municipalitiesWardsMap[formData.municipality.ne] || [];
      setWards(availableWards);
      
      // Reset ward if municipality changes
      if (prevMunicipalityRef.current !== formData.municipality.ne && 
          (!formData.ward?.ne || !availableWards.includes(formData.ward.ne))) {
        isUpdatingRef.current = true;
        updateFormData({
          ward: { en: "", ne: "" }
        });
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
      
      prevMunicipalityRef.current = formData.municipality.ne;
    }
  }, [formData.municipality?.ne, isLoading, addressData.municipalitiesWardsMap, updateFormData]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle bilingual fields differently from simple string fields
    if (name === 'province' && value) {
      updateFormData({ 
        province: { 
          ne: value, 
          en: provinceTranslations[value] || value 
        } 
      });
    } 
    else if (name === 'district' && value) {
      updateFormData({ 
        district: { 
          ne: value, 
          en: addressData.districtTranslations[value] || value 
        } 
      });
    }
    else if (name === 'municipality' && value) {
      updateFormData({ 
        municipality: { 
          ne: value, 
          en: findBestTranslationMatch(value, addressData.municipalityTranslations) || value 
        } 
      });
    }
    else if (name === 'ward' && value) {
      updateFormData({ 
        ward: { 
          ne: value, 
          en: translateWard(value) 
        } 
      });
    }
    else {
      // For non-bilingual fields (city, tole)
      updateFormData({ [name]: value });
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-100 pb-5">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Location Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Address and location details of your homestay
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Province */}
          <div className="space-y-2">
            <label htmlFor="province" className="block text-sm font-medium text-gray-700">
              Province/प्रदेश *
            </label>
            <select
              id="province"
              name="province"
              value={formData.province?.ne || ""}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              required
              disabled={isLoading}
            >
              <option value="">Select Province / प्रदेश छनोट गर्नुहोस्</option>
              {addressData.allProvinces.map((province) => (
                <option key={province} value={province}>
                  {provinceTranslations[province] || province} / {province}
                </option>
              ))}
            </select>
          </div>
          
          {/* District */}
          <div className="space-y-2">
            <label htmlFor="district" className="block text-sm font-medium text-gray-700">
              District/जिल्ला *
            </label>
            <select
              id="district"
              name="district"
              value={formData.district?.ne || ""}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              required
              disabled={isLoading || !formData.province?.ne}
            >
              <option value="">Select District / जिल्ला छनोट गर्नुहोस्</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {addressData.districtTranslations[district] || district} / {district}
                </option>
              ))}
            </select>
          </div>
          
          {/* Municipality */}
          <div className="space-y-2">
            <label htmlFor="municipality" className="block text-sm font-medium text-gray-700">
              Municipality/नगरपालिका *
            </label>
            <select
              id="municipality"
              name="municipality"
              value={formData.municipality?.ne || ""}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              required
              disabled={isLoading || !formData.district?.ne}
            >
              <option value="">Select Municipality / नगरपालिका छनोट गर्नुहोस्</option>
              {municipalities.map((municipality) => {
                // Get the best English translation match
                const englishName = findBestTranslationMatch(municipality, addressData.municipalityTranslations);
                return (
                  <option key={municipality} value={municipality}>
                    {englishName} / {municipality}
                  </option>
                );
              })}
            </select>
          </div>
          
          {/* Ward */}
          <div className="space-y-2">
            <label htmlFor="ward" className="block text-sm font-medium text-gray-700">
              Ward/वडा *
            </label>
            <select
              id="ward"
              name="ward"
              value={formData.ward?.ne || ""}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              required
              disabled={isLoading || !formData.municipality?.ne}
            >
              <option value="">Select Ward / वडा छनोट गर्नुहोस्</option>
              {wards.map((ward) => (
                <option key={ward} value={ward}>
                  {translateWard(ward)} / {ward}
                </option>
              ))}
            </select>
          </div>
          
          {/* City */}
          <div className="space-y-2">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City/शहर *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city || ""}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              required
            />
          </div>
          
          {/* Tole */}
          <div className="space-y-2">
            <label htmlFor="tole" className="block text-sm font-medium text-gray-700">
              Tole/टोल *
            </label>
            <input
              type="text"
              id="tole"
              name="tole"
              value={formData.tole || ""}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              required
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Read-only view
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Location Information</h3>
        <p className="mt-1 text-sm text-gray-500">
          Address and location details of your homestay
        </p>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Complete Address</h4>
        <p className="text-base">
          {formData.tole}, {formData.city}, {formData.ward?.en} {formData.municipality?.en}, {formData.district?.en}, {formData.province?.en}
        </p>
        <p className="text-base mt-1 text-gray-600">
          {formData.tole}, {formData.city}, {formData.ward?.ne} {formData.municipality?.ne}, {formData.district?.ne}, {formData.province?.ne}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Province</h4>
          <p className="mt-1 text-base">{formData.province?.en}</p>
          <p className="text-sm text-gray-600">{formData.province?.ne}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">District</h4>
          <p className="mt-1 text-base">{formData.district?.en}</p>
          <p className="text-sm text-gray-600">{formData.district?.ne}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Municipality</h4>
          <p className="mt-1 text-base">{formData.municipality?.en}</p>
          <p className="text-sm text-gray-600">{formData.municipality?.ne}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Ward</h4>
          <p className="mt-1 text-base">{formData.ward?.en}</p>
          <p className="text-sm text-gray-600">{formData.ward?.ne}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">City</h4>
          <p className="mt-1 text-base">{formData.city}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Tole</h4>
          <p className="mt-1 text-base">{formData.tole}</p>
        </div>
      </div>
    </div>
  );
};

export default LocationSection; 