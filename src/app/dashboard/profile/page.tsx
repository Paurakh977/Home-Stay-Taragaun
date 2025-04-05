"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { User, Upload, MapPin, Home, Phone, Mail, Edit } from "lucide-react";

interface UserInfo {
  homestayId: string;
  homeStayName: string;
}

interface ProfileData {
  homestayId: string;
  homeStayName: string;
  location: string;
  email: string;
  phone: string;
  bio: string;
  image: string | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    homestayId: "",
    homeStayName: "",
    location: "Pokhara, Nepal",
    email: "contact@homestay.com",
    phone: "+977 9812345678",
    bio: "Welcome to our beautiful homestay! We offer authentic Nepali hospitality and stunning mountain views.",
    image: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ProfileData>>({});
  
  const router = useRouter();
  
  // Load user data from localStorage
  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        setUser(userData);
        setProfileData(prev => ({
          ...prev,
          homestayId: userData.homestayId,
          homeStayName: userData.homeStayName
        }));
        
        // In a real app, we would fetch profile data from API
        // For now, we'll simulate data loading
        setLoading(false);
      } catch (err) {
        console.error("Error parsing user data:", err);
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);
  
  // Handle profile image upload
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfileImage(event.target.result as string);
        setEditedData({ ...editedData, image: event.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Handle form input change
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData({ ...editedData, [name]: value });
  };
  
  // Save profile changes
  const saveChanges = () => {
    setProfileData({ ...profileData, ...editedData });
    
    // In a real app, we would send this data to the server
    // For now, just simulate saving
    setTimeout(() => {
      setIsEditing(false);
      setError(null);
      
      // Save profile image to localStorage for persistence in demo
      if (editedData.image) {
        localStorage.setItem("profileImage", editedData.image as string);
      }
    }, 500);
  };
  
  // Load profile image from localStorage (for demo persistence)
  useEffect(() => {
    const savedImage = localStorage.getItem("profileImage");
    if (savedImage) {
      setProfileImage(savedImage);
      setProfileData(prev => ({ ...prev, image: savedImage }));
    }
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
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
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="rounded-full h-full w-full object-cover"
                />
              ) : (
                <div className="rounded-full h-full w-full bg-gray-100 flex items-center justify-center">
                  <User className="h-12 w-12 md:h-16 md:w-16 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Image upload button */}
            <label htmlFor="profile-image" className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-primary-dark">
              <Upload className="h-4 w-4" />
              <input 
                id="profile-image" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
              />
            </label>
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
                  {isEditing 
                    ? <input 
                        type="text" 
                        name="location" 
                        value={editedData.location || profileData.location} 
                        onChange={handleInputChange}
                        className="border-b border-gray-300 focus:border-primary outline-none bg-transparent text-sm"
                      />
                    : profileData.location
                  }
                </p>
              </div>
              
              <div className="mt-4 md:mt-0">
                {isEditing ? (
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setIsEditing(false)} 
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={saveChanges} 
                      className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-dark"
                    >
                      Save
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
                {isEditing 
                  ? <input 
                      type="text" 
                      name="phone" 
                      value={editedData.phone || profileData.phone} 
                      onChange={handleInputChange}
                      className="border-b border-gray-300 focus:border-primary outline-none bg-transparent"
                    />
                  : profileData.phone
                }
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium mr-2">Email:</span>
                {isEditing 
                  ? <input 
                      type="email" 
                      name="email" 
                      value={editedData.email || profileData.email} 
                      onChange={handleInputChange}
                      className="border-b border-gray-300 focus:border-primary outline-none bg-transparent"
                    />
                  : profileData.email
                }
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-md font-medium text-gray-900 mb-2">Bio</h3>
              {isEditing ? (
                <textarea 
                  name="bio" 
                  value={editedData.bio || profileData.bio} 
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                ></textarea>
              ) : (
                <p className="text-gray-600 whitespace-pre-wrap">{profileData.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 