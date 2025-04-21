'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, Filter, X, Menu, MapPin } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';

// Add province translations for filter labels
const provinceTranslations: Record<string, string> = {
  "कोशी": "Koshi",
  "मधेश": "Madhesh",
  "वागमती": "Bagmati",
  "गण्डकी": "Gandaki",
  "लुम्बिनी": "Lumbini",
  "कर्णाली": "Karnali",
  "सुदुर पश्चिम": "Sudurpashchim"
};

interface Contact {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
}

interface Address {
  formattedAddress: {
    en: string;
    ne: string;
  };
  province: {
    en: string;
    ne: string;
  };
  district: {
    en: string;
    ne: string;
  };
  municipality: {
    en: string;
    ne: string;
  };
}

interface Homestay {
  _id: string;
  homestayId: string;
  homeStayName: string;
  homeStayType: 'community' | 'private';
  dhsrNo?: string;
  status: 'pending' | 'approved' | 'rejected';
  contactIds?: string[];
  contacts?: Contact[];
  address?: Address;
  officials?: { role: string; name: string; gender?: string }[];
  operator?: { role: string; name: string; gender?: string };
}

export default function HomestayListingPage() {
  const params = useParams();
  const router = useRouter();
  const adminUsername = params.adminUsername as string;
  
  // State for the sidebar on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [filteredHomestays, setFilteredHomestays] = useState<Homestay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  // Location filter states
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("");
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);

  // Address data state
  const [addressData, setAddressData] = useState<{
    allProvinces: string[];
    provinceDistrictsMap: Record<string, string[]>;
    districtMunicipalitiesMap: Record<string, string[]>;
    districtTranslations: Record<string, string>;
    municipalityTranslations: Record<string, string>;
  }>({
    allProvinces: [],
    provinceDistrictsMap: {},
    districtMunicipalitiesMap: {},
    districtTranslations: {},
    municipalityTranslations: {}
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Load address data for filters
  useEffect(() => {
    const fetchAddressData = async () => {
      try {
        const responses = await Promise.all([
          fetch('/address/all-provinces.json').then(res => res.json()),
          fetch('/address/map-province-districts.json').then(res => res.json()),
          fetch('/address/map-districts-municipalities.json').then(res => res.json()),
          fetch('/address/all-districts.json').then(res => res.json()),
          fetch('/address/all-municipalities.json').then(res => res.json())
        ]);

        setAddressData({
          allProvinces: responses[0] as string[],
          provinceDistrictsMap: responses[1] as Record<string, string[]>,
          districtMunicipalitiesMap: responses[2] as Record<string, string[]>,
          districtTranslations: responses[3] as Record<string, string>,
          municipalityTranslations: responses[4] as Record<string, string>
        });
      } catch (error) {
        console.error("Error loading address data:", error);
      }
    };

    fetchAddressData();
  }, []);

  // Update available districts when province changes
  useEffect(() => {
    if (selectedProvince && addressData.provinceDistrictsMap) {
      const districts = addressData.provinceDistrictsMap[selectedProvince] || [];
      setAvailableDistricts(districts);
      
      // Reset district if it's no longer valid
      if (selectedDistrict && !districts.includes(selectedDistrict)) {
        setSelectedDistrict("");
        setSelectedMunicipality("");
        setAvailableMunicipalities([]);
      }
    } else {
      setAvailableDistricts([]);
      setSelectedDistrict("");
      setSelectedMunicipality("");
      setAvailableMunicipalities([]);
    }
  }, [selectedProvince, addressData.provinceDistrictsMap, selectedDistrict]);
  
  // Update available municipalities when district changes
  useEffect(() => {
    if (selectedDistrict && addressData.districtMunicipalitiesMap) {
      const municipalities = addressData.districtMunicipalitiesMap[selectedDistrict] || [];
      setAvailableMunicipalities(municipalities);
      
      // Reset municipality if it's no longer valid
      if (selectedMunicipality && !municipalities.includes(selectedMunicipality)) {
        setSelectedMunicipality("");
      }
    } else {
      setAvailableMunicipalities([]);
      setSelectedMunicipality("");
    }
  }, [selectedDistrict, addressData.districtMunicipalitiesMap, selectedMunicipality]);

  // Fetch homestays with contacts
  useEffect(() => {
    const fetchHomestays = async () => {
      try {
        setLoading(true);
        // Fetch homestays
        const response = await fetch(`/api/admin/homestays?adminUsername=${adminUsername}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch homestays');
        }
        
        const data = await response.json();
        
        if (!data.success || !data.homestays) {
          throw new Error(data.error || 'Failed to load homestays data');
        }

        // The homestays now include operator and contacts data from the API
        setHomestays(data.homestays);
        setFilteredHomestays(data.homestays);
      } catch (error) {
        console.error('Error fetching homestays:', error);
        setError('Could not load homestays. Please try again later.');
        toast.error('Failed to load homestays');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHomestays();
  }, [adminUsername]);

  // Apply filters and search
  useEffect(() => {
    let results = [...homestays];
    
    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(homestay =>
        homestay.homeStayName?.toLowerCase().includes(query) ||
        homestay.homestayId?.toLowerCase().includes(query) ||
        (homestay.dhsrNo && homestay.dhsrNo.toLowerCase().includes(query)) ||
        (homestay.contacts && homestay.contacts.some(contact => 
          contact.name?.toLowerCase().includes(query) || 
          contact.mobile?.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query)
        ))
      );
    }
    
    // Apply status filter
    if (selectedStatus) {
      results = results.filter(homestay => homestay.status === selectedStatus);
    }
    
    // Apply type filter
    if (selectedType) {
      results = results.filter(homestay => homestay.homeStayType === selectedType);
    }
    
    // Apply province filter
    if (selectedProvince) {
      results = results.filter(homestay => {
        const province = homestay.address?.province;
        if (!province) return false;
        
        // Check both English and Nepali names
        return (
          province.ne?.trim() === selectedProvince.trim() ||
          provinceTranslations[province.ne]?.trim() === selectedProvince.trim()
        );
      });
    }
    
    // Apply district filter
    if (selectedDistrict) {
      results = results.filter(homestay => {
        const district = homestay.address?.district;
        if (!district) return false;
        
        // Check both English and Nepali names
        return (
          district.ne?.trim() === selectedDistrict.trim() ||
          addressData.districtTranslations[district.ne]?.trim() === selectedDistrict.trim()
        );
      });
    }
    
    // Apply municipality filter
    if (selectedMunicipality) {
      results = results.filter(homestay => {
        const municipality = homestay.address?.municipality;
        if (!municipality) return false;
        
        // Check both English and Nepali names
        return (
          municipality.ne?.trim() === selectedMunicipality.trim() ||
          addressData.municipalityTranslations[municipality.ne]?.trim() === selectedMunicipality.trim()
        );
      });
    }
    
    setFilteredHomestays(results);
  }, [homestays, searchQuery, selectedStatus, selectedType, selectedProvince, selectedDistrict, selectedMunicipality, addressData]);

  // Handle row click to navigate to homestay details
  const handleRowClick = (homestayId: string) => {
    router.push(`/admin/${adminUsername}/homestays/${homestayId}`);
  };

  // Function to get status badge color
  const getStatusColor = (status: Homestay['status']): string => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': 
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("");
    setSelectedType("");
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedMunicipality("");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile menu button */}
      <button 
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Admin Sidebar */}
      <aside 
        className={`fixed md:static top-0 left-0 h-full z-40 w-64 flex-shrink-0 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <AdminSidebar username={adminUsername} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Homestay Listing</h1>
          
          {/* Search and filters */}
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search bar */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, ID, DHSR, or contact info..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              
              {/* Filter button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Filter size={18} className="text-gray-500" />
                <span>Filters</span>
              </button>
            </div>
            
            {/* Filter options */}
            {showFilters && (
              <div className="p-4 border-t border-gray-100 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Status and Type Filters (side-by-side) */}
                  <div className="md:col-span-1 grid grid-cols-2 gap-4">
                    {/* Status filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                      >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    
                    {/* Homestay Type filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                      >
                        <option value="">All Types</option>
                        <option value="community">Community</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Location filters (grouped together) */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Province filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Province</label>
                      <select
                        value={selectedProvince}
                        onChange={(e) => setSelectedProvince(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                      >
                        <option value="">All Provinces</option>
                        {addressData.allProvinces.map((province, index) => (
                          <option key={index} value={province}>
                            {provinceTranslations[province] || province}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* District filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                        disabled={!selectedProvince}
                      >
                        <option value="">All Districts</option>
                        {availableDistricts.map((district, index) => (
                          <option key={index} value={district}>
                            {addressData.districtTranslations[district] || district}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Municipality filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Municipality</label>
                      <select
                        value={selectedMunicipality}
                        onChange={(e) => setSelectedMunicipality(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                        disabled={!selectedDistrict}
                      >
                        <option value="">All Municipalities</option>
                        {availableMunicipalities.map((municipality, index) => (
                          <option key={index} value={municipality}>
                            {addressData.municipalityTranslations[municipality] || municipality}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Clear filters button */}
                <div className="flex justify-end mt-5">
                  <button 
                    onClick={clearFilters}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center"
                  >
                    <X size={14} className="mr-1" />
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Results count */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {filteredHomestays.length} {filteredHomestays.length === 1 ? 'homestay' : 'homestays'} found
            </p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S.N.
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Home Stay
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID/DHSR
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner Info
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Details
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHomestays.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                          No homestays found
                        </td>
                      </tr>
                    ) : (
                      filteredHomestays.map((homestay, index) => {
                        const operator = homestay.operator || homestay.officials?.find(official => official.role === 'operator');
                        const contact = homestay.contacts && homestay.contacts.length > 0 ? homestay.contacts[0] : null;
                        
                        return (
                          <tr 
                            key={homestay._id} 
                            onClick={() => handleRowClick(homestay.homestayId)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{homestay.homeStayName}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{homestay.homestayId}</div>
                              {homestay.dhsrNo && (
                                <div className="text-xs text-gray-500">DHSR: {homestay.dhsrNo}</div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {operator ? (
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{operator.name}</div>
                                  <div className="text-xs text-gray-500 capitalize">{operator.gender || 'N/A'}</div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">No operator info</span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {contact ? (
                                <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                              ) : (
                                <span className="text-xs text-gray-500">No contact info</span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {contact ? (
                                <div>
                                  <div className="text-xs text-gray-500">{contact.mobile}</div>
                                  {contact.email && (
                                    <div className="text-xs text-gray-500 truncate max-w-xs">{contact.email}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">No contact details</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {homestay.address ? (
                                <div className="flex items-start">
                                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
                                  <div>
                                    <div className="text-sm text-gray-900">
                                      {homestay.address.municipality?.ne || ''}, {homestay.address.district?.ne || ''}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {homestay.address.province?.ne || ''}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">No address info</span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 capitalize">{homestay.homeStayType}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize border ${getStatusColor(homestay.status)}`}>
                                {homestay.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 