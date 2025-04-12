"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Edit } from "lucide-react";
import { toast } from "sonner";

// Components for each section
import GeneralInfoSection from "./components/GeneralInfoSection";
import LocationSection from "./components/LocationSection";
import FeaturesSection from "./components/FeaturesSection";
import ContactsSection from "./components/ContactsSection";

interface UserInfo {
  homestayId: string;
  homeStayName: string;
}

interface HomeStayData {
  _id: string;
  homestayId: string;
  homeStayName: string;
  villageName: string;
  homeCount: number;
  roomCount: number;
  bedCount: number;
  homeStayType: string;
  directions: string;
  address: {
    province: { en: string; ne: string };
    district: { en: string; ne: string };
    municipality: { en: string; ne: string };
    ward: { en: string; ne: string };
    city: string;
    tole: string;
    formattedAddress: { en: string; ne: string };
  };
  features: {
    localAttractions: string[];
    tourismServices: string[];
    infrastructure: string[];
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ContactInfo {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  facebook?: string;
  youtube?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
}

interface OfficialInfo {
  _id: string;
  name: string;
  role: string;
  contactNo: string;
}

interface UpdateInfoPageProps {
  adminUsername?: string;
}

export default function UpdateInfoPage({ adminUsername }: UpdateInfoPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [homeStay, setHomeStay] = useState<HomeStayData | null>(null);
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [officials, setOfficials] = useState<OfficialInfo[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  
  const router = useRouter();
  
  // Load user data and fetch homestay information
  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        fetchHomestayData(userData.homestayId);
      } catch (err) {
        console.error("Error parsing user data:", err);
        router.push(adminUsername ? `/${adminUsername}/login` : "/login");
      }
    } else {
      router.push(adminUsername ? `/${adminUsername}/login` : "/login");
    }
  }, [router, adminUsername]);
  
  // Fetch homestay data from API
  const fetchHomestayData = async (homestayId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const apiUrl = adminUsername 
        ? `/api/homestays/${homestayId}?adminUsername=${adminUsername}` 
        : `/api/homestays/${homestayId}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch homestay data');
      }
      
      const data = await response.json();
      
      setHomeStay(data.homestay);
      setContacts(data.contacts || []);
      setOfficials(data.officials || []);
      
      // Update edited data with current values
      setEditedData({
        homeStayName: data.homestay.homeStayName,
        villageName: data.homestay.villageName,
        homeCount: data.homestay.homeCount,
        roomCount: data.homestay.roomCount,
        bedCount: data.homestay.bedCount,
        homeStayType: data.homestay.homeStayType,
        directions: data.homestay.directions || "",
        province: data.homestay.address.province,
        district: data.homestay.address.district,
        municipality: data.homestay.address.municipality,
        ward: data.homestay.address.ward,
        city: data.homestay.address.city,
        tole: data.homestay.address.tole,
        localAttractions: data.homestay.features?.localAttractions || [],
        tourismServices: data.homestay.features?.tourismServices || [],
        infrastructure: data.homestay.features?.infrastructure || [],
        contacts: data.contacts || [],
        officials: data.officials || []
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching homestay data:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update edited data
  const updateFormData = (data: any) => {
    setEditedData((prev: any) => ({ ...prev, ...data }));
  };
  
  // Save changes to the database
  const saveChanges = async () => {
    if (!homeStay) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Prepare update data - only includes fields that are different from the original
      const updateData: any = {};
      
      // General info fields
      if (editedData.homeStayName !== homeStay.homeStayName) {
        updateData.homeStayName = editedData.homeStayName;
      }
      
      if (editedData.villageName !== homeStay.villageName) {
        updateData.villageName = editedData.villageName;
      }
      
      if (editedData.homeCount !== homeStay.homeCount) {
        updateData.homeCount = editedData.homeCount;
      }
      
      if (editedData.roomCount !== homeStay.roomCount) {
        updateData.roomCount = editedData.roomCount;
      }
      
      if (editedData.bedCount !== homeStay.bedCount) {
        updateData.bedCount = editedData.bedCount;
      }
      
      if (editedData.homeStayType !== homeStay.homeStayType) {
        updateData.homeStayType = editedData.homeStayType;
      }
      
      if (editedData.directions !== homeStay.directions) {
        updateData.directions = editedData.directions;
      }
      
      // Address fields - only include if they're different
      const addressFieldsChanged = 
        JSON.stringify(editedData.province) !== JSON.stringify(homeStay.address.province) ||
        JSON.stringify(editedData.district) !== JSON.stringify(homeStay.address.district) ||
        JSON.stringify(editedData.municipality) !== JSON.stringify(homeStay.address.municipality) ||
        JSON.stringify(editedData.ward) !== JSON.stringify(homeStay.address.ward) ||
        editedData.city !== homeStay.address.city ||
        editedData.tole !== homeStay.address.tole;
      
      if (addressFieldsChanged) {
        updateData.address = {
          province: editedData.province,
          district: editedData.district,
          municipality: editedData.municipality,
          ward: editedData.ward,
          city: editedData.city,
          tole: editedData.tole
        };
      }
      
      // Features fields
      const featuresChanged = 
        JSON.stringify(editedData.localAttractions) !== JSON.stringify(homeStay.features.localAttractions) ||
        JSON.stringify(editedData.tourismServices) !== JSON.stringify(homeStay.features.tourismServices) ||
        JSON.stringify(editedData.infrastructure) !== JSON.stringify(homeStay.features.infrastructure);
      
      if (featuresChanged) {
        updateData.localAttractions = editedData.localAttractions;
        updateData.tourismServices = editedData.tourismServices;
        updateData.infrastructure = editedData.infrastructure;
      }
      
      // Always include contacts and officials if editing
      if (isEditing) {
        updateData.contacts = editedData.contacts;
        updateData.officials = editedData.officials;
      }
      
      console.log("Sending update:", updateData);
      
      // Send update to API
      const updateUrl = adminUsername 
        ? `/api/homestays/${homeStay.homestayId}?adminUsername=${adminUsername}`
        : `/api/homestays/${homeStay.homestayId}`;
        
      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error("API error response:", responseData);
        throw new Error(responseData.error || 'Failed to update homestay information');
      }
      
      // Update local state with API response
      setHomeStay(responseData.homestay);
      setContacts(responseData.contacts || []);
      setOfficials(responseData.officials || []);
      
      // Reset edited data
      setEditedData({
        homeStayName: responseData.homestay.homeStayName,
        villageName: responseData.homestay.villageName,
        homeCount: responseData.homestay.homeCount,
        roomCount: responseData.homestay.roomCount,
        bedCount: responseData.homestay.bedCount,
        homeStayType: responseData.homestay.homeStayType,
        directions: responseData.homestay.directions || "",
        province: responseData.homestay.address.province,
        district: responseData.homestay.address.district,
        municipality: responseData.homestay.address.municipality,
        ward: responseData.homestay.address.ward,
        city: responseData.homestay.address.city,
        tole: responseData.homestay.address.tole,
        localAttractions: responseData.homestay.features?.localAttractions || [],
        tourismServices: responseData.homestay.features?.tourismServices || [],
        infrastructure: responseData.homestay.features?.infrastructure || [],
        contacts: responseData.contacts || [],
        officials: responseData.officials || []
      });
      
      setIsEditing(false);
      toast.success("Homestay information updated successfully");
      
    } catch (err) {
      console.error("Update error:", err);
      setError(err instanceof Error ? err.message : 'Failed to update homestay information');
      toast.error(err instanceof Error ? err.message : "Failed to update homestay information");
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error || !homeStay) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div>
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-sm text-red-700">{error || "Failed to load homestay data"}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Update Information</h1>
          <p className="text-gray-600">Update your homestay details and settings</p>
        </div>
        
        <div>
          {isEditing ? (
            <div className="flex space-x-3">
              <button 
                onClick={() => setIsEditing(false)} 
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                onClick={saveChanges} 
                className="px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-dark flex items-center"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Save Changes</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditing(true)} 
              className="px-3 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200 flex items-center"
              aria-label="Edit Information"
            >
              <Edit className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Edit Information</span>
              <span className="sm:hidden">Edit</span>
            </button>
          )}
        </div>
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
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-none">
            <TabsTrigger value="general" className="py-3">General Info</TabsTrigger>
            <TabsTrigger value="location" className="py-3">Location</TabsTrigger>
            <TabsTrigger value="features" className="py-3">Features</TabsTrigger>
            <TabsTrigger value="contacts" className="py-3">Contacts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="p-6">
            <GeneralInfoSection 
              formData={editedData} 
              updateFormData={updateFormData} 
              isEditing={isEditing}
            />
          </TabsContent>
          
          <TabsContent value="location" className="p-6">
            <LocationSection 
              formData={editedData} 
              updateFormData={updateFormData} 
              isEditing={isEditing}
            />
          </TabsContent>
          
          <TabsContent value="features" className="p-6">
            <FeaturesSection 
              formData={editedData} 
              updateFormData={updateFormData} 
              isEditing={isEditing}
            />
          </TabsContent>
          
          <TabsContent value="contacts" className="p-6">
            <ContactsSection 
              formData={editedData} 
              updateFormData={updateFormData} 
              isEditing={isEditing}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 