"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { User, Upload, MapPin, Home, Phone, Mail, Edit, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface UserInfo {
  homestayId: string;
  homeStayName: string;
}

interface ContactInfo {
  _id: string;
  name: string;
  mobile: string;
  email: string;
  facebook?: string;
  youtube?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
}

interface ProfileData {
  homestayId: string;
  homeStayName: string;
  villageName: string;
  homeCount: number;
  roomCount: number;
  bedCount: number;
  homeStayType: string;
  status: string;
  address: {
    province: { en: string; ne: string };
    district: { en: string; ne: string };
    municipality: { en: string; ne: string };
    ward: { en: string; ne: string };
    city: string;
    tole: string;
    formattedAddress: { en: string; ne: string };
  };
  contacts: ContactInfo[];
  profileImage: string | null;
}

// Helper function to generate initials
const getInitials = (name: string): string => {
  if (!name) return "?";
  const words = name.split(' ').filter(Boolean);
  if (words.length === 0) return "?";
  // Use first letter of the first word and first letter of the last word
  const firstInitial = words[0].charAt(0);
  const lastInitial = words.length > 1 ? words[words.length - 1].charAt(0) : '';
  return (firstInitial + lastInitial).toUpperCase();
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ProfileData>>({});
  
  const router = useRouter();
  
  // Load user data and fetch profile information
  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        setUser(userData);
        
        // Fetch the homestay data
        fetchHomestayData(userData.homestayId);
      } catch (err) {
        console.error("Error parsing user data:", err);
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);
  
  // Fetch homestay data from API
  const fetchHomestayData = async (homestayId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/homestays/${homestayId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch homestay data');
      }
      
      const data = await response.json();
      
      // Transform data for our profile view
      const formattedData: ProfileData = {
        homestayId: data.homestay.homestayId,
        homeStayName: data.homestay.homeStayName,
        villageName: data.homestay.villageName,
        homeCount: data.homestay.homeCount,
        roomCount: data.homestay.roomCount,
        bedCount: data.homestay.bedCount,
        homeStayType: data.homestay.homeStayType,
        status: data.homestay.status,
        address: data.homestay.address,
        contacts: data.contacts || [],
        profileImage: data.homestay.profileImage || null
      };
      
      setProfileData(formattedData);
      setProfileImage(data.homestay.profileImage || null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching homestay data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle profile image upload
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }
    
    // Show a temporary preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfileImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    
    try {
      // Upload the image to the server
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(`/api/homestays/${user.homestayId}/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }
      
      const data = await response.json();
      
      // Update the profile data with the new image URL
      if (profileData) {
        setProfileData({
          ...profileData,
          profileImage: data.imageUrl
        });
        setProfileImage(data.imageUrl);
      }
      
      toast.success("Profile image updated successfully!");
      
    } catch (err) {
      console.error("Image upload error:", err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
      
      // Revert to previous image if there was an error
      if (profileData) {
        setProfileImage(profileData.profileImage);
      }
    }
  };
  
  // Handle form input change
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData({ ...editedData, [name]: value });
  };
  
  // Handle contact info change
  const handleContactChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const { name, value } = e.target;
    
    if (!profileData) return;
    
    const updatedContacts = [...profileData.contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [name]: value
    };
    
    setEditedData({
      ...editedData,
      contacts: updatedContacts
    });
  };
  
  // Save profile changes
  const saveChanges = async () => {
    if (!profileData || !user) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Prepare data for update
      const updateData = {
        homeStayName: editedData.homeStayName || profileData.homeStayName,
        villageName: editedData.villageName || profileData.villageName,
        homeCount: profileData.homeCount,
        roomCount: profileData.roomCount,
        bedCount: profileData.bedCount,
        homeStayType: profileData.homeStayType,
        contacts: editedData.contacts || profileData.contacts
      };
      
      console.log("Sending update:", updateData);
      
      // Send update to API
      const response = await fetch(`/api/homestays/${user.homestayId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error("API error response:", responseData);
        throw new Error(responseData.error || 'Failed to update profile');
      }
      
      // Update local state with new data
      setProfileData({
        ...profileData,
        ...editedData,
      });
      
      // Reset edited data
      setEditedData({});
      setIsEditing(false);
      toast.success("Profile updated successfully!");
      
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Get primary contact (first one in the list)
  const getPrimaryContact = () => {
    if (!profileData || !profileData.contacts || profileData.contacts.length === 0) {
      return { name: '', mobile: '', email: '' };
    }
    return profileData.contacts[0];
  };
  
  // Function to render profile image or placeholder
  const renderProfileImage = () => {
    const sizeClasses = "h-24 w-24 md:h-32 md:w-32";
    const initialsSizeClasses = "text-4xl md:text-5xl";

    const currentImage = profileImage;
    const currentName = profileData?.homeStayName || user?.homeStayName || "";

    // Check for valid, non-empty string path 
    if (currentImage && typeof currentImage === 'string' && currentImage.trim() !== '') {
       // Handle potential data URL separately (from temporary preview)
      if (currentImage.startsWith('data:image')) {
          console.log("[Profile] Rendering image preview (data URL)");
          return (
            <img
              src={currentImage}
              alt="Profile Preview"
              className={`rounded-full ${sizeClasses} object-cover`}
            />
          );
      }
      // It's an uploaded path, use the API route
      // Convert /uploads/[...] path to /api/images/[...] path
      const apiUrl = currentImage.replace('/uploads/', '/api/images/') + `?t=${new Date().getTime()}`;
      console.log("[Profile] Rendering profile image via API src:", apiUrl);
      return (
        <img 
          src={apiUrl} 
          alt={currentName} 
          className={`rounded-full ${sizeClasses} object-cover`}
          onError={(e) => {
            console.warn(`[Profile] Failed to load profile image via API: ${apiUrl}`);
            // Fallback logic remains
            const target = e.currentTarget;
            const parent = target.parentElement;
            if (parent) {
              const initials = getInitials(currentName);
              const placeholder = document.createElement('div');
              placeholder.className = `rounded-full ${sizeClasses} bg-gray-100 flex items-center justify-center text-gray-400 font-semibold ${initialsSizeClasses}`;
              placeholder.textContent = initials;
              parent.replaceChild(placeholder, target);
            }
          }}
        />
      );
    } else {
      // Render initials placeholder if no valid image or preview
      console.log("[Profile] Rendering initials, profileImage was:", profileImage);
      const initials = getInitials(currentName);
      return (
        <div className={`rounded-full ${sizeClasses} bg-gray-100 flex items-center justify-center text-gray-400 font-semibold ${initialsSizeClasses}`}>
          {initials}
        </div>
      );
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!profileData) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div>
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-sm text-red-700">{error || "Failed to load profile data"}</p>
          </div>
        </div>
      </div>
    );
  }
  
  const primaryContact = getPrimaryContact();
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your homestay profile information</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div>
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Profile Header/Banner */}
        <div className="h-32 bg-gradient-to-r from-primary to-blue-600"></div>
        
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-start">
          {/* Profile Image */}
          <div className="-mt-16 md:-mt-20 mb-4 md:mb-0 flex-shrink-0 relative">
            <div className="rounded-full h-24 w-24 md:h-32 md:w-32 bg-white p-1 shadow-md overflow-hidden">
              {renderProfileImage()}
            </div>
            
            {/* Only show image upload button when editing */}
            {isEditing && (
              <label htmlFor="profile-image" className="absolute bottom-0 right-0 p-2 rounded-full cursor-pointer shadow-md bg-primary text-white hover:bg-primary-dark">
                <Upload className="h-4 w-4" />
                <input 
                  id="profile-image" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>
          
          {/* Profile Info */}
          <div className="md:ml-6 flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditing 
                    ? <input 
                        type="text" 
                        name="homeStayName" 
                        value={editedData.homeStayName || profileData.homeStayName} 
                        onChange={handleInputChange}
                        className="border-b border-gray-300 focus:border-primary outline-none bg-transparent"
                      />
                    : profileData.homeStayName
                  }
                </h2>
                <p className="text-gray-600 flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {profileData.address.formattedAddress.en}
                </p>
              </div>
              
              <div className="mt-4 md:mt-0">
                {isEditing ? (
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setIsEditing(false)} 
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={saveChanges} 
                      className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-dark flex items-center"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="flex items-center px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <Home className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium mr-2">Homestay ID:</span>
                <span>{profileData.homestayId}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium mr-2">Phone:</span>
                {isEditing && profileData.contacts.length > 0
                  ? <input 
                      type="text" 
                      name="mobile" 
                      value={editedData.contacts?.[0]?.mobile || primaryContact.mobile} 
                      onChange={(e) => handleContactChange(e, 0)}
                      className="border-b border-gray-300 focus:border-primary outline-none bg-transparent text-sm"
                    />
                  : primaryContact.mobile
                }
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium mr-2">Email:</span>
                {isEditing && profileData.contacts.length > 0
                  ? <input 
                      type="email" 
                      name="email" 
                      value={editedData.contacts?.[0]?.email || primaryContact.email} 
                      onChange={(e) => handleContactChange(e, 0)}
                      className="border-b border-gray-300 focus:border-primary outline-none bg-transparent text-sm"
                    />
                  : primaryContact.email || "Not provided"
                }
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium mr-2">Village:</span>
                {isEditing
                  ? <input 
                      type="text" 
                      name="villageName" 
                      value={editedData.villageName || profileData.villageName} 
                      onChange={handleInputChange}
                      className="border-b border-gray-300 focus:border-primary outline-none bg-transparent text-sm"
                    />
                  : profileData.villageName
                }
              </div>
            </div>
            
            {/* Homestay Details */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Homestay Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="px-4 py-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-sm font-medium">
                    {profileData.homeStayType === 'community' ? 'Community Homestay' : 'Private Homestay'}
                  </p>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-500">Homes</p>
                  <p className="text-sm font-medium">{profileData.homeCount}</p>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-500">Rooms</p>
                  <p className="text-sm font-medium">{profileData.roomCount}</p>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-500">Beds</p>
                  <p className="text-sm font-medium">{profileData.bedCount}</p>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className={`text-sm font-medium ${
                    profileData.status === 'approved' 
                      ? 'text-green-600' 
                      : profileData.status === 'pending' 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                  }`}>
                    {profileData.status.charAt(0).toUpperCase() + profileData.status.slice(1)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Address Information */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Address Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <div className="min-w-32 text-sm font-medium text-gray-500">Province:</div>
                  <div className="text-sm text-gray-900">{profileData.address.province.en} ({profileData.address.province.ne})</div>
                </div>
                
                <div className="flex items-start">
                  <div className="min-w-32 text-sm font-medium text-gray-500">District:</div>
                  <div className="text-sm text-gray-900">{profileData.address.district.en} ({profileData.address.district.ne})</div>
                </div>
                
                <div className="flex items-start">
                  <div className="min-w-32 text-sm font-medium text-gray-500">Municipality:</div>
                  <div className="text-sm text-gray-900">{profileData.address.municipality.en} ({profileData.address.municipality.ne})</div>
                </div>
                
                <div className="flex items-start">
                  <div className="min-w-32 text-sm font-medium text-gray-500">Ward:</div>
                  <div className="text-sm text-gray-900">{profileData.address.ward.en} ({profileData.address.ward.ne})</div>
                </div>
                
                <div className="flex items-start">
                  <div className="min-w-32 text-sm font-medium text-gray-500">City:</div>
                  <div className="text-sm text-gray-900">{profileData.address.city}</div>
                </div>
                
                <div className="flex items-start">
                  <div className="min-w-32 text-sm font-medium text-gray-500">Tole:</div>
                  <div className="text-sm text-gray-900">{profileData.address.tole}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 