import React, { useState, useEffect, useRef } from "react";

interface LocationFormData {
  province: string;
  district: string;
  municipality: string;
  ward: string;
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
}

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
    municipalitiesWardsMap: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Available options based on current selections
  const [districts, setDistricts] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [wards, setWards] = useState<string[]>([]);

  // Refs to track previous values and prevent cascading resets during loading
  const prevProvinceRef = useRef(formData.province);
  const prevDistrictRef = useRef(formData.district);
  const prevMunicipalityRef = useRef(formData.municipality);
  const isUpdatingRef = useRef(false);

  // Load address data
  useEffect(() => {
    const fetchAddressData = async () => {
      try {
        setIsLoading(true);
        // Fetch all required address data
        const [provinces, provinceDistricts, districtMunicipalities, municipalitiesWards] = await Promise.all([
          fetch('/address/all-provinces.json').then(res => res.json()),
          fetch('/address/map-province-districts.json').then(res => res.json()),
          fetch('/address/map-districts-municipalities.json').then(res => res.json()),
          fetch('/address/map-municipalities-wards.json').then(res => res.json())
        ]);

        setAddressData({
          allProvinces: provinces,
          provinceDistrictsMap: provinceDistricts,
          districtMunicipalitiesMap: districtMunicipalities,
          municipalitiesWardsMap: municipalitiesWards
        });
      } catch (error) {
        console.error("Error loading address data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddressData();
  }, []);

  // Update districts when province changes
  useEffect(() => {
    if (isLoading || !addressData.provinceDistrictsMap || isUpdatingRef.current) return;

    if (formData.province) {
      const availableDistricts = addressData.provinceDistrictsMap[formData.province] || [];
      setDistricts(availableDistricts);
      
      // Reset dependent fields if province changes
      if (prevProvinceRef.current !== formData.province && 
          (!formData.district || !availableDistricts.includes(formData.district))) {
        isUpdatingRef.current = true;
        updateFormData({
          district: "",
          municipality: "",
          ward: ""
        });
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
      
      prevProvinceRef.current = formData.province;
    }
  }, [formData.province, isLoading, addressData.provinceDistrictsMap, updateFormData]);

  // Update municipalities when district changes
  useEffect(() => {
    if (isLoading || !addressData.districtMunicipalitiesMap || isUpdatingRef.current) return;

    if (formData.district) {
      const availableMunicipalities = addressData.districtMunicipalitiesMap[formData.district] || [];
      setMunicipalities(availableMunicipalities);
      
      // Reset dependent fields if district changes
      if (prevDistrictRef.current !== formData.district && 
          (!formData.municipality || !availableMunicipalities.includes(formData.municipality))) {
        isUpdatingRef.current = true;
        updateFormData({
          municipality: "",
          ward: ""
        });
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
      
      prevDistrictRef.current = formData.district;
    }
  }, [formData.district, isLoading, addressData.districtMunicipalitiesMap, updateFormData]);

  // Update wards when municipality changes
  useEffect(() => {
    if (isLoading || !addressData.municipalitiesWardsMap || isUpdatingRef.current) return;

    if (formData.municipality) {
      const availableWards = addressData.municipalitiesWardsMap[formData.municipality] || [];
      setWards(availableWards);
      
      // Reset ward if municipality changes
      if (prevMunicipalityRef.current !== formData.municipality && 
          (!formData.ward || !availableWards.includes(formData.ward))) {
        isUpdatingRef.current = true;
        updateFormData({
          ward: ""
        });
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
      
      prevMunicipalityRef.current = formData.municipality;
    }
  }, [formData.municipality, isLoading, addressData.municipalitiesWardsMap, updateFormData]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
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
              Province *
            </label>
            <select
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              required
              disabled={isLoading}
            >
              <option value="">Select Province</option>
              {addressData.allProvinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>
          
          {/* District */}
          <div className="space-y-2">
            <label htmlFor="district" className="block text-sm font-medium text-gray-700">
              District *
            </label>
            <select
              id="district"
              name="district"
              value={formData.district}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              required
              disabled={isLoading || !formData.province}
            >
              <option value="">Select District</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>
          
          {/* Municipality */}
          <div className="space-y-2">
            <label htmlFor="municipality" className="block text-sm font-medium text-gray-700">
              Municipality *
            </label>
            <select
              id="municipality"
              name="municipality"
              value={formData.municipality}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              required
              disabled={isLoading || !formData.district}
            >
              <option value="">Select Municipality</option>
              {municipalities.map((municipality) => (
                <option key={municipality} value={municipality}>
                  {municipality}
                </option>
              ))}
            </select>
          </div>
          
          {/* Ward */}
          <div className="space-y-2">
            <label htmlFor="ward" className="block text-sm font-medium text-gray-700">
              Ward *
            </label>
            <select
              id="ward"
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              required
              disabled={isLoading || !formData.municipality}
            >
              <option value="">Select Ward</option>
              {wards.map((ward) => (
                <option key={ward} value={ward}>
                  {ward}
                </option>
              ))}
            </select>
          </div>
          
          {/* City */}
          <div className="space-y-2">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              required
            />
          </div>
          
          {/* Tole */}
          <div className="space-y-2">
            <label htmlFor="tole" className="block text-sm font-medium text-gray-700">
              Tole *
            </label>
            <input
              type="text"
              id="tole"
              name="tole"
              value={formData.tole}
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
          {formData.tole}, {formData.city}, {formData.ward} {formData.municipality}, {formData.district}, {formData.province}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Province</h4>
          <p className="mt-1 text-base">{formData.province}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">District</h4>
          <p className="mt-1 text-base">{formData.district}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Municipality</h4>
          <p className="mt-1 text-base">{formData.municipality}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Ward</h4>
          <p className="mt-1 text-base">{formData.ward}</p>
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