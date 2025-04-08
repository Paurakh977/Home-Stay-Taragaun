"use client";

import { useState, useEffect, useCallback, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
// Remove the import from '@/types/homestay' if HomestayData is defined below
// import { HomestayData } from '@/types/homestay'; 
import { CheckCircle, XCircle, ArrowLeft, FileText, Loader2, ExternalLink, MapPin, Phone, User, Mail, Building, Globe, Image as ImageIcon, File as FileIcon, List } from 'lucide-react';

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
  email?: string;      // Keep email if it might exist
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

export default function AdminHomestayDetailPage({ params: paramsPromise }: PageProps) { 
  const resolvedParams = use(paramsPromise); 
  const { homestayId } = resolvedParams; 
  const router = useRouter();
  const [homestay, setHomestay] = useState<HomestayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [updateError, setUpdateError] = useState<string | null>(null);
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
    // Convert /uploads/ path to /api/images/ path
    return filePath.startsWith('/uploads/') 
      ? filePath.replace('/uploads/', '/api/images/')
      : filePath;
  };
  
  // formatAddress helper might not be needed if using direct fields
  // const formatAddress = (location?: LocationData | HomestayData['address']) => { ... }
  
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
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column ( Wider ) */}
        <div className="lg:col-span-2 space-y-6">
        
          {/* Overview Section - Accessing top-level fields */}
          <InfoSection title="Overview" icon={Building}>
             <InfoItem label="Homestay Name" value={homestay.homeStayName} />
             <InfoItem label="Homestay ID" value={homestay.homestayId} />
             <InfoItem label="DHSR No." value={homestay.dhsrNo} />
             <InfoItem label="Type" value={homestay.homeStayType?.charAt(0).toUpperCase() + homestay.homeStayType?.slice(1)} />
             <InfoItem label="Description" value={homestay.description} />
             <InfoItem label="Capacity">
               {homestay.homeCount || 0} Homes / {homestay.roomCount || 0} Rooms / {homestay.bedCount || 0} Beds
             </InfoItem>
          </InfoSection>

          {/* Location Section - Accessing top-level address object and villageName */}
          <InfoSection title="Location Details" icon={MapPin}>
             <InfoItem label="Province" value={homestay.address?.province?.ne || homestay.address?.province?.en} />
             <InfoItem label="District" value={homestay.address?.district?.ne || homestay.address?.district?.en} />
             <InfoItem label="Municipality" value={homestay.address?.municipality?.ne || homestay.address?.municipality?.en} />
             <InfoItem label="Ward No." value={homestay.address?.ward?.ne || homestay.address?.ward?.en} />
             <InfoItem label="City" value={homestay.address?.city} />
             <InfoItem label="Tole" value={homestay.address?.tole} />
             <InfoItem label="Village Name" value={homestay.villageName} /> 
             <InfoItem label="Full Address (EN)" value={homestay.address?.formattedAddress?.en} />
             <InfoItem label="Full Address (NE)" value={homestay.address?.formattedAddress?.ne} />
             <InfoItem label="Coordinates" value={null} /> {/* Data not available */}
             <InfoItem label="Map Link" value={null} />    {/* Data not available */}
          </InfoSection>
          
          {/* Contact Person Section - Accessing contacts array with correct fields */}
           <InfoSection title="Contact Person" icon={User}>
             <InfoItem label="Name" value={primaryApiContact?.name || homestay.ownerName} />
             <InfoItem label="Phone" value={primaryApiContact?.mobile || homestay.ownerContact || homestay.phone} /> 
             <InfoItem label="Email" value={primaryApiContact?.email} />
             <InfoItem label="Website">
                {primaryApiContact?.website ? (
                    <a href={primaryApiContact.website.startsWith('http') ? primaryApiContact.website : `http://${primaryApiContact.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                    {primaryApiContact.website} <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                ) : null /* Display nothing instead of N/A */}
             </InfoItem>
           </InfoSection>

          {/* Officials Section - Accessing officials array with correct fields */}
          {homestay.officials && homestay.officials.length > 0 && (
            <InfoSection title="Committee Officials" icon={User}>
              <div className="space-y-3">
                {homestay.officials.map((official, index) => (
                  <div key={official._id || index} className="border-b border-gray-100 pb-2 last:border-b-0">
                     <InfoItem label="Name" value={official.name} />
                     <InfoItem label="Position" value={official.role} />
                     <InfoItem label="Contact" value={official.contactNo} />
                     <InfoItem label="Email" value={official.email} />
                  </div>
                ))}
              </div>
            </InfoSection>
          )}
          
           {/* Features Section - No changes needed here */}
           {homestay.features && (Object.values(homestay.features).some(arr => arr && arr.length > 0)) && (
             <InfoSection title="Features & Services" icon={List}>
                {homestay.features.localAttractions && homestay.features.localAttractions.length > 0 && (
                    <InfoItem label="Attractions">
                        <ul className="list-disc list-inside space-y-1">
                            {homestay.features.localAttractions.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </InfoItem>
                )}
                {homestay.features.tourismServices && homestay.features.tourismServices.length > 0 && (
                    <InfoItem label="Services">
                        <ul className="list-disc list-inside space-y-1">
                            {homestay.features.tourismServices.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </InfoItem>
                )}
                 {homestay.features.infrastructure && homestay.features.infrastructure.length > 0 && (
                    <InfoItem label="Infrastructure">
                        <ul className="list-disc list-inside space-y-1">
                            {homestay.features.infrastructure.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </InfoItem>
                )}
             </InfoSection>
           )}

        </div>
        
        {/* Right Column (Narrower) */}
        <div className="lg:col-span-1 space-y-6">
      
      {/* Action Buttons */}
           <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
                <h3 className="text-md font-medium text-gray-800 mb-3">Actions</h3>
                <div className="flex flex-col space-y-3">
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
                    
                    {/* Removed the impossible condition and placeholders */}

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