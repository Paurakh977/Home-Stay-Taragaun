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
  adminUsername?: string;
}

interface AdminHomestayClientProps {
  username?: string;
  noSidebar?: boolean;
  isOfficer?: boolean;
  officerData?: {
    username: string;
    parentAdmin: string;
    permissions: Record<string, boolean>;
  } | null;
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

export default function AdminHomestayClient({ 
  username: propUsername,
  noSidebar = true,
  isOfficer = false,
  officerData = null
}: AdminHomestayClientProps) {
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

        // If we're already authenticated as an officer, use their permissions
        if (isOfficer && officerData) {
          console.log('Client: Using officer authentication data');
          
          // Create a properly structured UserPermissions object from the Record<string, boolean>
          const mappedPermissions: UserPermissions = {
            adminDashboardAccess: !!officerData.permissions.adminDashboardAccess,
            homestayApproval: !!officerData.permissions.homestayApproval,
            homestayEdit: !!officerData.permissions.homestayEdit,
            homestayDelete: !!officerData.permissions.homestayDelete,
            documentUpload: !!officerData.permissions.documentUpload,
            imageUpload: !!officerData.permissions.imageUpload
          };
          
          setUserPermissions(mappedPermissions);
          return;
        }

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

  // Load homestays data
  useEffect(() => {
    const fetchHomestays = async () => {
      if (!userPermissions) return; // Wait for permissions to be set
      
      setLoading(true);
      setError(null);
      
      try {
        // Determine which API endpoint to use based on whether we're using officer auth
        const apiEndpoint = isOfficer
          ? '/api/officer/homestays'
          : '/api/admin/homestays';
          
        // Get the username to filter homestays by - either from props or from officer data
        const username = propUsername || (isOfficer && officerData ? officerData.parentAdmin : undefined);
        
        if (!username) {
          setError("Missing admin username");
          setLoading(false);
          return;
        }
          
        const url = `${apiEndpoint}?adminUsername=${encodeURIComponent(username)}`;
        console.log(`Client: Fetching homestays from ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch homestays. Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch homestays");
        }
        
        // Process the homestays data
        const fetchedHomestays = data.homestays || [];
        setHomestays(fetchedHomestays);
        setFilteredHomestays(fetchedHomestays);
        
        console.log(`Client: Loaded ${fetchedHomestays.length} homestays`);
      } catch (err) {
        console.error("Client: Error fetching homestays:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };
    
    if (userPermissions) {
      fetchHomestays();
    }
  }, [propUsername, userPermissions, isOfficer, officerData]);

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

  // Handle row click to navigate to homestay detail
  const handleRowClick = (homestayId: string) => {
    // If we're operating as an officer, use the officer routes
    if (isOfficer && officerData?.parentAdmin) {
      const adminUsername = officerData.parentAdmin;
      // Use the direct route for officer homestay details
      router.push(`/officer/${adminUsername}/homestays/${homestayId}`);
      return;
    }
    
    // Otherwise use standard admin routes
    // Determine if we should use the admin username route
    const getCurrentAdmin = async () => {
      try {
        if (propUsername) {
          router.push(`/admin/${propUsername}/homestays/${homestayId}`);
          return;
        }
        
        const response = await fetch('/api/admin/auth/me');
        if (response.ok) {
          const data = await response.json();
          const username = data.user?.username;
          
          if (username) {
            router.push(`/admin/${username}/homestays/${homestayId}`);
          } else {
            router.push(`/admin/homestays/${homestayId}`);
          }
        } else {
          router.push(`/admin/homestays/${homestayId}`);
        }
      } catch (error) {
        console.error('Error getting current admin:', error);
        router.push(`/admin/homestays/${homestayId}`);
      }
    };
    
    getCurrentAdmin();
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
  
  // Handle logout for both admin and officer
  const handleLogout = async () => {
    try {
      const endpoint = isOfficer ? '/api/officer/auth/logout' : '/api/admin/auth/logout';
      
      // Try the server-side logout first
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          toast.success('Logged out successfully');
        } else {
          console.warn(`Server-side logout (${endpoint}) returned error:`, response.status);
          // Continue with client-side fallback
        }
      } catch (fetchError) {
        console.warn(`Server-side logout (${endpoint}) failed, using client-side fallback:`, fetchError);
        // Continue with client-side fallback
      }
      
      // Client-side fallback - clear cookies directly
      document.cookie = "officer_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      if (isOfficer) {
        // Redirect to officer login
        router.push('/officer/login');
      } else {
        // Redirect to admin login
        router.push('/admin/login');
      }
      
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
      
      // Last resort fallback - just redirect to login
      setTimeout(() => {
        window.location.href = isOfficer ? '/officer/login' : '/admin/login';
      }, 1000);
    }
  };

  // Check user permissions
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    // If operating as an officer, use officer permissions
    if (isOfficer && officerData) {
      return !!officerData.permissions[permission];
    }
    
    // Otherwise use admin permissions
    return userPermissions ? !!userPermissions[permission] : false;
  };

  // Handle edit functionality
  const handleEdit = (homestayId: string) => {
    // If we have the username from props, use it directly (for superadmin access)
    if (propUsername) {
      router.push(`/admin/${propUsername}/homestays/${homestayId}`);
      console.log(`Navigating to /admin/${propUsername}/homestays/${homestayId}`);
      return;
    }
    
    // Otherwise check permissions and get from current user session
    if (!hasPermission('homestayEdit')) {
      toast.error("You don't have permission to edit homestay details");
      return;
    }
    
    // Get the current admin username from auth
    const getCurrentAdmin = async () => {
      try {
        const response = await fetch('/api/admin/auth/me');
        if (!response.ok) {
          toast.error("Authentication failed");
          return;
        }
        
        const data = await response.json();
        if (data.success && data.user) {
          const currentAdminUsername = data.user.username;
          
          // Route to the admin-specific URL that includes the admin username
          router.push(`/admin/${currentAdminUsername}/homestays/${homestayId}`);
        } else {
          toast.error("Failed to retrieve admin details");
        }
      } catch (error) {
        console.error("Error checking admin permissions:", error);
        toast.error("Failed to verify permissions");
      }
    };
    
    getCurrentAdmin();
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

  // Only render the main content area, no sidebar or layout
  return (
    <div className="p-6 max-w-full overflow-x-auto flex-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Homestay Management</h1>
        
        {/* Logout button only shown on mobile */}
        <button
          onClick={handleLogout}
          className="md:hidden flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
        >
          <span className="font-medium">Logout</span>
        </button>
      </div>
        
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
  );
} 