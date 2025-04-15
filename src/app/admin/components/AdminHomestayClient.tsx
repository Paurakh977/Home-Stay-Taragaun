"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, X, MapPin, ArrowRight, Home } from 'lucide-react';
import { toast } from 'sonner';

// Add province translations
const provinceTranslations: Record<string, string> = {
  "कोशी": "Koshi",
  "मधेश": "Madhesh",
  "वागमती": "Bagmati",
  "गण्डकी": "Gandaki",
  "लुम्बिनी": "Lumbini",
  "कर्णाली": "Karnali",
  "सुदुर पश्चिम": "Sudurpashchim"
};

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
  villageName: string;
  ward?: string;
  city?: string;
  tole?: string;
}

interface Homestay {
  _id: string;
  homestayId: string;
  homeStayName: string;
  homeStayType: 'community' | 'private';
  dhsrNo?: string;
  status: 'pending' | 'approved' | 'rejected';
  address?: Address;
  description?: string;
}

interface AdminHomestayClientProps {
  username?: string;
}

// Define permissions type
interface UserPermissions {
  adminDashboardAccess: boolean;
  homestayApproval: boolean;
  homestayEdit: boolean;
  homestayDelete: boolean;
  documentUpload: boolean;
  imageUpload: boolean;
}

export default function AdminHomestayClient({ username: propUsername }: AdminHomestayClientProps) {
  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [filteredHomestays, setFilteredHomestays] = useState<Homestay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  
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
  
  // Location filter states
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("");
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);

  // State to store user permissions
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);

  // Check authentication and fetch user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Client: Starting authentication check");

        // First try to check if there's a superadmin token
        const superadminResponse = await fetch('/api/superadmin/auth/me');
        if (superadminResponse.ok) {
          // User is a superadmin - proceed without further authentication
          console.log('Client: Authenticated as superadmin');
          
          // Superadmins have all permissions
          setUserPermissions({
            adminDashboardAccess: true,
            homestayApproval: true,
            homestayEdit: true,
            homestayDelete: true,
            documentUpload: true,
            imageUpload: true
          });
          
          return;
        }
        
        // Not a superadmin, check for admin authentication
        console.log("Client: Not a superadmin, checking admin authentication");
        const response = await fetch('/api/admin/auth/me');
        
        // Check if response is successful
        if (!response.ok) {
          console.error('Client: Authentication failed with status', response.status);
          toast.error("Authentication failed. Please log in.");
          router.push('/admin/login');
          return;
        }
        
        // Parse user data
        const userData = await response.json();
        console.log("Client: Received user data:", userData);
        
        // Check if user data is valid and user is authenticated
        if (!userData.success || !userData.user) {
          console.error('Client: Invalid user data structure');
          toast.error("Authentication failed. Please log in.");
          router.push('/admin/login');
          return;
        }
        
        // Check if user has admin role
        if (userData.user.role !== 'admin') {
          console.error('Client: User is not an admin, role:', userData.user.role);
          toast.error("You don't have admin privileges.");
          router.push('/admin/login');
          return;
        }

        // Create fallback permissions if missing
        const permissions = userData.user.permissions || {
          adminDashboardAccess: false,
          homestayApproval: false,
          homestayEdit: false,
          homestayDelete: false,
          documentUpload: false,
          imageUpload: false
        };
        
        // Store the permissions for later use
        setUserPermissions(permissions);
        
        console.log("Client: User permissions:", permissions);

        // Check if user has admin dashboard access permission
        if (permissions.adminDashboardAccess !== true) {
          console.error('Client: User lacks dashboard access permission');
          toast.error("You don't have permission to access the admin dashboard");
          
          // Show access denied screen with functional logout button
          document.body.innerHTML = `
            <div class="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
              <div class="rounded-full bg-red-100 p-4 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              </div>
              <h1 class="text-2xl font-bold mb-2">Access Denied</h1>
              <p class="text-gray-600 mb-6">You don't have permission to access this feature.</p>
              <div class="flex gap-4">
                <button id="goBackBtn" class="px-4 py-2 bg-gray-700 text-white rounded-lg">Go Back</button>
                <button id="logoutBtn" class="px-4 py-2 bg-red-600 text-white rounded-lg">Logout</button>
              </div>
            </div>
          `;
          
          // Add event listeners
          setTimeout(() => {
            document.getElementById('goBackBtn')?.addEventListener('click', () => {
              window.location.href = '/admin/login';
            });
            
            document.getElementById('logoutBtn')?.addEventListener('click', () => {
              // Clear the cookie client-side for immediate effect
              document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              window.location.href = '/admin/login';
            });
          }, 100);
          
          return;
        }
        
        console.log('Client: Admin authentication successful with dashboard access');
      } catch (error) {
        console.error('Client: Auth check error:', error);
        toast.error("Authentication check failed. Please try again.");
        router.push('/admin/login');
      }
    };
    
    checkAuth();
  }, [router]);

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

  // Fetch homestays
  useEffect(() => {
    const fetchHomestays = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the username from props
        const queryUsername = propUsername;
        
        let username = null;
        let isSuperadmin = false;
        
        // First check if user is a superadmin
        const superadminResponse = await fetch('/api/superadmin/auth/me');
        if (superadminResponse.ok) {
          // Superadmin access
          isSuperadmin = true;
          username = queryUsername; // Use the username from props
          
          if (!username) {
            throw new Error('Admin username required for superadmin access');
          }
        } else {
          // Regular admin access - get username from auth data
          const authResponse = await fetch('/api/admin/auth/me');
          if (!authResponse.ok) {
            router.push('/admin/login');
            return;
          }
          
          const authData = await authResponse.json();
          username = authData.user?.username;
          
          if (!username) {
            throw new Error('Username not found in auth data');
          }
        }
        
        // Fetch homestays for the specified admin
        const response = await fetch(`/api/admin/homestays?adminUsername=${username}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch homestays: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success) {
          // Use || [] for safety
          const homestayData = data.homestays || []; 
          setHomestays(homestayData as Homestay[]); 
          setFilteredHomestays(homestayData as Homestay[]);
        } else {
          throw new Error(data.error || 'API request failed');
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        // Explicitly set to empty arrays on error
        setHomestays([]); 
        setFilteredHomestays([]); 
      } finally {
        setLoading(false);
      }
    };
    
    fetchHomestays();
  }, [router, propUsername]);
  
  // Apply filters and search
  useEffect(() => {
    let results = [...homestays];
    
    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(homestay =>
        homestay.homeStayName.toLowerCase().includes(query) ||
        homestay.homestayId.toLowerCase().includes(query) ||
        (homestay.dhsrNo && homestay.dhsrNo.toLowerCase().includes(query)) ||
        (homestay.address?.villageName && homestay.address.villageName.toLowerCase().includes(query)) ||
        (homestay.address?.formattedAddress?.en && homestay.address.formattedAddress.en.toLowerCase().includes(query)) ||
        (homestay.address?.formattedAddress?.ne && homestay.address.formattedAddress.ne.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (selectedStatus) {
      results = results.filter(homestay => homestay.status === selectedStatus);
    }
    
    // Apply province filter
    if (selectedProvince) {
      results = results.filter(homestay => {
        const province = homestay.address?.province;
        if (!province) return false;
        
        // Check both English and Nepali names from the province object
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
        
        // Check both English and Nepali names from the district object
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
        
        // Check both English and Nepali names from the municipality object
        return (
          municipality.ne?.trim() === selectedMunicipality.trim() ||
          addressData.municipalityTranslations[municipality.ne]?.trim() === selectedMunicipality.trim()
        );
      });
    }
    
    // Apply homestay type filter
    if (selectedType) {
      results = results.filter(homestay => homestay.homeStayType === selectedType);
    }
    
    setFilteredHomestays(results);
  }, [homestays, searchQuery, selectedStatus, selectedProvince, selectedDistrict, selectedMunicipality, selectedType, addressData]);

  const handleRowClick = (homestayId: string) => {
    if (hasPermission('homestayEdit')) {
      router.push(`/admin/homestays/${homestayId}`);
    } else {
      toast.error("You don't have permission to edit homestay details");
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("");
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedMunicipality("");
    setSelectedType("");
  };

  const getStatusColor = (status: Homestay['status']): string => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Logout function
  const handleLogout = async () => {
    try {
      console.log('Client: Logging out...');
      // Call the logout API endpoint
      const response = await fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('Client: Logout successful');
        toast.success("Logged out successfully");
        
        // Clear the cookie client-side too for immediate effect
        document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        // Redirect to login
        router.push('/admin/login');
      } else {
        console.error('Client: Logout failed');
        toast.error("Logout failed");
      }
    } catch (error) {
      console.error('Client: Logout error:', error);
      toast.error("Error during logout");
    }
  };

  // Check if current user has a specific permission
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    // If we don't know the user's permissions yet, default to false
    if (!userPermissions) return false;
    return userPermissions[permission] === true;
  };

  // Handle edit functionality
  const handleEdit = (homestayId: string) => {
    // Check for edit permission before allowing
    if (!hasPermission('homestayEdit')) {
      toast.error("You don't have permission to edit homestay details");
      return;
    }
    
    router.push(`/admin/homestays/${homestayId}`);
  };
  
  // Handle delete functionality
  const handleDelete = async (homestayId: string) => {
    // Check for delete permission before allowing
    if (!hasPermission('homestayDelete')) {
      toast.error("You don't have permission to delete homestays");
      return;
    }
    
    // Delete logic would go here
    toast.success("Delete functionality would be implemented here");
  };
  
  // Handle document upload
  const handleDocumentUpload = (homestayId: string) => {
    // Check for document upload permission before allowing
    if (!hasPermission('documentUpload')) {
      toast.error("You don't have permission to upload documents");
      return;
    }
    
    // Document upload logic would go here
    toast.success("Document upload functionality would be implemented here");
  };
  
  // Handle image upload
  const handleImageUpload = (homestayId: string) => {
    // Check for image upload permission before allowing
    if (!hasPermission('imageUpload')) {
      toast.error("You don't have permission to upload images");
      return;
    }
    
    // Image upload logic would go here
    toast.success("Image upload functionality would be implemented here");
  };

  // Render action buttons with permission checks
  const renderActionButtons = (homestay: Homestay) => (
    <div className="flex space-x-2">
      {hasPermission('homestayEdit') && (
        <button 
          onClick={() => handleEdit(homestay.homestayId)}
          className="p-1 text-blue-600 hover:text-blue-800"
          title="Edit homestay"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      
      {hasPermission('homestayDelete') && (
        <button 
          onClick={() => handleDelete(homestay.homestayId)}
          className="p-1 text-red-600 hover:text-red-800"
          title="Delete homestay"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
      
      {hasPermission('documentUpload') && (
        <button 
          onClick={() => handleDocumentUpload(homestay.homestayId)}
          className="p-1 text-green-600 hover:text-green-800"
          title="Upload documents"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      )}
      
      {hasPermission('imageUpload') && (
        <button 
          onClick={() => handleImageUpload(homestay.homestayId)}
          className="p-1 text-purple-600 hover:text-purple-800"
          title="Upload images"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Homestay Management</h1>
            <p className="mt-2 text-sm text-gray-600">Review and manage your homestay registrations</p>
          </div>
          
          {/* Logout button */}
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
        
        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-4 border-b border-gray-100">
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
                placeholder="Search by name, ID, or DHSR number..."
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
        </div>
        
        {/* Filter options */}
        {showFilters && (
          <div className="p-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Status and Type Filters (side-by-side) */}
              <div className="md:col-span-1 grid grid-cols-2 gap-6">
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
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                      {provinceTranslations[province] || province} / {province}
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
                      {addressData.districtTranslations[district] || district} / {district}
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
              
              {/* Clear filters button (aligned to the bottom right area conceptually) */}
              <div className="md:col-span-3 flex justify-start md:justify-end items-end mt-4 md:mt-0">
                <button 
                  onClick={clearFilters}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center"
                >
                  <X size={14} className="mr-1" />
                  Clear All
                </button>
              </div>
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
        
      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading homestays...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 rounded-xl shadow-sm p-4 text-red-700">
          Error: {error}
        </div>
      )}
      
      {/* Homestay list */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHomestays.map((homestay) => (
            <div 
              key={homestay._id} 
              onClick={() => handleRowClick(homestay.homestayId)} 
              className="relative bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
            >
              {/* Status badge */}
              <div className="absolute top-3 right-3 z-10">
                <span className={`inline-flex text-xs px-2 py-1 rounded-full ${getStatusColor(homestay.status)}`}>
                  {homestay.status.charAt(0).toUpperCase() + homestay.status.slice(1)}
                </span>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                  {homestay.homeStayName}
                </h3>
                
                <div className="flex items-start gap-1 text-gray-500 mb-2">
                  <MapPin size={16} className="mt-0.5 min-w-4 text-gray-400" />
                  <span className="text-sm">{homestay.address?.formattedAddress?.en || 'N/A'}</span>
                </div>
                
                {/* DHSR Number */}
                {homestay.dhsrNo && (
                  <div className="mb-3">
                    <span className="inline-flex items-center text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-mono">
                      DHSR: {homestay.dhsrNo}
                    </span>
                  </div>
                )}
                
                {/* Type badge */}
                <div className="mb-3">
                  <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${
                    homestay.homeStayType === 'community' 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    {homestay.homeStayType === 'community' ? 'Community' : 'Private'} Homestay
                  </span>
                </div>
                
                {/* Action buttons with permission checks */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                  {/* View button - always visible, doesn't need permission */}
                  <div className="flex items-center text-sm text-primary">
                    <span>View Details</span>
                    <ArrowRight size={16} className="ml-1 transform transition-transform group-hover:translate-x-1" />
                  </div>
                  
                  {/* Action buttons based on permissions */}
                  <div onClick={(e) => { e.stopPropagation(); /* Prevent card click */ }}>
                    {renderActionButtons(homestay)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* No results */}
      {!loading && !error && filteredHomestays.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No homestays found</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            We couldn't find any homestays matching your search criteria. Try adjusting your filters or search query.
          </p>
          <button 
            onClick={clearFilters}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Clear All Filters
          </button>
        </div>
      )}
      </div>
    </div>
  );
} 