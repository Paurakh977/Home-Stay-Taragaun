"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
// Remove the import from '@/types/homestay' if HomestayData is defined below
// import { HomestayData } from '@/types/homestay'; 
import { CheckCircle, XCircle, ArrowLeft, FileText, Loader2, ExternalLink, MapPin, Phone, User, Mail, Building, Globe, Image as ImageIcon, File as FileIcon, List, Edit, Plus, X, Upload, Eye, Download, Trash2, AlertCircle } from 'lucide-react';
import { useAdminOfficer } from '@/context/AdminOfficerContext';

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
  adminUsername?: string; // The admin user who owns this homestay
  
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
  
  // Custom fields
  customFields?: {
    definitions: Array<{
      fieldId: string;
      label: string;
      type: 'text' | 'number' | 'date' | 'boolean' | 'select';
      options?: string[];
      required: boolean;
      addedBy: string;
      addedAt: string;
    }>;
    values: {
      [fieldId: string]: any;
      lastUpdated?: string;
      reviewed?: boolean;
      reviewedBy?: string;
      reviewedAt?: string;
    };
  };
}

// --- Component Code ---

interface PageProps {
  params: { homestayId: string }; 
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

export default function AdminHomestayDetailPage() { 
  const router = useRouter();
  const params = useParams<{ homestayId: string }>();
  const homestayId = params?.homestayId || '';
  const [loading, setLoading] = useState(true);
  const [homestay, setHomestay] = useState<HomestayData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedHomestay, setEditedHomestay] = useState<HomestayData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeletingDocument, setIsDeletingDocument] = useState(false);
  const [documentIndexToDelete, setDocumentIndexToDelete] = useState<number | null>(null);
  const [documentToUpload, setDocumentToUpload] = useState<DocumentInfo[]>([]);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [isConfirmingDocumentDelete, setIsConfirmingDocumentDelete] = useState(false);
  const [newDocumentFiles, setNewDocumentFiles] = useState<{
    [key: string]: File[];
  }>({});
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  // Use the AdminOfficerContext to check if we're in officer context
  const { isOfficer, officerData } = useAdminOfficer();
  
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  
  // Check permissions on page load
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // If we're in officer mode, use the officer's permissions
        if (isOfficer && officerData) {
          console.log("Using officer permissions from context:", officerData);
          setUserPermissions(officerData.permissions);
          setAdminUsername(officerData.parentAdmin);
          
          // Check for edit permission - required to view this page
          const canEdit = officerData.permissions.homestayEdit === true;
          if (!canEdit) {
            toast.error("You don't have permission to edit homestay details");
            router.push(`/officer/${officerData.parentAdmin}`);
            return;
          }
          
          // Now fetch the homestay to check ownership
          try {
            // Use officer-specific endpoint to fetch homestay
            const homestayResponse = await fetch(`/api/officer/homestays/${homestayId}`);
            if (!homestayResponse.ok) {
              toast.error("Failed to fetch homestay details");
              router.push(`/officer/${officerData.parentAdmin}`);
              return;
            }
            
            const homestayData = await homestayResponse.json();
            if (!homestayData.success || !homestayData.data) {
              toast.error("Invalid homestay data");
              router.push(`/officer/${officerData.parentAdmin}`);
              return;
            }
            
            // Check if this homestay belongs to the officer's admin
            if (homestayData.data.adminUsername && 
                homestayData.data.adminUsername !== officerData.parentAdmin) {
              toast.error("You don't have permission to edit another admin's homestay");
              router.push(`/officer/${officerData.parentAdmin}`);
              return;
            }
          } catch (error) {
            console.error("Error fetching homestay data:", error);
            toast.error("Failed to validate homestay access");
            router.push(`/officer/${officerData.parentAdmin}`);
            return;
          }
          
          // Mark permissions as checked
          setPermissionChecked(true);
          return;
        }
        
        // Regular admin flow - Check if user has permission to edit homestays
        const response = await fetch('/api/admin/auth/me');
        if (!response.ok) {
          toast.error("Authentication failed. Please log in again.");
          router.push('/admin/login');
          return;
        }
        
        const data = await response.json();
        if (!data.success || !data.user) {
          toast.error("Failed to fetch user data");
          router.push('/admin/login');
          return;
        }
        
        // Store all permissions for checking different actions
        const permissions = data.user.permissions || {};
        setUserPermissions(permissions);
        
        // Store current admin username for ownership checks
        const currentAdminUsername = data.user.username;
        setAdminUsername(currentAdminUsername);
        
        // Check for edit permission - required to view this page
        const canEdit = permissions.homestayEdit === true;
        if (!canEdit) {
          toast.error("You don't have permission to edit homestay details");
          router.push('/admin');
          return;
        }
        
        // Now fetch the homestay to check ownership
        try {
          const homestayResponse = await fetch(`/api/admin/homestays/${homestayId}`);
          if (!homestayResponse.ok) {
            toast.error("Failed to fetch homestay details");
            router.push('/admin');
            return;
          }
          
          const homestayData = await homestayResponse.json();
          if (!homestayData.success || !homestayData.data) {
            toast.error("Invalid homestay data");
            router.push('/admin');
            return;
          }
          
          // Check if this homestay belongs to the current admin
          if (homestayData.data.adminUsername && 
              homestayData.data.adminUsername !== currentAdminUsername) {
            
            // Check if user is a superadmin (they can edit any homestay)
            const superadminResponse = await fetch('/api/superadmin/auth/me');
            if (!superadminResponse.ok) {
              // Not a superadmin, show error
              toast.error("You don't have permission to edit another admin's homestay");
              router.push('/admin');
              return;
            }
            // If superadmin, continue without returning
          }
        } catch (error) {
          console.error("Error fetching homestay data:", error);
          toast.error("Failed to validate homestay access");
          router.push('/admin');
          return;
        }
        
        // Mark permissions as checked
        setPermissionChecked(true);
      } catch (error) {
        console.error("Permission check error:", error);
        toast.error("Failed to verify permissions");
        if (isOfficer && officerData) {
          router.push(`/officer/${officerData.parentAdmin}`);
        } else {
          router.push('/admin');
        }
      }
    };
    
    checkPermissions();
  }, [router, homestayId, isOfficer, officerData]);
  
  // Helper function to check permissions
  const hasPermission = (permission: string): boolean => {
    return userPermissions[permission] === true;
  };
  
  // Inline editing state (integrating with isEditing and isSaving above)
  const [editedData, setEditedData] = useState<Partial<HomestayData>>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // Location dropdown data
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [provinceDistrictsMap, setProvinceDistrictsMap] = useState<Record<string, string[]>>({});
  const [districtMunicipalitiesMap, setDistrictMunicipalitiesMap] = useState<Record<string, string[]>>({});
  const [locationDataLoaded, setLocationDataLoaded] = useState(false);
  
  // Document upload state
  const [documentItems, setDocumentItems] = useState<Array<{id: string; title: string; description: string; files: File[]}>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRefs = useRef<HTMLInputElement[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ file: File; url: string } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    documentIndex: number;
    isDeleting: boolean;
  }>({
    isOpen: false,
    documentIndex: -1,
    isDeleting: false
  });

  // Initialize document items
  useEffect(() => {
    setDocumentItems([
      { id: crypto.randomUUID(), title: "", description: "", files: [] }
    ]);

    // Log URL parameters whenever the component mounts
    console.log("Component mounted. URL:", window.location.href);
    console.log("Search params:", window.location.search);
  }, []);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewFile?.url && previewFile.url.startsWith('blob:')) {
        URL.revokeObjectURL(previewFile.url);
      }
    };
  }, [previewFile]);

  // Set up keyboard listeners for document preview modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewOpen) {
        closePreview();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewOpen]);

  const fetchHomestayDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use appropriate API endpoint based on user role
      const apiUrl = isOfficer && officerData 
        ? `/api/officer/homestays/${homestayId}`
        : `/api/admin/homestays/${homestayId}`;
        
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch details: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success) {
        const fetchedData = data.data as HomestayData;
        console.log("Fetched Homestay Data:", JSON.stringify(fetchedData, null, 2)); 
        
        // Debug gallery images if present
        if (fetchedData.galleryImages && fetchedData.galleryImages.length > 0) {
          console.log(`Found ${fetchedData.galleryImages.length} gallery images:`, fetchedData.galleryImages);
        } else {
          console.log("No gallery images found in homestay data");
        }
        
        // Debug the adminUsername if available
        if (fetchedData.adminUsername) {
          console.log("Found adminUsername in homestay data:", fetchedData.adminUsername);
        } else {
          console.warn("No adminUsername found in homestay data, will need to get it from URL params");
        }
        
        // Ensure top-level address exists if relying on it primarily
        fetchedData.address = fetchedData.address || {}; 
        fetchedData.officials = fetchedData.officials || [];
        fetchedData.contacts = fetchedData.contacts || [];
        fetchedData.features = fetchedData.features || {};
        fetchedData.documents = fetchedData.documents || [];
        // Initialize galleryImages as empty array if not present
        fetchedData.galleryImages = fetchedData.galleryImages || [];
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
  }, [homestayId, isOfficer, officerData]);

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
    // Check permission before proceeding
    if (!hasPermission('homestayApproval')) {
      toast.error("You don't have permission to change homestay approval status");
      return;
    }
    
    setUpdateStatus('loading');
    setUpdateError(null);
    try {
      // Use appropriate API endpoint based on user role
      const apiUrl = isOfficer && officerData 
        ? `/api/officer/homestays/${homestayId}`
        : `/api/admin/homestays/${homestayId}`;
        
      const response = await fetch(apiUrl, {
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
    
    // Add a cache-busting timestamp to prevent browsers from showing stale images
    const timestamp = `?t=${new Date().getTime()}`;
    
    // If it's already an API URL, just return it
    if (filePath.startsWith('/api/images/')) {
      return `${filePath}${timestamp}`;
    }
    
    // Convert /uploads/ path to /api/images/ path
    if (filePath.startsWith('/uploads/')) {
      return `${filePath.replace('/uploads/', '/api/images/')}${timestamp}`;
    }
    
    // If it's a relative URL without a leading slash, add one
    if (!filePath.startsWith('/') && !filePath.startsWith('http')) {
      return `/api/images/${filePath}${timestamp}`;
    }
    
    // For absolute URLs (http/https), return as is
    return filePath;
  };

  const getDocumentUrl = (filePath?: string) => {
    if (!filePath) return '#';
    
    console.log("Getting URL for document path:", filePath);
    
    // Convert /uploads/ path to /api/images/ path (use images endpoint for all media)
    if (filePath.startsWith('/uploads/')) {
      const apiPath = filePath.replace('/uploads/', '/api/images/');
      console.log("Converted document path to:", apiPath);
      return apiPath;
    }
    return filePath;
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
      
      // Use appropriate API endpoint based on user role
      const apiUrl = isOfficer && officerData 
        ? `/api/officer/homestays/${homestayId}/update`
        : `/api/admin/homestays/${homestayId}/update`;
      
      // Save changes via API
      const response = await fetch(apiUrl, {
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

  // Document upload functions
  const addDocumentItem = () => {
    setDocumentItems(prevItems => [
      ...prevItems,
      { id: crypto.randomUUID(), title: "", description: "", files: [] }
    ]);
  };

  const removeDocumentItem = (id: string) => {
    if (documentItems.length === 1) {
      toast.error("You must have at least one document item");
      return;
    }
    setDocumentItems(documentItems.filter(item => item.id !== id));
  };

  const updateDocumentItem = (id: string, field: 'title' | 'description', value: string) => {
    setDocumentItems(
      documentItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleFileChange = (id: string, files: FileList | null) => {
    if (!files) return;
    
    setDocumentItems(
      documentItems.map(item => 
        item.id === id 
          ? { 
              ...item, 
              files: [...Array.from(files)]
            } 
          : item
      )
    );
  };

  const removeFile = (documentId: string, fileIndex: number) => {
    setDocumentItems(
      documentItems.map(item => 
        item.id === documentId 
          ? { 
              ...item, 
              files: item.files.filter((_, idx) => idx !== fileIndex)
            } 
          : item
      )
    );
  };

  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase();
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.startsWith('text/')) return '📝';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    return '📎';
  };

  const canPreviewInBrowser = (file: File): boolean => {
    const type = file.type.toLowerCase();
    return (
      type.startsWith('image/') || 
      type === 'application/pdf' || 
      type === 'text/plain' || 
      type === 'text/html' || 
      type === 'text/csv'
    );
  };

  const openPreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewFile({ file, url });
    setPreviewOpen(true);
  };

  const closePreview = useCallback(() => {
    if (previewFile?.url && previewFile.url.startsWith('blob:')) {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
    setPreviewOpen(false);
  }, [previewFile, previewOpen]);

  // Handle document upload
  const handleUploadDocuments = async () => {
    // Check for document upload permission
    if (!hasPermission('documentUpload')) {
      toast.error("You don't have permission to upload documents");
      return;
    }

    // Check if homestay and admin username are available
    if (!homestay) {
      toast.error("Missing homestay information for uploads");
      return;
    }

    // Try to get admin username - with fallback for testing
    let effectiveAdminUsername = adminUsername;
    
    if (!effectiveAdminUsername) {
      console.warn("No adminUsername found in state, checking URL again");
      
      // Try to extract from URL again
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        effectiveAdminUsername = urlParams.get('username');
        
        // Last resort - try to extract from path
        if (!effectiveAdminUsername) {
          const pathSegments = window.location.pathname.split('/');
          const adminIndex = pathSegments.indexOf('admin');
          if (adminIndex >= 0 && adminIndex + 1 < pathSegments.length) {
            const possibleUsername = pathSegments[adminIndex + 1];
            if (possibleUsername && possibleUsername !== 'homestays') {
              effectiveAdminUsername = possibleUsername;
            }
          }
        }
      }
    }
    
    // IMPORTANT: If still no admin username, get the user who owns this homestay from the database
    if (!effectiveAdminUsername && homestay.adminUsername) {
      console.log("Using homestay's adminUsername:", homestay.adminUsername);
      effectiveAdminUsername = homestay.adminUsername;
    }
    
    if (!effectiveAdminUsername) {
      toast.error("Admin username is required for uploads. Please check the URL parameters.");
      console.error("Missing adminUsername for uploads. Current URL:", window.location.href);
      return;
    }

    console.log("Final adminUsername for upload:", effectiveAdminUsername);

    // Validate form (title and files)
    const hasEmptyTitle = documentItems.some(item => !item.title.trim());
    if (hasEmptyTitle) {
      toast.error("Please provide titles for all documents");
      return;
    }

    const hasNoFiles = documentItems.some(item => item.files.length === 0);
    if (hasNoFiles) {
      toast.error("Please upload at least one file for each document entry");
      return;
    }

    setIsUploading(true);
    console.log("Starting upload with adminUsername:", effectiveAdminUsername);

    try {
      const formData = new FormData();

      // 1. Prepare metadata (titles and descriptions)
      const metadata = documentItems.map(item => ({ 
        title: item.title,
        description: item.description 
      }));
      formData.append("metadata", JSON.stringify(metadata));

      // 2. Append files with structured keys (file_{itemIndex}_{fileIndex})
      documentItems.forEach((item, itemIndex) => {
        item.files.forEach((file, fileIndex) => {
          formData.append(`file_${itemIndex}_${fileIndex}`, file, file.name);
        });
      });
      
      // 3. Send the request with correct path for admin (ensuring right path)
      const uploadUrl = `/api/homestays/${homestay.homestayId}/documents?adminUsername=${effectiveAdminUsername}`;
      console.log("Uploading to:", uploadUrl);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload documents');
      }

      toast.success(result.message || "Documents uploaded successfully");

      // Reset form with a single empty item
      setDocumentItems([
        { id: crypto.randomUUID(), title: "", description: "", files: [] }
      ]);
      
      // Refresh homestay data to show the newly uploaded documents
      fetchHomestayDetails();
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Function to handle document deletion
  const handleDeleteDocument = (index: number) => {
    // Check for document upload permission (needed for deleting too)
    if (!hasPermission('documentUpload')) {
      toast.error("You don't have permission to delete documents");
      return;
    }

    setDeleteConfirmation({
      isOpen: true,
      documentIndex: index,
      isDeleting: false
    });
  };

  const deleteDocument = async () => {
    if (!homestay) {
      toast.error("Homestay data is missing");
      return;
    }
    
    // Get the appropriate adminUsername
    let effectiveAdminUsername = adminUsername;
    
    if (!effectiveAdminUsername) {
      // Try URL params
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        effectiveAdminUsername = urlParams.get('username');
        
        // Try path segments
        if (!effectiveAdminUsername) {
          const pathSegments = window.location.pathname.split('/');
          const adminIndex = pathSegments.indexOf('admin');
          if (adminIndex >= 0 && adminIndex + 1 < pathSegments.length) {
            const possibleUsername = pathSegments[adminIndex + 1];
            if (possibleUsername && possibleUsername !== 'homestays') {
              effectiveAdminUsername = possibleUsername;
            }
          }
        }
      }
      
      // Try the homestay data
      if (!effectiveAdminUsername && homestay.adminUsername) {
        console.log("Using homestay's adminUsername for delete:", homestay.adminUsername);
        effectiveAdminUsername = homestay.adminUsername;
      }
      
      if (!effectiveAdminUsername) {
        toast.error("Admin username is required for deleting documents");
        return;
      }
    }
    
    console.log("Final adminUsername for delete:", effectiveAdminUsername);
    console.log("Document to delete index:", deleteConfirmation.documentIndex);
    
    try {
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: true }));
      
      // Construct the API URL with admin context
      let apiUrl = `/api/homestays/${homestay.homestayId}/documents?adminUsername=${effectiveAdminUsername}`;
      console.log("Deleting from:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentIndex: deleteConfirmation.documentIndex
        })
      });
      
      // Log the response for debugging
      console.log("Delete response status:", response.status);
      
      const responseData = await response.json();
      console.log("Delete response data:", responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to delete document');
      }
      
      // Create success message with file deletion info
      let successMessage = 'Document deleted successfully';
      if (responseData.filesDeletion) {
        const { total, deleted, failed } = responseData.filesDeletion;
        if (failed > 0) {
          successMessage += `. Warning: ${failed} of ${total} files could not be removed from storage.`;
        } else {
          successMessage += `. All ${deleted} files removed from storage.`;
        }
      }
      
      toast.success(successMessage);
      setDeleteConfirmation({isOpen: false, documentIndex: -1, isDeleting: false});
      
      // Refresh homestay data
      fetchHomestayDetails();
      
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete document');
    } finally {
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // ... existing code ...
  const [uploadingImage, setUploadingImage] = useState(false);
  const multipleImagesInputRef = useRef<HTMLInputElement>(null);

  // Function to handle a single gallery image upload
  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Check for image upload permission
    if (!hasPermission('imageUpload')) {
      toast.error("You don't have permission to upload images");
      e.target.value = ''; // Clear input
      return;
    }

    if (!e.target.files || !e.target.files[0] || !homestay) return;
    
    try {
      setUploadingImage(true);
      
      const file = e.target.files[0];
      console.log("Uploading gallery image:", {
        filename: file.name,
        type: file.type,
        size: file.size,
        homestayId: homestay.homestayId
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      // Get the appropriate adminUsername
      let effectiveAdminUsername = adminUsername;
      
      if (!effectiveAdminUsername && homestay.adminUsername) {
        console.log("Using homestay's adminUsername for upload:", homestay.adminUsername);
        effectiveAdminUsername = homestay.adminUsername;
      }
      
      if (!effectiveAdminUsername) {
        toast.error("Admin username is required for uploading images");
        return;
      }
      
      // Construct the API URL with admin context
      let apiUrl = `/api/homestays/${homestay.homestayId}/images?adminUsername=${effectiveAdminUsername}`;
      
      console.log("Uploading to API URL:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });
      
      console.log("Upload response status:", response.status);
      
      const responseData = await response.json();
      console.log("Upload response data:", responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to upload gallery image');
      }
      
      toast.success('Image uploaded successfully');
      
      // Refresh homestay data to show the newly uploaded image
      fetchHomestayDetails();
      
    } catch (error) {
      console.error('Error uploading gallery image:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setUploadingImage(false);
      // Clear input
      e.target.value = '';
    }
  };

  // Function to handle multiple gallery images upload
  const handleMultipleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Check for image upload permission
    if (!hasPermission('imageUpload')) {
      toast.error("You don't have permission to upload images");
      e.target.value = ''; // Clear input
      return;
    }

    if (!e.target.files || e.target.files.length === 0 || !homestay) return;
    
    try {
      setUploadingImage(true);
      
      const files = Array.from(e.target.files);
      let uploadedCount = 0;
      let failedCount = 0;
      
      // Get the appropriate adminUsername
      let effectiveAdminUsername = adminUsername;
      
      if (!effectiveAdminUsername && homestay.adminUsername) {
        console.log("Using homestay's adminUsername for multiple uploads:", homestay.adminUsername);
        effectiveAdminUsername = homestay.adminUsername;
      }
      
      if (!effectiveAdminUsername) {
        toast.error("Admin username is required for uploading images");
        return;
      }
      
      // Construct the API URL with admin context
      const apiUrl = `/api/homestays/${homestay.homestayId}/images?adminUsername=${effectiveAdminUsername}`;
      
      // Create upload promises for each file
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append('file', file);
        
        return fetch(apiUrl, {
          method: 'POST',
          body: formData,
        })
        .then(response => {
          if (!response.ok) {
            failedCount++;
            return { success: false };
          }
          return response.json();
        })
        .then(data => {
          if (data.success) {
            uploadedCount++;
            return data.imageUrl;
          }
          failedCount++;
          return null;
        })
        .catch(() => {
          failedCount++;
          return null;
        });
      });
      
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
      
      // Show success message with counts
      if (uploadedCount > 0) {
        toast.success(`${uploadedCount} images uploaded successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`);
      } else {
        toast.error('Failed to upload images');
      }
      
      // Refresh homestay data to show the newly uploaded images
      fetchHomestayDetails();
      
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setUploadingImage(false);
      // Clear input
      if (multipleImagesInputRef.current) {
        multipleImagesInputRef.current.value = '';
      }
    }
  };

  // Function to delete a gallery image
  const handleDeleteGalleryImage = async (imagePath: string) => {
    // Check for image upload permission (needed for deleting too)
    if (!hasPermission('imageUpload')) {
      toast.error("You don't have permission to delete images");
      return;
    }

    if (!homestay) {
      toast.error("Homestay data is missing");
      return;
    }
    
    // Get the appropriate adminUsername
    let effectiveAdminUsername = adminUsername;
    
    if (!effectiveAdminUsername && homestay.adminUsername) {
      effectiveAdminUsername = homestay.adminUsername;
    }
    
    console.log("Image to delete:", imagePath);
    
    if (confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
      try {
        // Construct API URL with admin context and image path
        let apiUrl = `/api/homestays/${homestay.homestayId}/images?imagePath=${encodeURIComponent(imagePath)}`;
        if (effectiveAdminUsername) {
          apiUrl += `&adminUsername=${effectiveAdminUsername}`;
        }
        
        console.log("Deleting image from:", apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'DELETE',
        });
        
        console.log("Delete response status:", response.status);
        
        const responseData = await response.json();
        console.log("Delete response data:", responseData);
        
        if (!response.ok) {
          throw new Error(responseData.error || 'Failed to delete image');
        }
        
        toast.success('Image deleted successfully');
        
        // Refresh homestay data
        fetchHomestayDetails();
        
      } catch (error) {
        console.error('Error deleting gallery image:', error);
        toast.error(`Deletion failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
      }
    }
  };
  // ... existing code ...

  // --- Render Logic ---

  // Render loading state or error if necessary
  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-700">{error}</p>
        <button
          onClick={() => router.push('/admin')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Don't render content until permissions are checked
  if (!permissionChecked) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No homestay data
  if (!homestay) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Homestay Not Found</h2>
        <p className="text-gray-700">The requested homestay could not be found.</p>
        <button
          onClick={() => router.push('/admin')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 transition-colors"
        >
          Return to Dashboard
        </button>
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

          {/* Custom Fields Section - Only show if there are custom fields with values */}
          {homestay.customFields?.definitions && homestay.customFields.definitions.length > 0 && (
            <InfoSection title="Additional Information" icon={FileText}>
              {homestay.customFields.definitions.map(field => {
                const fieldValue = homestay.customFields?.values?.[field.fieldId];
                if (fieldValue === undefined || fieldValue === null || fieldValue === '') return null;
                
                let displayValue: React.ReactNode = fieldValue;
                
                // Format value based on field type
                if (field.type === 'boolean') {
                  displayValue = fieldValue === true ? 'Yes' : 'No';
                } else if (field.type === 'date' && fieldValue) {
                  try {
                    displayValue = new Date(fieldValue).toLocaleDateString();
                  } catch (e) {
                    displayValue = fieldValue;
                  }
                }
                
                return (
                  <InfoItem 
                    key={field.fieldId} 
                    label={field.label} 
                    value={typeof displayValue === 'string' || typeof displayValue === 'number' ? displayValue : undefined}
                  >
                    {typeof displayValue !== 'string' && typeof displayValue !== 'number' ? displayValue : null}
                  </InfoItem>
                );
              })}
              
              {/* Show review status */}
              {homestay.customFields?.values?.lastUpdated && (
                <div className="mt-4 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-500">Last updated:</span>
                    <span className="ml-2 font-medium">
                      {new Date(homestay.customFields.values.lastUpdated).toLocaleString()}
                    </span>
                  </div>
                  {homestay.customFields.values.reviewed ? (
                    <div className="flex items-center text-green-600 mt-1">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span>Reviewed by {homestay.customFields.values.reviewedBy || 'Admin'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-600 mt-1">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>Pending review</span>
                    </div>
                  )}
                </div>
              )}
            </InfoSection>
          )}

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
                      {homestay.status !== 'approved' && hasPermission('homestayApproval') && (
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
                      
                      {homestay.status !== 'rejected' && hasPermission('homestayApproval') && (
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

          {/* Documents Section - Improved Layout with Upload Functionality */}
           <InfoSection title="Documents" icon={FileIcon}>
             {/* Document Upload Section - Only show if user has documentUpload permission */}
             {hasPermission('documentUpload') && (
             <div className="mb-6">
               <div className="flex justify-between items-center mb-3">
                 <h3 className="text-sm font-medium text-gray-700">Upload New Documents</h3>
                 {isUploading && (
                   <div className="flex items-center text-xs text-blue-600">
                     <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                     Uploading...
                   </div>
                 )}
               </div>
               
               {/* Document Upload Form */}
               <div className="space-y-4">
                 {documentItems.map((item, index) => (
                   <div 
                     key={item.id} 
                     className="p-4 border border-gray-200 rounded-lg relative"
                   >
                     {documentItems.length > 1 && (
                       <button
                         type="button"
                         onClick={() => removeDocumentItem(item.id)}
                         className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                         aria-label="Remove document"
                       >
                         <X size={16} />
                       </button>
                     )}
                     
                     <div className="mb-3">
                       <label htmlFor={`title-${item.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                         Document Title <span className="text-red-500">*</span>
                       </label>
                       <input
                         type="text"
                         id={`title-${item.id}`}
                         value={item.title}
                         onChange={(e) => updateDocumentItem(item.id, 'title', e.target.value)}
                         placeholder="e.g., Business Registration Certificate"
                         className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                         required
                       />
                     </div>
                     
                     <div className="mb-3">
                       <label htmlFor={`description-${item.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                         Document Description
                       </label>
                       <textarea
                         id={`description-${item.id}`}
                         value={item.description}
                         onChange={(e) => updateDocumentItem(item.id, 'description', e.target.value)}
                         placeholder="Briefly describe this document"
                         className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary h-16 resize-none"
                       />
                     </div>
                     
                     <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">
                         Upload Files <span className="text-red-500">*</span>
                       </label>
                       
                       <div 
                         onClick={() => fileInputRefs.current[index]?.click()}
                         className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       >
                         <input
                           type="file"
                           ref={(el) => {
                             if (el) fileInputRefs.current[index] = el;
                           }}
                           onChange={(e) => handleFileChange(item.id, e.target.files)}
                           className="hidden"
                           multiple
                           accept="*/*"
                         />
                         
                         {item.files.length === 0 ? (
                           <div className="flex flex-col items-center py-2">
                             <Upload className="h-8 w-8 text-gray-400 mb-1" />
                             <p className="text-xs text-gray-500">
                               Click to browse files
                             </p>
                           </div>
                         ) : (
                           <div className="flex flex-col items-center py-1">
                             <CheckCircle className="h-6 w-6 text-green-500 mb-1" />
                             <p className="text-xs font-medium text-gray-700">
                               {item.files.length} {item.files.length === 1 ? 'file' : 'files'} selected
                             </p>
                           </div>
                         )}
                       </div>
                     </div>
                     
                     {/* Selected Files List with Preview */}
                     {item.files.length > 0 && (
                       <div className="mt-3">
                         <h4 className="text-xs font-medium text-gray-700 mb-1">Selected Files:</h4>
                         <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                           {item.files.map((file, fileIndex) => (
                             <div 
                               key={fileIndex}
                               className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                             >
                               <div className="flex items-center">
                                 <span className="text-sm mr-2">{getFileIcon(file)}</span>
                                 <div>
                                   <p className="text-xs text-gray-700 font-medium truncate max-w-[180px]">
                                     {file.name}
                                   </p>
                                   <p className="text-[10px] text-gray-500">
                                     {(file.size / 1024 / 1024).toFixed(2)} MB
                                   </p>
                                 </div>
                               </div>
                               <div className="flex items-center gap-1">
                                 {canPreviewInBrowser(file) && (
                                   <button
                                     type="button"
                                     onClick={() => openPreview(file)}
                                     className="text-blue-500 hover:text-blue-700 p-1"
                                     aria-label="Preview file"
                                   >
                                     <Eye size={14} />
                                   </button>
                                 )}
                                 <button
                                   type="button"
                                   onClick={() => removeFile(item.id, fileIndex)}
                                   className="text-gray-400 hover:text-red-500 p-1"
                                   aria-label="Remove file"
                                 >
                                   <X size={14} />
                                 </button>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 ))}
                 
                 <div className="flex justify-between gap-2">
                   <button
                     type="button"
                     onClick={addDocumentItem}
                     className="flex items-center justify-center px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                     disabled={isUploading}
                   >
                     <Plus className="h-3 w-3 mr-1" />
                     Add Another Document
                   </button>
                   
                   <button
                     type="button"
                     onClick={handleUploadDocuments}
                     className="flex items-center justify-center px-4 py-1.5 bg-primary text-white rounded-md text-xs hover:bg-primary/90 transition-colors disabled:opacity-70"
                     disabled={isUploading}
                   >
                     {isUploading ? (
                       <>
                         <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                         Uploading...
                       </>
                     ) : (
                       <>
                         <Upload className="h-3 w-3 mr-1" />
                         Upload Documents
                       </>
                     )}
                   </button>
                 </div>
               </div>
             </div>
             )}

             {/* Existing Documents List */}
             <div className={`${hasPermission('documentUpload') ? 'border-t border-gray-200 pt-4 mt-4' : ''}`}>
               <h3 className="text-sm font-medium text-gray-700 mb-3">Uploaded Documents</h3>
             {homestay.documents && homestay.documents.length > 0 ? (
               <div className="space-y-4">
                 {homestay.documents.map((docGroup, index) => (
                     <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                       <div className="bg-gray-50 p-2 border-b border-gray-200 flex justify-between items-center">
                         <div>
                           <h4 className="text-sm font-medium text-gray-800">{docGroup.title}</h4>
                           {docGroup.description && <p className="text-xs text-gray-500">{docGroup.description}</p>}
                         </div>
                         {/* Only show delete button if user has documentUpload permission */}
                         {hasPermission('documentUpload') && (
                         <button 
                           onClick={() => handleDeleteDocument(index)}
                           className="p-1 text-red-500 hover:bg-red-50 rounded"
                           title="Delete document"
                         >
                           <X size={16} />
                         </button>
                         )}
                       </div>
                       <ul className="divide-y divide-gray-100">
                       {docGroup.files.map((file, fileIndex) => (
                           <li key={fileIndex} className="flex items-center justify-between p-2 hover:bg-gray-50">
                           <div className="flex items-center overflow-hidden mr-2">
                             <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-600 flex-shrink-0" />
                               <span className="truncate text-xs" title={file.originalName}>
                               {file.originalName} 
                             </span>
                               <span className="ml-1 text-xs text-gray-400 flex-shrink-0">
                                 ({(file.size / 1024).toFixed(1)} KB)
                               </span>
                           </div>
                             <div className="flex items-center gap-1">
                           <a 
                             href={getDocumentUrl(file.filePath)} 
                             target="_blank" 
                             rel="noopener noreferrer" 
                                 className="p-1 text-blue-600 hover:text-blue-800"
                                 title="View"
                           >
                             <ExternalLink className="h-3.5 w-3.5" />
                           </a>
                               <a 
                                 href={`${getDocumentUrl(file.filePath)}?download=true`}
                                 className="p-1 text-green-600 hover:text-green-800"
                                 title="Download"
                               >
                                 <Download className="h-3.5 w-3.5" />
                               </a>
                             </div>
                         </li>
                       ))}
                     </ul>
                   </div>
                 ))}
               </div>
             ) : (
                 <p className="text-xs text-gray-500 italic">No documents uploaded yet.</p>
               )}
             </div>
             
             {/* File Preview Modal */}
             {previewOpen && previewFile && (
               <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                    onClick={closePreview}>
                 <div className="relative bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                      onClick={e => e.stopPropagation()}>
                   {/* Modal Header */}
                   <div className="flex justify-between items-center p-3 border-b border-gray-200">
                     <h3 className="text-sm font-semibold text-gray-900 truncate max-w-[calc(100%-6rem)]">
                       {previewFile.file.name}
                     </h3>
                     <div className="flex items-center gap-1">
                       <a 
                         href={previewFile.url} 
                         download={previewFile.file.name}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="text-gray-500 hover:text-gray-700 p-1"
                         title="Download"
                       >
                         <Download size={16} />
                       </a>
                       <button
                         type="button"
                         onClick={closePreview}
                         className="text-gray-500 hover:text-gray-700 p-1"
                         title="Close"
                       >
                         <X size={16} />
                       </button>
                     </div>
                   </div>
                   
                   {/* Modal Body */}
                   <div className="flex-1 overflow-auto bg-gray-100 min-h-[300px]">
                     {previewFile.file.type.startsWith('image/') ? (
                       <div className="flex items-center justify-center h-full p-4">
                         <img
                           src={previewFile.url}
                           alt={previewFile.file.name}
                           className="max-w-full max-h-full object-contain"
                         />
                       </div>
                     ) : previewFile.file.type === 'application/pdf' ? (
                       <iframe
                         src={`${previewFile.url}#toolbar=1&navpanes=1`}
                         className="w-full h-[85vh]" 
                         title={previewFile.file.name}
                         style={{minHeight: "800px"}}
                       ></iframe>
                     ) : previewFile.file.type.startsWith('text/') ? (
                       <div className="p-4 h-full">
                         <div className="bg-white p-4 rounded border border-gray-200 h-full overflow-auto">
                           <pre className="whitespace-pre-wrap break-all text-sm">
                             Loading text content...
                           </pre>
                         </div>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                         <FileText className="h-16 w-16 text-gray-300 mb-4" />
                         <h4 className="text-sm font-medium text-gray-700 mb-2">Preview not available</h4>
                         <p className="text-xs text-gray-500 max-w-md">
                           This file type cannot be previewed in the browser.
                         </p>
                         <a
                           href={previewFile.url}
                           download={previewFile.file.name}
                           className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary/90 text-sm"
                         >
                           <Download size={14} />
                           Download File
                         </a>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             )}
             
             {/* Delete Confirmation Modal */}
             {deleteConfirmation.isOpen && (
               <div 
                 className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                 onClick={() => setDeleteConfirmation({isOpen: false, documentIndex: -1, isDeleting: false})}
               >
                 <div 
                   className="bg-white rounded-lg p-4 max-w-md w-full" 
                   onClick={e => e.stopPropagation()}
                 >
                   <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Document</h3>
                   <p className="text-sm text-gray-600 mb-4">
                     Are you sure you want to delete this document? This action cannot be undone.
                   </p>
                   <div className="flex justify-end gap-2">
                     <button
                       onClick={() => setDeleteConfirmation({isOpen: false, documentIndex: -1, isDeleting: false})}
                       className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-sm"
                       disabled={deleteConfirmation.isDeleting}
                     >
                       Cancel
                     </button>
                     <button
                       onClick={deleteDocument}
                       className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm flex items-center"
                       disabled={deleteConfirmation.isDeleting}
                     >
                       {deleteConfirmation.isDeleting ? (
                         <>
                           <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                           Deleting...
                         </>
                       ) : "Delete"}
                     </button>
                   </div>
                 </div>
               </div>
             )}
           </InfoSection>

          {/* Gallery Section */}
          <InfoSection title="Gallery Images" icon={ImageIcon}>
            <div className="space-y-6">
              {/* Gallery Image Upload - Only show if user has imageUpload permission */}
              {hasPermission('imageUpload') && (
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Upload Gallery Images</h3>
                
                <div className="flex flex-wrap gap-3 mb-4">
                  {/* Single Upload Button */}
                  <label className="h-20 w-20 rounded-md border-2 border-dashed border-gray-300 hover:border-primary flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-primary transition-all relative">
                    {uploadingImage ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Plus className="h-6 w-6" />
                    )}
                    <span className="text-xs mt-1">Add Image</span>
                    <input 
                      type="file" 
                      accept="image/jpeg, image/png, image/webp, image/gif"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleGalleryImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                  
                  {/* Multiple Upload Button */}
                  <button 
                    onClick={() => multipleImagesInputRef.current?.click()}
                    className="h-20 w-20 rounded-md border-2 border-dashed border-gray-300 hover:border-primary flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-primary transition-all relative"
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6" />
                    )}
                    <span className="text-xs mt-1">Bulk Upload</span>
                  </button>
                </div>
                
                {/* Hidden input for multiple files */}
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp, image/gif"
                  className="hidden" 
                  multiple
                  ref={multipleImagesInputRef}
                  onChange={handleMultipleImagesUpload}
                  disabled={uploadingImage}
                />
                
                <div className="text-xs text-gray-500">
                  <p>• Upload high-quality images to showcase the homestay</p>
                  <p>• Recommended size: 1200×800 pixels or larger</p>
                  <p>• Supported formats: JPEG, PNG, WebP, GIF</p>
                </div>
              </div>
              )}
              
              {/* Gallery Image Grid - Always visible */}
              <div className={`${hasPermission('imageUpload') ? 'border-t border-gray-200 pt-4' : ''}`}>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Gallery Images ({homestay?.galleryImages?.length || 0})</h3>
                
                {loading ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <Loader2 className="h-12 w-12 text-gray-300 mx-auto mb-3 animate-spin" />
                    <p className="text-gray-500 text-sm">Loading gallery images...</p>
                  </div>
                ) : homestay?.galleryImages && homestay.galleryImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {homestay.galleryImages.map((imagePath, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-100 relative">
                          <img
                            src={getImageUrl(imagePath)}
                            alt={`Gallery image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error("Failed to load gallery image:", imagePath);
                              e.currentTarget.src = '/images/placeholder-homestay.jpg';
                            }}
                          />
                          
                          {/* Image actions overlay */}
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-2">
                              <a 
                                href={getImageUrl(imagePath)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                                title="View full size"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                              {/* Only show delete button if user has imageUpload permission */}
                              {hasPermission('imageUpload') && (
                              <button
                                onClick={() => handleDeleteGalleryImage(imagePath)}
                                className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                                title="Delete image"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No gallery images uploaded yet.</p>
                    <p className="text-gray-400 text-xs mt-1">Upload images to showcase this homestay.</p>
                  </div>
                )}
              </div>
            </div>
          </InfoSection>

        </div>
      </div>
    </div>
  );
} 