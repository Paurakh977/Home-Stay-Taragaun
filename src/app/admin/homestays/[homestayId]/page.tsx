"use client";

import { useState, useEffect, useCallback, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
// Remove the import from '@/types/homestay' if HomestayData is defined below
// import { HomestayData } from '@/types/homestay'; 
import { CheckCircle, XCircle, ArrowLeft, FileText, Loader2, ExternalLink, MapPin, Phone, User, Mail, Building, Globe, Image as ImageIcon, File as FileIcon, List, Edit, Plus } from 'lucide-react';

// --- Comprehensive Type Definition (Move to types/homestay.ts if preferred) ---

interface FormattedAddress {
  en: string;
  ne: string;
}

interface AddressName {
  en: string;
  ne: string;
}

interface LocationData {
  _id?: string;
  homestayId: string;
  address: {
    province?: AddressName; // Optional based on data availability
    district?: AddressName;
    municipality?: AddressName;
    ward?: AddressName; // Ward is also an object {en, ne}
    city?: string;
    tole?: string;
    formattedAddress?: FormattedAddress;
  };
  // coordinates and mapLink are NOT in the joined location object based on JSON
}

interface OfficialData {
  _id?: string;
  homestayId: string;
  name?: string;       // Changed from fullName
  role?: string;       // Changed from position
  contactNo?: string; // Changed from contactNumber
}

interface ContactData {
  _id?: string;
  homestayId: string;
  name?: string;       // Changed from fullName
  mobile?: string;     // Changed from phone
  email?: string;
  website?: string;    // Keep website if needed
  socialMedia?: {      // Keep socialMedia if needed
    facebook?: string;
    instagram?: string;
  };
}

interface DocumentFile {
  originalName: string;
  filePath: string;
  size: number;
  mimeType?: string;
}

interface DocumentInfo {
  title: string;
  description?: string;
  files: DocumentFile[];
}

interface FeaturesData {
  localAttractions?: string[];
  tourismServices?: string[];
  infrastructure?: string[];
}

// Combined HomestayData type reflecting API response AND top-level fields
export interface HomestayData {
  _id: string;
  homestayId: string;
  homeStayName: string;
  homeStayType: 'community' | 'private';
  dhsrNo?: string;
  status: 'pending' | 'approved' | 'rejected';
  description?: string;
  
  villageName?: string; // Top-level village name
  ownerName?: string;   // Top-level owner name (fallback)
  ownerContact?: string;// Top-level owner contact (fallback)
  phone?: string;       // Top-level phone (fallback)
  
  homeCount?: number;
  roomCount?: number;
  bedCount?: number;
  
  profileImage?: string; 
  galleryImages?: string[];
  
  address: { // Top-level address object is primary source for location parts
    province?: AddressName;
    district?: AddressName;
    municipality?: AddressName;
    ward?: AddressName;
    city?: string;
    tole?: string;
    formattedAddress?: FormattedAddress;
  };
  
  features?: FeaturesData; 
  documents?: DocumentInfo[]; 
  
  // Data from joined collections (used less now)
  location?: LocationData; // Joined location data (may have less info)
  officials?: OfficialData[]; // Array of officials with updated fields
  contacts?: ContactData[]; // Array of contacts with updated fields
}

// --- Component Code ---

interface PageProps {
  params: Promise<{ homestayId: string }>; 
}

// Helper component for displaying info sections
const InfoSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
    <div className="p-4 border-b flex items-center space-x-2">
      <Icon className="h-5 w-5 text-gray-500" />
      <h2 className="font-medium text-gray-900">{title}</h2>
    </div>
    <div className="p-4 text-sm">
      {children}
    </div>
  </div>
);

// Helper for key-value pairs
const InfoItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode }> = ({ label, value, children }) => {
  if (!value && !children) return null;
  // Render N/A explicitly if value is null/undefined/empty string AFTER checks
  const displayValue = (value === null || value === undefined || value === '') ? 'N/A' : value;
  const displayChildren = children ?? displayValue;
  if (displayChildren === 'N/A' && !children) return null; // Optionally hide row if value is truly N/A

  return (
    <div className="grid grid-cols-3 gap-2 py-1.5">
      <div className="text-gray-500 font-medium">{label}</div>
      <div className="col-span-2 text-gray-800">{children ? children : displayValue}</div>
    </div>
  );
};

// Editable version of InfoItem
const EditableInfoItem: React.FC<{ 
  label: string; 
  value?: string | number | null; 
  field: string;
  nestedField?: string;
  type?: 'text' | 'number' | 'textarea' | 'select';
  options?: {value: string; label: string}[];
  onChange: (field: string, value: any, nestedField?: string) => void;
  children?: React.ReactNode;
}> = ({ 
  label, 
  value, 
  field, 
  nestedField,
  type = 'text',
  options = [],
  onChange, 
  children 
}) => {
  if (children) {
    return (
      <div className="grid grid-cols-3 gap-2 py-1.5">
        <div className="text-gray-500 font-medium">{label}</div>
        <div className="col-span-2 text-gray-800">{children}</div>
      </div>
    );
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let newValue: string | number = e.target.value;
    
    // Convert to number if type is number
    if (type === 'number' && newValue) {
      newValue = parseInt(newValue, 10);
    }
    
    onChange(field, newValue, nestedField);
  };
  
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5">
      <div className="text-gray-500 font-medium">{label}</div>
      <div className="col-span-2">
        {type === 'textarea' ? (
          <textarea
            value={value === null ? '' : value}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
            rows={3}
          />
        ) : type === 'select' ? (
          <select
            value={value === null ? '' : String(value)}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value === null ? '' : value}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
          />
        )}
      </div>
    </div>
  );
};

export default function AdminHomestayDetailPage({ params: paramsPromise }: PageProps) { 
  const resolvedParams = use(paramsPromise); 
  const { homestayId } = resolvedParams; 
  const router = useRouter();
  const [homestay, setHomestay] = useState<HomestayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<Partial<HomestayData>>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // Location dropdown data
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [provinceDistrictsMap, setProvinceDistrictsMap] = useState<Record<string, string[]>>({});
  const [districtMunicipalitiesMap, setDistrictMunicipalitiesMap] = useState<Record<string, string[]>>({});
  const [locationDataLoaded, setLocationDataLoaded] = useState(false);
  
  // Remove activeDocumentIndex state if using direct links
  // const [activeDocumentIndex, setActiveDocumentIndex] = useState<number | null>(null);

  const fetchHomestayDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/homestays/${homestayId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch details: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success) {
        const fetchedData = data.data as HomestayData;
        console.log("Fetched Homestay Data:", JSON.stringify(fetchedData, null, 2)); 
        
        // Ensure top-level address exists if relying on it primarily
        fetchedData.address = fetchedData.address || {}; 
        fetchedData.officials = fetchedData.officials || [];
        fetchedData.contacts = fetchedData.contacts || [];
        fetchedData.features = fetchedData.features || {};
        fetchedData.documents = fetchedData.documents || [];
        // No need to initialize location if not primarily used

        setHomestay(fetchedData);
      } else {
        throw new Error(data.error || 'API request failed');
      }
    } catch (err) {
      console.error("Fetch details error:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [homestayId]);

  useEffect(() => {
    if (homestayId) {
      fetchHomestayDetails();
    }
  }, [homestayId, fetchHomestayDetails]);

  // Initialize editedData with homestay data when entering edit mode
  useEffect(() => {
    if (isEditing && homestay) {
      setEditedData({
        ...homestay,
        // Explicitly include all nested objects to ensure proper structure
        address: { ...homestay.address },
        contacts: homestay.contacts ? [...homestay.contacts] : [],
        officials: homestay.officials ? [...homestay.officials] : [],
        features: homestay.features ? { ...homestay.features } : {
          localAttractions: [],
          tourismServices: [],
          infrastructure: []
        },
        // We don't want to modify these fields
        homestayId: homestay.homestayId,
        _id: homestay._id,
        dhsrNo: homestay.dhsrNo
      });
    }
  }, [isEditing, homestay]);

  // Fetch location data for dropdowns
  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const responses = await Promise.all([
          fetch('/address/all-provinces.json').then(res => res.json()),
          fetch('/address/map-province-districts.json').then(res => res.json()),
          fetch('/address/map-districts-municipalities.json').then(res => res.json())
        ]);

        setProvinces(responses[0] as string[]);
        setProvinceDistrictsMap(responses[1] as Record<string, string[]>);
        setDistrictMunicipalitiesMap(responses[2] as Record<string, string[]>);
        setLocationDataLoaded(true);
      } catch (error) {
        console.error("Error loading location data:", error);
      }
    };

    fetchLocationData();
  }, []);

  // Update districts when province changes
  useEffect(() => {
    const province = editedData.address?.province?.ne || homestay?.address?.province?.ne;
    if (province && provinceDistrictsMap) {
      const provinceDistricts = provinceDistrictsMap[province] || [];
      setDistricts(provinceDistricts);
      
      // Only clear dependent fields if province in editedData changes
      if (editedData.address?.province?.ne && homestay?.address?.province?.ne !== editedData.address?.province?.ne) {
        setEditedData(prev => ({
          ...prev,
          address: {
            ...(prev.address || {}),
            district: undefined,
            municipality: undefined
          }
        }));
      }
    }
  }, [editedData.address?.province?.ne, provinceDistrictsMap, homestay?.address?.province?.ne]);

  // Update municipalities when district changes
  useEffect(() => {
    const district = editedData.address?.district?.ne || homestay?.address?.district?.ne;
    if (district && districtMunicipalitiesMap) {
      const districtMunicipalities = districtMunicipalitiesMap[district] || [];
      setMunicipalities(districtMunicipalities);
      
      // Only clear municipality if district in editedData changes
      if (editedData.address?.district?.ne && homestay?.address?.district?.ne !== editedData.address?.district?.ne) {
        setEditedData(prev => ({
          ...prev,
          address: {
            ...(prev.address || {}),
            municipality: undefined
          }
        }));
      }
    }
  }, [editedData.address?.district?.ne, districtMunicipalitiesMap, homestay?.address?.district?.ne]);
  
  const handleStatusUpdate = async (newStatus: 'approved' | 'rejected') => {
    setUpdateStatus('loading');
    setUpdateError(null);
    try {
      const response = await fetch(`/api/admin/homestays/${homestayId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to update status: ${response.statusText}`);
      }

      if (data.success) {
        setUpdateStatus('success');
        setHomestay(prev => prev ? { ...prev, status: newStatus } : null);
        setTimeout(() => setUpdateStatus('idle'), 3000);
      } else {
        throw new Error(data.error || 'API update request failed');
      }
    } catch (err) {
      console.error("Update status error:", err);
      setUpdateError(err instanceof Error ? err.message : 'Failed to update status');
      setUpdateStatus('error');
    } 
  };

  const getStatusColor = (status: HomestayData['status']): string => {
      switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  // --- Helper Functions ---
  const getImageUrl = (filePath?: string) => {
    if (!filePath) return '/placeholder.png';
    // Convert /uploads/ path to /api/images/ path
    return filePath.startsWith('/uploads/') 
      ? filePath.replace('/uploads/', '/api/images/')
      : filePath;
  };

  const getDocumentUrl = (filePath?: string) => {
    if (!filePath) return '#';
    // Convert /uploads/ path to /api/documents/ path
    return filePath.startsWith('/uploads/') 
      ? filePath.replace('/uploads/', '/api/documents/')
      : filePath;
  };
  
  // Handle nested field changes for address object
  const handleAddressChange = (field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      address: {
        ...(prev.address || {}),
        [field]: value
      }
    }));
  };

  // Handle basic field changes
  const handleInputChange = (
    field: string, 
    value: string | number | string[] | object,
    nestedField?: string
  ) => {
    setEditedData(prev => {
      if (nestedField) {
        // Handle nested fields (like address.province)
        return {
          ...prev,
          [field]: {
            ...(prev[field as keyof HomestayData] as object || {}),
            [nestedField]: value
          }
        };
      } else {
        // Handle top level fields
        return {
          ...prev,
          [field]: value
        };
      }
    });
  };

  // Contact person editing
  const updateContactField = (field: string, value: string) => {
    setEditedData(prev => {
      // Create a new contacts array if it doesn't exist
      const contacts = [...(prev.contacts || [])];
      
      // Create first contact if it doesn't exist yet
      if (contacts.length === 0) {
        contacts.push({
          homestayId: homestay?._id || '',
          name: homestay?.ownerName || '',
          mobile: homestay?.ownerContact || homestay?.phone || '',
          email: '',
          website: ''
        });
      }
      
      // Update the specific field of the first contact
      contacts[0] = {
        ...contacts[0],
        [field]: value
      };
      
      return {
        ...prev,
        contacts
      };
    });
  };

  // Committee officials management
  const addOfficial = () => {
    const newOfficial = {
      homestayId: homestay?._id || '',
      name: "",
      role: "",
      contactNo: ""
    };
    
    const updatedOfficials = [...(editedData.officials || homestay?.officials || []), newOfficial];
    
    setEditedData(prev => ({
      ...prev,
      officials: updatedOfficials
    }));
  };

  const removeOfficial = (index: number) => {
    const updatedOfficials = [...(editedData.officials || homestay?.officials || [])];
    updatedOfficials.splice(index, 1);
    
    setEditedData(prev => ({
      ...prev,
      officials: updatedOfficials
    }));
  };

  const updateOfficialField = (index: number, field: string, value: string) => {
    const updatedOfficials = [...(editedData.officials || homestay?.officials || [])];
    
    if (updatedOfficials[index]) {
      updatedOfficials[index] = {
        ...updatedOfficials[index],
        [field]: value
      };
      
      setEditedData(prev => ({
        ...prev,
        officials: updatedOfficials
      }));
    }
  };

  // Features management
  const addFeatureItem = (type: keyof FeaturesData, value: string) => {
    if (!value.trim()) return;
    
    // Get current features or initialize
    const currentFeatures = editedData.features || homestay?.features || {
      localAttractions: [],
      tourismServices: [],
      infrastructure: []
    };
    
    // Create a copy of the items array for this feature type
    const currentItems = [...(currentFeatures[type] || [])];
    
    // Add the new item
    const updatedFeatures = {
      ...currentFeatures,
      [type]: [...currentItems, value.trim()]
    };
    
    // Update state
    setEditedData(prev => ({
      ...prev,
      features: updatedFeatures
    }));
  };

  const removeFeatureItem = (type: keyof FeaturesData, index: number) => {
    // Get current features
    const currentFeatures = editedData.features || homestay?.features || {};
    const currentItems = [...(currentFeatures[type] || [])];
    
    // Remove item
    currentItems.splice(index, 1);
    
    // Update features
    const updatedFeatures = {
      ...currentFeatures,
      [type]: currentItems
    };
    
    // Update state
    setEditedData(prev => ({
      ...prev,
      features: updatedFeatures
    }));
  };
  
  // Save changes to the database
  const handleSaveChanges = async () => {
    if (!homestay) return;
    
    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      // Create update payload with only changed fields
      const updateData: any = {};
      
      // Process each edited field
      Object.entries(editedData).forEach(([key, value]) => {
        // Special handling for address object to ensure proper structure
        if (key === 'address') {
          const originalAddress = homestay.address || {};
          const editedAddress = value as any;
          
          // Only include address if something has changed
          if (JSON.stringify(editedAddress) !== JSON.stringify(originalAddress)) {
            updateData.address = editedAddress;
          }
        }
        // Special handling for contacts and officials arrays
        else if (key === 'contacts' || key === 'officials') {
          // For arrays, we need to check if any element has changed
          const originalArray = homestay[key as keyof HomestayData] as any[] || [];
          const editedArray = value as any[];
          
          // Compare arrays by stringifying (not ideal but works for basic comparison)
          if (JSON.stringify(editedArray) !== JSON.stringify(originalArray)) {
            updateData[key] = editedArray;
          }
        }
        // Handle features object with its arrays
        else if (key === 'features') {
          const originalFeatures = homestay.features || {};
          const editedFeatures = value as any;
          
          if (JSON.stringify(editedFeatures) !== JSON.stringify(originalFeatures)) {
            updateData.features = editedFeatures;
          }
        }
        // Handle all other fields
        else if (JSON.stringify(value) !== JSON.stringify(homestay[key as keyof HomestayData])) {
          updateData[key] = value;
        }
      });
      
      // Skip if no changes
      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        setIsSaving(false);
        setSaveMessage('No changes detected');
        setTimeout(() => setSaveMessage(null), 2000);
        return;
      }
      
      console.log('Saving changes:', updateData);
      
      // Save changes via API
      const response = await fetch(`/api/admin/homestays/${homestayId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update homestay');
      }
      
      // Update local state with new data
      setHomestay(data.homestay || {
        ...homestay,
        ...updateData
      });
      setEditedData({});
      setSaveMessage('Changes saved successfully');
      
      // Exit edit mode
      setTimeout(() => {
        setIsEditing(false);
        setSaveMessage(null);
      }, 2000);
      
    } catch (err) {
      console.error("Save error:", err);
      setSaveMessage(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Cancel editing and reset form
  const cancelEditing = () => {
    setIsEditing(false);
    setEditedData({});
  };
  
  // Get current value (either edited or original)
  const getCurrentValue = (field: keyof HomestayData, nestedField?: string): any => {
    if (nestedField && typeof editedData[field] === 'object') {
      // Access nested edited field
      const editedObj = editedData[field] as any;
      if (editedObj && nestedField in editedObj) {
        return editedObj[nestedField];
      }
    } else if (field in editedData) {
      // Access top-level edited field
      return editedData[field];
    }
    
    // Return original value
    if (nestedField && homestay && typeof homestay[field] === 'object') {
      return (homestay[field] as any)?.[nestedField];
    }
    
    return homestay?.[field];
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <button onClick={() => router.back()} className="mb-4 text-sm flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>
        <div className="bg-red-100 border border-red-200 p-4 rounded-lg text-red-700">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!homestay) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <button onClick={() => router.back()} className="mb-4 text-sm flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>
        <div className="bg-gray-100 border border-gray-200 p-4 rounded-lg text-gray-700">
          Homestay not found.
        </div>
      </div>
    );
  }

  // Get primary contact using updated field names
  const primaryApiContact = homestay.contacts?.[0];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 bg-gray-50 min-h-screen">
      {/* Header: Back Button, Title, Status Badge */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-sm flex items-center text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to List
        </button>
        <div>
           <h1 className="text-2xl font-semibold text-gray-800 mr-4">{homestay.homeStayName}</h1>
           <p className="text-sm text-gray-500">ID: {homestay.homestayId}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(homestay.status)}`}>
          Status: {homestay.status.charAt(0).toUpperCase() + homestay.status.slice(1)}
        </span>
      </div>

      {/* Status Update Notifications */}
      {updateStatus === 'success' && (
        <div className="mb-4 bg-green-50 border border-green-200 p-3 rounded-lg text-green-800 flex items-center text-sm">
          <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          Homestay status updated successfully.
        </div>
      )}
      {updateStatus === 'error' && (
        <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-lg text-red-800 flex items-center text-sm">
          <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          {updateError || 'Failed to update status.'}
        </div>
      )}
      
      {/* Editing Status Message */}
      {saveMessage && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center ${
          saveMessage.startsWith('Error') 
            ? 'bg-red-50 border border-red-200 text-red-800' 
            : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          {saveMessage.startsWith('Error') 
            ? <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            : <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />}
          {saveMessage}
        </div>
      )}
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column ( Wider ) */}
        <div className="lg:col-span-2 space-y-6">
        
          {/* Overview Section - Accessing top-level fields */}
          <InfoSection title="Overview" icon={Building}>
             {!isEditing ? (
               <>
                 <InfoItem label="Homestay Name" value={homestay.homeStayName} />
                 <InfoItem label="Homestay ID" value={homestay.homestayId} />
                 <InfoItem label="DHSR No." value={homestay.dhsrNo} />
                 <InfoItem label="Type" value={homestay.homeStayType?.charAt(0).toUpperCase() + homestay.homeStayType?.slice(1)} />
                 <InfoItem label="Description" value={homestay.description} />
                 <InfoItem label="Capacity">
                   {homestay.homeCount || 0} Homes / {homestay.roomCount || 0} Rooms / {homestay.bedCount || 0} Beds
                 </InfoItem>
               </>
             ) : (
               <>
                 <EditableInfoItem 
                   label="Homestay Name" 
                   value={getCurrentValue('homeStayName')} 
                   field="homeStayName"
                   onChange={handleInputChange}
                 />
                 <InfoItem label="Homestay ID" value={homestay.homestayId} />
                 <InfoItem label="DHSR No." value={homestay.dhsrNo} />
                 <EditableInfoItem 
                   label="Type" 
                   value={getCurrentValue('homeStayType')} 
                   field="homeStayType"
                   type="select"
                   options={[
                     {value: 'community', label: 'Community'},
                     {value: 'private', label: 'Private'}
                   ]}
                   onChange={handleInputChange}
                 />
                 <EditableInfoItem 
                   label="Description" 
                   value={getCurrentValue('description')} 
                   field="description"
                   type="textarea"
                   onChange={handleInputChange}
                 />
                 <div className="grid grid-cols-3 gap-2 py-1.5">
                   <div className="text-gray-500 font-medium">Capacity</div>
                   <div className="col-span-2 grid grid-cols-3 gap-2">
                     <div>
                       <label className="text-xs text-gray-500 block mb-1">Homes</label>
                       <input 
                         type="number" 
                         value={getCurrentValue('homeCount') || 0}
                         onChange={(e) => handleInputChange('homeCount', parseInt(e.target.value, 10) || 0)}
                         className="w-full p-2 border border-gray-300 rounded-md text-sm"
                         min="0"
                       />
                     </div>
                     <div>
                       <label className="text-xs text-gray-500 block mb-1">Rooms</label>
                       <input 
                         type="number" 
                         value={getCurrentValue('roomCount') || 0}
                         onChange={(e) => handleInputChange('roomCount', parseInt(e.target.value, 10) || 0)}
                         className="w-full p-2 border border-gray-300 rounded-md text-sm"
                         min="0"
                       />
                     </div>
                     <div>
                       <label className="text-xs text-gray-500 block mb-1">Beds</label>
                       <input 
                         type="number" 
                         value={getCurrentValue('bedCount') || 0}
                         onChange={(e) => handleInputChange('bedCount', parseInt(e.target.value, 10) || 0)}
                         className="w-full p-2 border border-gray-300 rounded-md text-sm"
                         min="0"
                       />
                     </div>
                   </div>
                 </div>
               </>
             )}
          </InfoSection>

          {/* Location Section - Accessing top-level address object and villageName */}
          <InfoSection title="Location Details" icon={MapPin}>
             {!isEditing ? (
               <>
                 <InfoItem label="Province" value={homestay.address?.province?.ne || homestay.address?.province?.en} />
                 <InfoItem label="District" value={homestay.address?.district?.ne || homestay.address?.district?.en} />
                 <InfoItem label="Municipality" value={homestay.address?.municipality?.ne || homestay.address?.municipality?.en} />
                 <InfoItem label="Ward No." value={homestay.address?.ward?.ne || homestay.address?.ward?.en} />
                 <InfoItem label="City" value={homestay.address?.city} />
                 <InfoItem label="Tole" value={homestay.address?.tole} />
                 <InfoItem label="Village Name" value={homestay.villageName} /> 
                 <InfoItem label="Full Address (EN)" value={homestay.address?.formattedAddress?.en} />
                 <InfoItem label="Full Address (NE)" value={homestay.address?.formattedAddress?.ne} />
               </>
             ) : (
               <>
                 {/* Province Dropdown */}
                 <div className="grid grid-cols-3 gap-2 py-1.5">
                   <div className="text-gray-500 font-medium">Province</div>
                   <div className="col-span-2">
                     <select
                       value={(editedData.address?.province?.ne || homestay.address?.province?.ne) || ''}
                       onChange={(e) => {
                         const selectedProvince = e.target.value;
                         handleAddressChange('province', {
                           ne: selectedProvince,
                           en: selectedProvince // Also set English value
                         });
                       }}
                       className="w-full p-2 border border-gray-300 rounded-md text-sm"
                     >
                       <option value="">Select Province</option>
                       {provinces.map(province => (
                         <option key={province} value={province}>
                           {province}
                         </option>
                       ))}
                     </select>
                   </div>
                 </div>
                 
                 {/* District Dropdown */}
                 <div className="grid grid-cols-3 gap-2 py-1.5">
                   <div className="text-gray-500 font-medium">District</div>
                   <div className="col-span-2">
                     <select
                       value={(editedData.address?.district?.ne || homestay.address?.district?.ne) || ''}
                       onChange={(e) => {
                         const selectedDistrict = e.target.value;
                         handleAddressChange('district', {
                           ne: selectedDistrict,
                           en: selectedDistrict // Also set English value
                         });
                       }}
                       className="w-full p-2 border border-gray-300 rounded-md text-sm"
                       disabled={!(editedData.address?.province?.ne || homestay.address?.province?.ne)}
                     >
                       <option value="">Select District</option>
                       {districts.map(district => (
                         <option key={district} value={district}>
                           {district}
                         </option>
                       ))}
                     </select>
                   </div>
                 </div>
                 
                 {/* Municipality Dropdown */}
                 <div className="grid grid-cols-3 gap-2 py-1.5">
                   <div className="text-gray-500 font-medium">Municipality</div>
                   <div className="col-span-2">
                     <select
                       value={(editedData.address?.municipality?.ne || homestay.address?.municipality?.ne) || ''}
                       onChange={(e) => {
                         const selectedMunicipality = e.target.value;
                         handleAddressChange('municipality', {
                           ne: selectedMunicipality,
                           en: selectedMunicipality // Also set English value
                         });
                       }}
                       className="w-full p-2 border border-gray-300 rounded-md text-sm"
                       disabled={!(editedData.address?.district?.ne || homestay.address?.district?.ne)}
                     >
                       <option value="">Select Municipality</option>
                       {municipalities.map(municipality => (
                         <option key={municipality} value={municipality}>
                           {municipality}
                         </option>
                       ))}
                     </select>
                   </div>
                 </div>
                 
                 {/* Ward Dropdown */}
                 <div className="grid grid-cols-3 gap-2 py-1.5">
                   <div className="text-gray-500 font-medium">Ward No.</div>
                   <div className="col-span-2">
                     <select
                       value={(editedData.address?.ward?.ne || homestay.address?.ward?.ne) || ''}
                       onChange={(e) => {
                         const selectedWard = e.target.value;
                         handleAddressChange('ward', {
                           ne: selectedWard,
                           en: selectedWard // Also set English value
                         });
                       }}
                       className="w-full p-2 border border-gray-300 rounded-md text-sm"
                     >
                       <option value="">Select Ward</option>
                       {[...Array(33)].map((_, i) => (
                         <option key={i+1} value={String(i+1)}>
                           {i+1}
                         </option>
                       ))}
                     </select>
                   </div>
                 </div>
                 
                 {/* City text input */}
                 <EditableInfoItem 
                   label="City" 
                   value={(getCurrentValue('address') as any)?.city || ''} 
                   field="address"
                   onChange={(field, value) => handleAddressChange('city', value)}
                 />
                 
                 {/* Tole text input */}
                 <EditableInfoItem 
                   label="Tole" 
                   value={(getCurrentValue('address') as any)?.tole || ''} 
                   field="address"
                   onChange={(field, value) => handleAddressChange('tole', value)}
                 />
                 
                 {/* Village Name text input */}
                 <EditableInfoItem 
                   label="Village Name" 
                   value={getCurrentValue('villageName')} 
                   field="villageName"
                   onChange={handleInputChange}
                 />
                 
                 {/* Read-only formatted address */}
                 <InfoItem label="Full Address (EN)" value={homestay.address?.formattedAddress?.en} />
                 <InfoItem label="Full Address (NE)" value={homestay.address?.formattedAddress?.ne} />
               </>
             )}
          </InfoSection>

          {/* Contact Person Section - Accessing contacts array with correct fields */}
           <InfoSection title="Contact Person" icon={User}>
             {!isEditing ? (
               <>
                 <InfoItem label="Name" value={primaryApiContact?.name || homestay.ownerName} />
                 <InfoItem label="Phone" value={primaryApiContact?.mobile || homestay.ownerContact || homestay.phone} /> 
                 <InfoItem label="Email" value={primaryApiContact?.email} />
                 <InfoItem label="Website">
                    {primaryApiContact?.website ? (
                        <a href={primaryApiContact.website.startsWith('http') ? primaryApiContact.website : `http://${primaryApiContact.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                        {primaryApiContact.website} <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                    ) : null}
                 </InfoItem>
               </>
             ) : (
               <>
                 <div className="grid grid-cols-3 gap-2 py-1.5">
                   <div className="text-gray-500 font-medium">Name</div>
                   <div className="col-span-2">
                     <input 
                       type="text"
                       value={(editedData.contacts?.[0]?.name || primaryApiContact?.name || homestay.ownerName || '')}
                       onChange={(e) => updateContactField('name', e.target.value)}
                       className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                     />
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-2 py-1.5">
                   <div className="text-gray-500 font-medium">Phone</div>
                   <div className="col-span-2">
                     <input 
                       type="text"
                       value={editedData.contacts?.[0]?.mobile || primaryApiContact?.mobile || homestay.ownerContact || homestay.phone || ''}
                       onChange={(e) => updateContactField('mobile', e.target.value)}
                       className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                     />
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-2 py-1.5">
                   <div className="text-gray-500 font-medium">Email</div>
                   <div className="col-span-2">
                     <input 
                       type="email"
                       value={editedData.contacts?.[0]?.email || primaryApiContact?.email || ''}
                       onChange={(e) => updateContactField('email', e.target.value)}
                       className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                     />
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-2 py-1.5">
                   <div className="text-gray-500 font-medium">Website</div>
                   <div className="col-span-2">
                     <input 
                       type="text"
                       value={editedData.contacts?.[0]?.website || primaryApiContact?.website || ''}
                       onChange={(e) => updateContactField('website', e.target.value)}
                       className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                       placeholder="https://example.com"
                     />
                   </div>
                 </div>
               </>
             )}
           </InfoSection>

          {/* Officials Section - Accessing officials array with correct fields */}
          <InfoSection title="Committee Officials" icon={User}>
              {!isEditing ? (
                <div className="space-y-3">
                  {(homestay.officials || []).map((official, index) => (
                    <div key={official._id || index} className="border-b border-gray-100 pb-2 last:border-b-0">
                       <InfoItem label="Name" value={official.name} />
                       <InfoItem label="Position" value={official.role} />
                       <InfoItem label="Contact" value={official.contactNo} />
                    </div>
                  ))}
                  {(!homestay.officials || homestay.officials.length === 0) && (
                    <p className="text-gray-500 italic">No committee officials registered.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Officials List */}
                  {(editedData.officials || homestay.officials || []).map((official, index) => (
                    <div key={official._id || index} className="p-3 border border-gray-200 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium">Official #{index + 1}</h4>
                        <button 
                          type="button"
                          onClick={() => removeOfficial(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        <div className="mb-2">
                          <label className="text-xs text-gray-500 block mb-1">Name</label>
                          <input 
                            type="text"
                            value={official.name || ''}
                            onChange={(e) => updateOfficialField(index, 'name', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                          />
                        </div>
                        
                        <div className="mb-2">
                          <label className="text-xs text-gray-500 block mb-1">Position</label>
                          <input 
                            type="text"
                            value={official.role || ''}
                            onChange={(e) => updateOfficialField(index, 'role', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                          />
                        </div>
                        
                        <div className="mb-2">
                          <label className="text-xs text-gray-500 block mb-1">Contact Number</label>
                          <input 
                            type="text"
                            value={official.contactNo || ''}
                            onChange={(e) => updateOfficialField(index, 'contactNo', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Official Button */}
                  <button 
                    type="button"
                    onClick={addOfficial}
                    className="flex items-center justify-center w-full p-2 border border-dashed border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:border-gray-400"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Official
                  </button>
                </div>
              )}
          </InfoSection>

           {/* Features Section */}
           <InfoSection title="Features & Services" icon={List}>
              {!isEditing ? (
                <>
                  {homestay.features?.localAttractions && homestay.features.localAttractions.length > 0 && (
                      <InfoItem label="Attractions">
                          <ul className="list-disc list-inside space-y-1">
                              {homestay.features.localAttractions.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                      </InfoItem>
                  )}
                  {homestay.features?.tourismServices && homestay.features.tourismServices.length > 0 && (
                      <InfoItem label="Services">
                          <ul className="list-disc list-inside space-y-1">
                              {homestay.features.tourismServices.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                      </InfoItem>
                  )}
                  {homestay.features?.infrastructure && homestay.features.infrastructure.length > 0 && (
                      <InfoItem label="Infrastructure">
                          <ul className="list-disc list-inside space-y-1">
                              {homestay.features.infrastructure.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                      </InfoItem>
                  )}
                  {(!homestay.features || 
                    (!homestay.features.localAttractions?.length && 
                     !homestay.features.tourismServices?.length && 
                     !homestay.features.infrastructure?.length)) && (
                    <p className="text-gray-500 italic">No features registered.</p>
                  )}
                </>
              ) : (
                <div className="space-y-6">
                  {/* Local Attractions */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Local Attractions</h4>
                    <div className="space-y-2">
                      {/* Feature items list */}
                      {(editedData.features?.localAttractions || homestay.features?.localAttractions || []).map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <span className="text-sm">{item}</span>
                          <button 
                            type="button"
                            onClick={() => removeFeatureItem('localAttractions', index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      
                      {/* Add feature item input */}
                      <div className="flex mt-2">
                        <input 
                          type="text"
                          placeholder="Add new attraction..."
                          className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              addFeatureItem('localAttractions', input.value);
                              input.value = '';
                            }
                          }}
                        />
                        <button 
                          type="button"
                          className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            addFeatureItem('localAttractions', input.value);
                            input.value = '';
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tourism Services */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tourism Services</h4>
                    <div className="space-y-2">
                      {/* Service items list */}
                      {(editedData.features?.tourismServices || homestay.features?.tourismServices || []).map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <span className="text-sm">{item}</span>
                          <button 
                            type="button"
                            onClick={() => removeFeatureItem('tourismServices', index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      
                      {/* Add service item input */}
                      <div className="flex mt-2">
                        <input 
                          type="text"
                          placeholder="Add new service..."
                          className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              addFeatureItem('tourismServices', input.value);
                              input.value = '';
                            }
                          }}
                        />
                        <button 
                          type="button"
                          className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            addFeatureItem('tourismServices', input.value);
                            input.value = '';
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Infrastructure */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Infrastructure</h4>
                    <div className="space-y-2">
                      {/* Infrastructure items list */}
                      {(editedData.features?.infrastructure || homestay.features?.infrastructure || []).map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <span className="text-sm">{item}</span>
                          <button 
                            type="button"
                            onClick={() => removeFeatureItem('infrastructure', index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      
                      {/* Add infrastructure item input */}
                      <div className="flex mt-2">
                        <input 
                          type="text"
                          placeholder="Add new infrastructure item..."
                          className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              addFeatureItem('infrastructure', input.value);
                              input.value = '';
                            }
                          }}
                        />
                        <button 
                          type="button"
                          className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            addFeatureItem('infrastructure', input.value);
                            input.value = '';
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
           </InfoSection>

        </div>
        
        {/* Right Column (Narrower) */}
        <div className="lg:col-span-1 space-y-6">
      
      {/* Action Buttons */}
           <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
                <h3 className="text-md font-medium text-gray-800 mb-3">Actions</h3>
                <div className="flex flex-col space-y-3">
                  {/* Edit Mode Toggle Button */}
                  {isEditing ? (
                    <>
                      <button 
                        onClick={handleSaveChanges} 
                        disabled={isSaving}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button 
                        onClick={cancelEditing} 
                        disabled={isSaving}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center justify-center transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Homestay
                    </button>
                  )}
                  
                  {/* Status Update Buttons - Only show when not editing */}
                  {!isEditing && (
                    <>
                      {homestay.status !== 'approved' && (
                        <button 
                          onClick={() => handleStatusUpdate('approved')} 
                          disabled={updateStatus === 'loading'}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {updateStatus === 'loading' ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Approve Homestay
                        </button>
                      )}
                      
                      {homestay.status !== 'rejected' && (
                        <button 
                          onClick={() => handleStatusUpdate('rejected')} 
                          disabled={updateStatus === 'loading'}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {updateStatus === 'loading' ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          Reject Homestay
                        </button>
                      )}
                    </>
                  )}
                </div>
            </div>
        
          {/* Images Section */}
          <InfoSection title="Images" icon={ImageIcon}>
            {/* Profile Image */}
            <div className="mb-4">
              <h3 className="text-xs font-medium text-gray-600 mb-1 uppercase">Profile Image</h3>
              <div className="bg-gray-100 rounded-lg overflow-hidden aspect-video">
                <img 
                  src={getImageUrl(homestay.profileImage)} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/placeholder.png'; e.currentTarget.onerror = null; }}
                />
              </div>
            </div>
            
            {/* Gallery Images */}
            {homestay.galleryImages && homestay.galleryImages.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-gray-600 mb-1 uppercase">Gallery</h3>
                <div className="grid grid-cols-3 gap-2">
                  {homestay.galleryImages.map((image, index) => (
                    <div key={index} className="bg-gray-100 rounded-md overflow-hidden aspect-square">
                      <img 
                        src={getImageUrl(image)} 
                        alt={`Gallery ${index + 1}`} 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = '/placeholder.png'; e.currentTarget.onerror = null; }}
                      />
                      {/* Optional: Add a modal preview on click */}
                    </div>
                  ))}
                </div>
              </div>
            )}
             {!homestay.profileImage && (!homestay.galleryImages || homestay.galleryImages.length === 0) && (
                 <p className="text-gray-500 italic">No images uploaded.</p>
             )}
          </InfoSection>

          {/* Documents Section - Improved Layout */}
           <InfoSection title="Documents" icon={FileIcon}>
             {homestay.documents && homestay.documents.length > 0 ? (
               <div className="space-y-4">
                 {homestay.documents.map((docGroup, index) => (
                   <div key={index}>
                     <h4 className="text-sm font-medium text-gray-800 mb-1">{docGroup.title}</h4>
                     {docGroup.description && <p className="text-xs text-gray-500 mb-2">{docGroup.description}</p>}
                     <ul className="space-y-1">
                       {docGroup.files.map((file, fileIndex) => (
                         <li key={fileIndex} className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-2 rounded-md text-xs">
                           <div className="flex items-center overflow-hidden mr-2">
                             <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-600 flex-shrink-0" />
                             <span className="truncate" title={file.originalName}>
                               {file.originalName} 
                             </span>
                             <span className="ml-1 text-gray-400 flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                           </div>
                           <a 
                             href={getDocumentUrl(file.filePath)} 
                             target="_blank" 
                             rel="noopener noreferrer" 
                             className="p-1 text-primary hover:text-primary/80 flex-shrink-0"
                             title="Open document in new tab"
                           >
                             <ExternalLink className="h-3.5 w-3.5" />
                           </a>
                         </li>
                       ))}
                     </ul>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-gray-500 italic">No documents uploaded.</p>
             )}
           </InfoSection>

        </div>
      </div>
    </div>
  );
} 