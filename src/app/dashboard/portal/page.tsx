"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon, X, Plus, Camera, Save, Eye, ChevronLeft, ChevronRight, Trash2, Edit3, User, Loader2, Users, MessageSquare, Info, MapPin, HelpCircle, Check, FileText, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Textarea
} from "@/components/ui/textarea";
import {
  Button
} from "@/components/ui/button";
import {
  Label
} from "@/components/ui/label";
import {
  Input
} from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface UserInfo {
  homestayId: string;
  homeStayName: string;
}

interface TeamMember {
  name: string;
  position: string;
  contactNo?: string;
  photoPath: string;
  bio: string;
  order: number;
}

interface Testimonial {
  name: string;
  location: string;
  rating: number;
  quote: string;
  photoPath: string;
  date: string | Date;
}

interface Destination {
  name: string;
  description: string;
  distance: string;
  image: string;
  category: string;
  highlights: string[];
}

interface FaqItem {
  question: string;
  answer: string;
}

interface PageContent {
  aboutPage?: {
    title?: string;
    subtitle?: string;
    description?: string;
    mission?: string;
    vision?: string;
    backgroundImage?: string;
    highlightPoints?: string[];
  };
  contactPage?: {
    title?: string;
    subtitle?: string;
    backgroundImage?: string;
    formTitle?: string;
    mapEmbedUrl?: string;
    faq?: FaqItem[];
  };
  heroSection?: {
    slogan?: string;
    welcomeMessage?: string;
  };
  whyChooseUs?: string[];
}

interface HomestayData {
  _id: string;
  homestayId: string;
  homeStayName: string;
  villageName: string;
  homeCount: number;
  roomCount: number;
  bedCount: number;
  homeStayType: string;
  profileImage: string | null;
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
  galleryImages?: string[];
  description?: string;
  dhsrNo?: string;
  featureAccess?: {
    dashboard?: boolean;
    profile?: boolean;
    portal?: boolean;
    documents?: boolean;
    imageUpload?: boolean;
    settings?: boolean;
    chat?: boolean;
    updateInfo?: boolean;
  };
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
  teamMembers?: TeamMember[];
  testimonials?: Testimonial[];
  destinations?: Destination[];
  pageContent?: PageContent;
}

interface PortalPageProps {
  adminUsername?: string;
}

const getInitials = (name: string): string => {
  if (!name) return "?";
  const words = name.split(' ').filter(Boolean);
  if (words.length === 0) return "?";
  const firstInitial = words[0].charAt(0);
  const lastInitial = words.length > 1 ? words[words.length - 1].charAt(0) : '';
  return (firstInitial + lastInitial).toUpperCase();
};

export default function PortalPage({ adminUsername }: PortalPageProps) {
  const [activeTab, setActiveTab] = useState("gallery");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [homestay, setHomestay] = useState<HomestayData | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [description, setDescription] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [autoSlide, setAutoSlide] = useState(true);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const sliderInterval = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [pageContent, setPageContent] = useState<PageContent>({});

  const [uploadingTestimonialImage, setUploadingTestimonialImage] = useState(false);
  const [uploadingTeamMemberImage, setUploadingTeamMemberImage] = useState(false);
  const [uploadingAboutImage, setUploadingAboutImage] = useState(false);
  const [uploadingContactImage, setUploadingContactImage] = useState(false);
  const [uploadingDestinationImage, setUploadingDestinationImage] = useState(false);

  const [isEditingTeamMember, setIsEditingTeamMember] = useState<number | null>(null);
  const [isEditingTestimonial, setIsEditingTestimonial] = useState<number | null>(null);
  const [isEditingDestination, setIsEditingDestination] = useState<number | null>(null);
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  
  const [customFieldValues, setCustomFieldValues] = useState<{[fieldId: string]: any}>({});
  const [savingCustomFields, setSavingCustomFields] = useState(false);
  const [customFieldsChanged, setCustomFieldsChanged] = useState(false);

  // Default empty team member for adding new ones
  const emptyTeamMember: TeamMember = {
    name: "",
    position: "",
    bio: "",
    photoPath: "",
    order: 0
  };

  // Default empty testimonial for adding new ones
  const emptyTestimonial: Testimonial = {
    name: "",
    location: "",
    rating: 5,
    quote: "",
    photoPath: "",
    date: new Date().toISOString()
  };

  // Default empty destination for adding new ones
  const emptyDestination: Destination = {
    name: "",
    description: "",
    distance: "",
    image: "",
    category: "cultural",
    highlights: []
  };

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        setUser(userData);
        fetchHomestayData(userData.homestayId);
      } catch (err) {
        console.error("Error parsing user data:", err);
        localStorage.removeItem("user");
        router.push(adminUsername ? `/${adminUsername}/login` : "/login");
      }
    } else {
      router.push(adminUsername ? `/${adminUsername}/login` : "/login");
    }
  }, [router, adminUsername]);

  const fetchHomestayData = async (homestayId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/homestays/${homestayId}?adminUsername=${adminUsername || ''}`);
      
      if (!response.ok) throw new Error('Failed to fetch homestay data');
      
      const data = await response.json();
      setHomestay(data.homestay);
      
      setDescription(data.homestay.description || "");
      
      setGalleryImages(data.homestay.galleryImages || []);
      
      // Initialize team members
      setTeamMembers(data.homestay.teamMembers || []);
      
      // Initialize testimonials
      setTestimonials(data.homestay.testimonials || []);
      
      // Initialize destinations
      setDestinations(data.homestay.destinations || []);
      
      // Initialize pageContent
      setPageContent(data.homestay.pageContent || {
        heroSection: {
          slogan: "",
          welcomeMessage: ""
        },
        aboutPage: {
          title: "",
          subtitle: "",
          description: "",
          mission: "",
          vision: "",
          backgroundImage: "",
          highlightPoints: []
        },
        contactPage: {
          title: "",
          subtitle: "",
          backgroundImage: "",
          formTitle: "",
          mapEmbedUrl: "",
          faq: []
        },
        whyChooseUs: []
      });
      
      // Initialize custom fields values if they exist
      if (data.homestay.customFields?.values) {
        setCustomFieldValues(data.homestay.customFields.values);
      }
      
    } catch (err) {
      console.error('Error fetching homestay data:', err);
    } finally {
      setLoading(false);
    }
  };

  const validGalleryImages = galleryImages.filter(img => typeof img === 'string' && img.trim() !== '');

  const currentSlideIndex = validGalleryImages.length > 0 ? currentSlide % validGalleryImages.length : 0;
  const currentImageSrc = validGalleryImages.length > 0 ? validGalleryImages[currentSlideIndex] : null;

  useEffect(() => {
    // Clear any existing interval first
    if (sliderInterval.current) {
      clearInterval(sliderInterval.current);
      sliderInterval.current = null;
    }
    
    // Only set interval if we have multiple images and auto-slide is enabled
    if (validGalleryImages.length > 1 && autoSlide) {
      sliderInterval.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % validGalleryImages.length);
      }, 5000);
    }

    // Cleanup function
    return () => {
      if (sliderInterval.current) {
        clearInterval(sliderInterval.current);
        sliderInterval.current = null;
      }
    };
  }, [autoSlide, validGalleryImages.length]); // Reduced dependencies to prevent unnecessary interval recreation

  const validProfileImage = homestay?.profileImage && typeof homestay.profileImage === 'string' && homestay.profileImage.trim() !== '' ? homestay.profileImage : null;

  const isGalleryEmpty = !validProfileImage && validGalleryImages.length === 0;

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    const homestayData = await checkImageUploadPermission();
    if (!homestayData) {
      toast.error("You don't have permission to upload images");
      e.target.value = '';
      return;
    }
    
    try {
      setUploadingProfile(true);
      
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'profile');
      
      const uploadUrl = adminUsername 
        ? `/api/homestays/${user.homestayId}/images?adminUsername=${adminUsername}`
        : `/api/homestays/${user.homestayId}/images`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload image');
      
      const data = await response.json();
      
      if (homestay) {
        setHomestay({
          ...homestay,
          profileImage: data.imageUrl
        });
      }
      
      fetchHomestayData(user.homestayId);
      
    } catch (err) {
      console.error('Error uploading profile image:', err);
    } finally {
      setUploadingProfile(false);
    }
  };

  const checkImageUploadPermission = async (): Promise<HomestayData | null> => {
    if (!user) return null;
    
    try {
      const fetchUrl = adminUsername 
        ? `/api/homestays/${user.homestayId}?adminUsername=${adminUsername}`
        : `/api/homestays/${user.homestayId}`;
      
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        console.error('Failed to fetch homestay data for permission check');
        return null;
      }
      
      const data = await response.json();
      if (!data.homestay?.featureAccess?.imageUpload) {
        console.warn('User does not have imageUpload permission');
        return null;
      }
      
      return data.homestay;
    } catch (error) {
      console.error('Error checking imageUpload permission:', error);
      return null;
    }
  };

  // Fix the removeGalleryImage function to properly delete images from storage
  const removeGalleryImage = async (imageUrlToRemove: string) => {
    if (!user || !imageUrlToRemove) return;

    const homestayData = await checkImageUploadPermission();
    if (!homestayData) {
      toast.error("You don't have permission to delete images");
      return;
    }

    try {
      // First, remove the image from the homestay's gallery images array
      const updatedImages = galleryImages.filter(img => img !== imageUrlToRemove);
      setGalleryImages(updatedImages);
      
      // Update the homestay data with the updated gallery images
      await savePortalData(description, updatedImages);
      
      // Then delete the actual file from storage
      // The imageUrlToRemove will be something like "/uploads/adminUsername/homestayId/gallery/filename.jpg"
      // or "/uploads/homestayId/gallery/filename.jpg"
      
      // Create appropriate DELETE endpoint URL
      const deleteUrl = adminUsername 
        ? `/api/homestays/${user.homestayId}/images?imagePath=${imageUrlToRemove}&adminUsername=${adminUsername}`
        : `/api/homestays/${user.homestayId}/images?imagePath=${imageUrlToRemove}`;
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        console.error('Delete image response:', response.status);
        toast.error('Failed to delete image from storage');
      } else {
        toast.success('Image deleted successfully');
      }
      
    } catch (err) {
      console.error('Error removing gallery image:', err);
      toast.error('Failed to remove image');
      if (user) {
        fetchHomestayData(user.homestayId);
      }
    }
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    const homestayData = await checkImageUploadPermission();
    if (!homestayData) {
      toast.error("You don't have permission to upload images");
      e.target.value = '';
      return;
    }
    
    let newImageUrl: string | null = null;
    try {
      setUploadingGallery(true);
      
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadUrl = adminUsername 
        ? `/api/homestays/${user.homestayId}/images?adminUsername=${adminUsername}`
        : `/api/homestays/${user.homestayId}/images`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload gallery image');
      
      const data = await response.json();
      newImageUrl = data.imageUrl;
      
      if (newImageUrl && typeof newImageUrl === 'string') {
          const validUrl = newImageUrl;
          const updatedImages = [...galleryImages, validUrl]; 
          setGalleryImages(updatedImages);
          await savePortalData(description, updatedImages);
          toast.success("Image uploaded successfully");
          if (user) {
            console.log("[Upload Single] Refetching homestay data after save...");
            await fetchHomestayData(user.homestayId);
          }
      } else {
         console.error('Upload succeeded but did not return a valid image URL.');
         toast.error("Failed to process uploaded image");
      }
      
    } catch (err) {
      console.error('Error uploading gallery image:', err);
      toast.error("Failed to upload image");
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleMultipleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    
    const homestayData = await checkImageUploadPermission();
    if (!homestayData) {
      toast.error("You don't have permission to upload images");
      e.target.value = '';
      return;
    }
    
    let successfullyUploadedUrls: string[] = [];
    try {
      setUploadingGallery(true);
      const files = Array.from(e.target.files);
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadUrl = adminUsername 
          ? `/api/homestays/${user.homestayId}/images?adminUsername=${adminUsername}`
          : `/api/homestays/${user.homestayId}/images`;
          
        return fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            return data.imageUrl;
          }
          throw new Error(data.error || 'Upload failed');
        });
      });
      
      const results = await Promise.allSettled(uploadPromises);
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          successfullyUploadedUrls.push(result.value);
        }
      });
      
      if (successfullyUploadedUrls.length > 0) {
        const updatedImages = [...galleryImages, ...successfullyUploadedUrls];
        setGalleryImages(updatedImages);
        
        await savePortalData(description, updatedImages);
        
        toast.success(`${successfullyUploadedUrls.length} images uploaded successfully`);
        
        if (user) {
          fetchHomestayData(user.homestayId);
        }
      } else {
        toast.error("No images were uploaded successfully");
      }
      
    } catch (err) {
      console.error('Error uploading multiple images:', err);
      toast.error("Failed to upload images");
    } finally {
      setUploadingGallery(false);
      if (multipleFileInputRef.current) {
        multipleFileInputRef.current.value = '';
      }
    }
  };

  const nextSlide = () => {
    if (validGalleryImages.length === 0) return;
    setCurrentSlide((prev) => (prev === validGalleryImages.length - 1 ? 0 : prev + 1));
  };
  
  const prevSlide = () => {
    if (validGalleryImages.length === 0) return;
    setCurrentSlide((prev) => (prev === 0 ? validGalleryImages.length - 1 : prev - 1));
  };

  const savePortalData = async (currentDescription: string, currentGalleryImages: string[]) => {
    if (!user) {
      console.error("Save failed: User not available");
      toast.error("Save failed: User not available");
      return; 
    }

    setSaving(true);
    try {
      const saveUrl = adminUsername 
        ? `/api/homestays/${user.homestayId}?adminUsername=${adminUsername}`
        : `/api/homestays/${user.homestayId}`;
      
      const response = await fetch(saveUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: currentDescription,
          galleryImages: currentGalleryImages,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update homestay portal');
      }

      const savedData = await response.json();
      if (savedData.success && savedData.homestay) {
        toast.success("Changes saved successfully");
      } 
      
      setIsEditingDescription(false);
    
    } catch (err) {
      console.error('Error updating homestay portal:', err);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const saveChanges = async () => {
    await savePortalData(description, galleryImages);
  };

  const toggleDescriptionEdit = () => {
    setIsEditingDescription(!isEditingDescription);
  };

  const toggleAutoSlide = () => {
    setAutoSlide(prev => !prev);
  };

  const renderSliderImage = (imageSrc: string, index: number) => {
    // Add cache busting to prevent caching
    const apiUrl = `${imageSrc.replace('/uploads/', '/api/images/')}?t=${Date.now()}`;
    console.log(`[Portal Slider] Rendering image ${index} via API: ${apiUrl}`);
    return (
      <div
        key={index}
        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
          index === currentSlideIndex ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => openPreview(apiUrl)}
      >
        <img 
          src={apiUrl}
          alt={`Gallery Image ${index + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            console.warn(`[Portal Slider] Failed to load image via API: ${apiUrl}`);
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  };

  const renderThumbnail = (imageSrc: string | null, type: 'profile' | 'gallery', index?: number) => {
    const baseClasses = "h-16 w-16 md:h-20 md:w-20 rounded-md overflow-hidden cursor-pointer border-2 transition-all duration-200 relative group flex-shrink-0";
    const activeClass = "border-primary scale-105 shadow-md";
    const inactiveClass = "border-transparent hover:border-primary/50 opacity-80 hover:opacity-100";
    
    const isActive = (type === 'gallery' && validGalleryImages[currentSlideIndex] === imageSrc);

    if (imageSrc && typeof imageSrc === 'string' && imageSrc.trim() !== '') {
      const apiUrl = imageSrc.replace('/uploads/', '/api/images/') + `?t=${new Date().getTime()}`;
      console.log(`[Portal Thumb] Rendering ${type} thumb via API: ${apiUrl}`);

      return (
        <div 
          key={type === 'profile' ? 'profile-thumb' : `gallery-thumb-${index}`}
          className={`${baseClasses} ${isActive ? activeClass : inactiveClass}`}
          onClick={() => {
            if (type === 'gallery' && index !== undefined) {
                const validIndex = validGalleryImages.findIndex(img => img === imageSrc);
                if (validIndex !== -1) setCurrentSlide(validIndex);
            } else {
                openPreview(apiUrl);
            }
          }}
        >
          <img 
            src={apiUrl} 
            alt={type === 'profile' ? "Profile Thumbnail" : `Gallery Thumbnail ${index !== undefined ? index + 1 : ''}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
                console.warn(`[Portal Thumb] Failed to load ${type} thumb via API: ${apiUrl}`);
                (e.target as HTMLImageElement).style.display = 'none';
                if (type === 'profile') {
                    const initials = getInitials(homestay?.homeStayName || '');
                    const placeholder = document.createElement('div');
                    placeholder.className = 'w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-semibold text-xl';
                    placeholder.textContent = initials;
                    e.currentTarget.parentElement?.appendChild(placeholder);
                }
            }}
          />
          {type === 'gallery' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                removeGalleryImage(imageSrc);
              }}
              className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              title="Remove Image"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      );
    } else if (type === 'profile') {
      console.log("[Portal Thumb] Rendering profile initials placeholder");
      const initials = getInitials(homestay?.homeStayName || '');
      return (
        <div key="profile-thumb-placeholder" className={`${baseClasses} ${inactiveClass} bg-gray-100 flex items-center justify-center`}>
          <span className="text-gray-400 font-semibold text-xl">{initials}</span>
        </div>
      );
    } 
    
    return null;
  };

  const getImageUrl = (filePath?: string) => {
    if (!filePath) return '/images/placeholder-homestay.jpg';
    
    // For images stored in the uploads directory, route through the API
    // This will handle both regular and admin paths properly
    return filePath.startsWith('/uploads/') 
      ? `${filePath.replace('/uploads/', '/api/images/')}?t=${Date.now()}`
      : filePath;
  };

  const openPreview = (imageSrc: string | null) => {
    if (imageSrc && typeof imageSrc === 'string' && imageSrc.trim() !== '') {
      // For images stored in the uploads directory, route through the API
      // This will handle both regular and admin paths properly
      const apiUrl = imageSrc.startsWith('/uploads/') 
        ? `${imageSrc.replace('/uploads/', '/api/images/')}?t=${Date.now()}`
        : imageSrc;
      setPreviewImage(apiUrl);
    } else {
      setPreviewImage(null);
    }
  };

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }));
    setCustomFieldsChanged(true);
  };
  
  const saveCustomFieldValues = async () => {
    if (!user || !homestay) return;
    
    try {
      setSavingCustomFields(true);
      
      const saveUrl = adminUsername 
        ? `/api/superadmin/custom-fields/values?adminUsername=${adminUsername}`
        : `/api/superadmin/custom-fields/values`;
      
      for (const fieldId in customFieldValues) {
        const value = customFieldValues[fieldId];
        
        const response = await fetch(saveUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            homestayId: user.homestayId,
            fieldId,
            value
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save custom field values');
        }
      }
      
      const updatedAt = new Date().toISOString();
      
      setHomestay((prev) => {
        if (!prev) return prev;
        
        const updatedValues = {
          ...customFieldValues,
          lastUpdated: updatedAt
        };
        
        return {
          ...prev,
          customFields: {
            definitions: prev.customFields?.definitions || [],
            values: updatedValues
          }
        };
      });
      
      toast.success('Custom field values saved successfully');
      setCustomFieldsChanged(false);
    } catch (err) {
      console.error('Error saving custom field values:', err);
      toast.error('Error saving custom field values: ' + err);
    } finally {
      setSavingCustomFields(false);
    }
  };
  
  const renderCustomFields = () => {
    if (!homestay?.customFields?.definitions || homestay.customFields.definitions.length === 0) {
      return null;
    }
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Additional Information</h2>
          {customFieldsChanged && (
            <Button 
              variant="default" 
              size="sm"
              onClick={saveCustomFieldValues}
              disabled={savingCustomFields}
            >
              {savingCustomFields ? 
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </div> : 
                'Save Changes'
              }
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          {homestay.customFields.definitions.map(field => (
            <div key={field.fieldId} className="grid gap-2">
              <Label htmlFor={field.fieldId}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {field.type === 'text' && (
                <Textarea
                  id={field.fieldId}
                  value={customFieldValues[field.fieldId] || ''}
                  onChange={e => handleCustomFieldChange(field.fieldId, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  required={field.required}
                />
              )}
              
              {field.type === 'number' && (
                <Input
                  id={field.fieldId}
                  type="number"
                  value={customFieldValues[field.fieldId] || ''}
                  onChange={e => handleCustomFieldChange(field.fieldId, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  required={field.required}
                />
              )}
              
              {field.type === 'date' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customFieldValues[field.fieldId] && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customFieldValues[field.fieldId] ? format(new Date(customFieldValues[field.fieldId]), "PPP") : `Select ${field.label.toLowerCase()}`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customFieldValues[field.fieldId] ? new Date(customFieldValues[field.fieldId]) : undefined}
                      onSelect={date => handleCustomFieldChange(field.fieldId, date?.toISOString())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
              
              {field.type === 'boolean' && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id={field.fieldId}
                    checked={!!customFieldValues[field.fieldId]}
                    onCheckedChange={checked => handleCustomFieldChange(field.fieldId, checked)}
                  />
                  <Label htmlFor={field.fieldId}>
                    {customFieldValues[field.fieldId] ? 'Yes' : 'No'}
                  </Label>
                </div>
              )}
              
              {field.type === 'select' && field.options && (
                <Select
                  value={customFieldValues[field.fieldId] || ''}
                  onValueChange={value => handleCustomFieldChange(field.fieldId, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Fix handleTeamMemberImageUpload to include homestayId in the path
  const handleTeamMemberImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    try {
      setUploadingTeamMemberImage(true);
      
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      // Create a unique path for team member images with homestayId
      const uploadPath = adminUsername
        ? `/api/upload?path=uploads/${adminUsername}/${user.homestayId}/team&filename=${Date.now()}-${file.name}`
        : `/api/upload?path=uploads/${user.homestayId}/team&filename=${Date.now()}-${file.name}`;
      
      const response = await fetch(uploadPath, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload image');
      
      const data = await response.json();
      
      // Update the team member's photo path
      const updatedTeamMembers = [...teamMembers];
      updatedTeamMembers[index].photoPath = data.filePath;
      setTeamMembers(updatedTeamMembers);
      
      toast.success("Team member image uploaded successfully");
    } catch (error) {
      console.error("Error uploading team member image:", error);
      toast.error("Failed to upload team member image");
    } finally {
      setUploadingTeamMemberImage(false);
    }
  };

  // Function to add a new team member
  const addTeamMember = () => {
    // Calculate the next order number
    const nextOrder = teamMembers.length > 0 
      ? Math.max(...teamMembers.map(m => m.order)) + 1 
      : 0;
      
    setTeamMembers([...teamMembers, { ...emptyTeamMember, order: nextOrder }]);
    setIsEditingTeamMember(teamMembers.length);
  };

  // Function to remove a team member
  const removeTeamMember = (index: number) => {
    const updatedTeamMembers = [...teamMembers];
    updatedTeamMembers.splice(index, 1);
    setTeamMembers(updatedTeamMembers);
    
    // Reset editing state if we were editing the removed member
    if (isEditingTeamMember === index) {
      setIsEditingTeamMember(null);
    } else if (isEditingTeamMember !== null && isEditingTeamMember > index) {
      // Adjust the index if we were editing a member after the removed one
      setIsEditingTeamMember(isEditingTeamMember - 1);
    }
  };

  // Function to update a team member field
  const updateTeamMember = (index: number, field: keyof TeamMember, value: any) => {
    const updatedTeamMembers = [...teamMembers];
    updatedTeamMembers[index] = { ...updatedTeamMembers[index], [field]: value };
    setTeamMembers(updatedTeamMembers);
  };

  // Function to save team members
  const saveTeamMembers = async () => {
    if (!user || !homestay) return;
    
    try {
      setSaving(true);
      
      // API endpoint with optional admin username
      const endpoint = adminUsername 
        ? `/api/homestays/${user.homestayId}/team?adminUsername=${adminUsername}`
        : `/api/homestays/${user.homestayId}/team`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teamMembers })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save team members');
      }
      
      // Update local homestay state
      setHomestay({ ...homestay, teamMembers });
      
      // Reset editing state
      setIsEditingTeamMember(null);
      
      toast.success("Team members saved successfully");
    } catch (error) {
      console.error("Error saving team members:", error);
      toast.error("Failed to save team members");
    } finally {
      setSaving(false);
    }
  };

  // Fix handleTestimonialImageUpload to include homestayId in the path
  const handleTestimonialImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    try {
      setUploadingTestimonialImage(true);
      
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      // Create a unique path for testimonial images with homestayId
      const uploadPath = adminUsername
        ? `/api/upload?path=uploads/${adminUsername}/${user.homestayId}/testimonials&filename=${Date.now()}-${file.name}`
        : `/api/upload?path=uploads/${user.homestayId}/testimonials&filename=${Date.now()}-${file.name}`;
      
      const response = await fetch(uploadPath, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload image');
      
      const data = await response.json();
      
      // Update the testimonial's photo path
      const updatedTestimonials = [...testimonials];
      updatedTestimonials[index].photoPath = data.filePath;
      setTestimonials(updatedTestimonials);
      
      toast.success("Testimonial image uploaded successfully");
    } catch (error) {
      console.error("Error uploading testimonial image:", error);
      toast.error("Failed to upload testimonial image");
    } finally {
      setUploadingTestimonialImage(false);
    }
  };

  // Function to add a new testimonial
  const addTestimonial = () => {
    setTestimonials([...testimonials, { ...emptyTestimonial }]);
    setIsEditingTestimonial(testimonials.length);
  };

  // Function to remove a testimonial
  const removeTestimonial = (index: number) => {
    const updatedTestimonials = [...testimonials];
    updatedTestimonials.splice(index, 1);
    setTestimonials(updatedTestimonials);
    
    // Reset editing state if we were editing the removed testimonial
    if (isEditingTestimonial === index) {
      setIsEditingTestimonial(null);
    } else if (isEditingTestimonial !== null && isEditingTestimonial > index) {
      // Adjust the index if we were editing a testimonial after the removed one
      setIsEditingTestimonial(isEditingTestimonial - 1);
    }
  };

  // Function to update a testimonial field
  const updateTestimonial = (index: number, field: keyof Testimonial, value: any) => {
    const updatedTestimonials = [...testimonials];
    updatedTestimonials[index] = { ...updatedTestimonials[index], [field]: value };
    setTestimonials(updatedTestimonials);
  };

  // Function to save testimonials
  const saveTestimonials = async () => {
    if (!user || !homestay) return;
    
    try {
      setSaving(true);
      
      // API endpoint with optional admin username
      const endpoint = adminUsername 
        ? `/api/homestays/${user.homestayId}/testimonials?adminUsername=${adminUsername}`
        : `/api/homestays/${user.homestayId}/testimonials`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ testimonials })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save testimonials');
      }
      
      // Update local homestay state
      setHomestay({ ...homestay, testimonials });
      
      // Reset editing state
      setIsEditingTestimonial(null);
      
      toast.success("Testimonials saved successfully");
    } catch (error) {
      console.error("Error saving testimonials:", error);
      toast.error("Failed to save testimonials");
    } finally {
      setSaving(false);
    }
  };

  // Initialize content data when homestay data is loaded
  useEffect(() => {
    if (homestay) {
      // Initialize team members
      setTeamMembers(homestay.teamMembers || []);
      
      // Initialize testimonials
      setTestimonials(homestay.testimonials || []);
      
      // Initialize destinations
      setDestinations(homestay.destinations || []);
      
      // Initialize page content
      setPageContent(homestay.pageContent || {});
    }
  }, [homestay]);

  // Function to update hero section content
  const updateHeroContent = (field: keyof NonNullable<PageContent['heroSection']>, value: string) => {
    setPageContent({
      ...pageContent,
      heroSection: {
        ...pageContent.heroSection,
        [field]: value
      }
    });
  };

  // Function to update about page content
  const updateAboutPageContent = (field: keyof NonNullable<PageContent['aboutPage']>, value: string | string[]) => {
    setPageContent({
      ...pageContent,
      aboutPage: {
        ...pageContent.aboutPage,
        [field]: value
      }
    });
  };

  // Function to handle highlight points in about page
  const updateHighlightPoint = (index: number, value: string) => {
    const updatedHighlights = [...(pageContent.aboutPage?.highlightPoints || [])];
    updatedHighlights[index] = value;
    updateAboutPageContent('highlightPoints', updatedHighlights);
  };

  // Function to add a new highlight point
  const addHighlightPoint = () => {
    const updatedHighlights = [...(pageContent.aboutPage?.highlightPoints || []), ""];
    updateAboutPageContent('highlightPoints', updatedHighlights);
  };

  // Function to remove a highlight point
  const removeHighlightPoint = (index: number) => {
    const updatedHighlights = [...(pageContent.aboutPage?.highlightPoints || [])];
    updatedHighlights.splice(index, 1);
    updateAboutPageContent('highlightPoints', updatedHighlights);
  };

  // Function to update "Why Choose Us" points
  const updateWhyChooseUs = (index: number, value: string) => {
    const updatedPoints = [...(pageContent.whyChooseUs || [])];
    updatedPoints[index] = value;
    setPageContent({
      ...pageContent,
      whyChooseUs: updatedPoints
    });
  };

  // Function to add a new "Why Choose Us" point
  const addWhyChooseUsPoint = () => {
    const updatedPoints = [...(pageContent.whyChooseUs || []), ""];
    setPageContent({
      ...pageContent,
      whyChooseUs: updatedPoints
    });
  };

  // Function to remove a "Why Choose Us" point
  const removeWhyChooseUsPoint = (index: number) => {
    const updatedPoints = [...(pageContent.whyChooseUs || [])];
    updatedPoints.splice(index, 1);
    setPageContent({
      ...pageContent,
      whyChooseUs: updatedPoints
    });
  };

  // Function to update FAQ questions and answers in contact page
  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedFaq = [...(pageContent.contactPage?.faq || [])];
    updatedFaq[index] = {
      ...updatedFaq[index],
      [field]: value
    };
    setPageContent({
      ...pageContent,
      contactPage: {
        ...pageContent.contactPage,
        faq: updatedFaq
      }
    });
  };

  // Function to add a new FAQ
  const addFaq = () => {
    const updatedFaq = [...(pageContent.contactPage?.faq || []), { question: "", answer: "" }];
    setPageContent({
      ...pageContent,
      contactPage: {
        ...pageContent.contactPage,
        faq: updatedFaq
      }
    });
  };

  // Function to remove a FAQ
  const removeFaq = (index: number) => {
    const updatedFaq = [...(pageContent.contactPage?.faq || [])];
    updatedFaq.splice(index, 1);
    setPageContent({
      ...pageContent,
      contactPage: {
        ...pageContent.contactPage,
        faq: updatedFaq
      }
    });
  };

  // Fix handleAboutHeroImageUpload to include homestayId in the path
  const handleAboutHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    try {
      setUploadingAboutImage(true);
      
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      // Create a path for about hero image with homestayId
      const uploadPath = adminUsername
        ? `/api/upload?path=uploads/${adminUsername}/${user.homestayId}/about&filename=hero-${Date.now()}-${file.name}`
        : `/api/upload?path=uploads/${user.homestayId}/about&filename=hero-${Date.now()}-${file.name}`;
      
      const response = await fetch(uploadPath, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload image');
      
      const data = await response.json();
      
      // Update the about page background image
      updateAboutPageContent('backgroundImage', data.filePath);
      
      toast.success("About page image uploaded successfully");
    } catch (error) {
      console.error("Error uploading about page image:", error);
      toast.error("Failed to upload about page image");
    } finally {
      setUploadingAboutImage(false);
    }
  };

  // Fix handleContactHeroImageUpload to include homestayId in the path
  const handleContactHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    try {
      setUploadingContactImage(true);
      
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      // Create a path for contact hero image with homestayId
      const uploadPath = adminUsername
        ? `/api/upload?path=uploads/${adminUsername}/${user.homestayId}/contact&filename=hero-${Date.now()}-${file.name}`
        : `/api/upload?path=uploads/${user.homestayId}/contact&filename=hero-${Date.now()}-${file.name}`;
      
      const response = await fetch(uploadPath, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload image');
      
      const data = await response.json();
      
      // Update the contact page background image
      setPageContent({
        ...pageContent,
        contactPage: {
          ...pageContent.contactPage,
          backgroundImage: data.filePath
        }
      });
      
      toast.success("Contact page image uploaded successfully");
    } catch (error) {
      console.error("Error uploading contact page image:", error);
      toast.error("Failed to upload contact page image");
    } finally {
      setUploadingContactImage(false);
    }
  };

  // Function to save all page content
  const savePageContent = async () => {
    if (!user || !homestay) return;
    
    try {
      setSaving(true);
      
      // API endpoint with optional admin username
      const endpoint = adminUsername 
        ? `/api/homestays/${user.homestayId}/pageContent?adminUsername=${adminUsername}`
        : `/api/homestays/${user.homestayId}/pageContent`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pageContent })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save page content');
      }
      
      // Update local homestay state
      setHomestay({ ...homestay, pageContent });
      
      toast.success("Page content saved successfully");
    } catch (error) {
      console.error("Error saving page content:", error);
      toast.error("Failed to save page content");
    } finally {
      setSaving(false);
    }
  };

  // Fix handleDestinationImageUpload to include homestayId in the path
  const handleDestinationImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    try {
      setUploadingDestinationImage(true);
      
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      // Create a unique path for destination images with homestayId
      const uploadPath = adminUsername
        ? `/api/upload?path=uploads/${adminUsername}/${user.homestayId}/destinations&filename=${Date.now()}-${file.name}`
        : `/api/upload?path=uploads/${user.homestayId}/destinations&filename=${Date.now()}-${file.name}`;
      
      const response = await fetch(uploadPath, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload image');
      
      const data = await response.json();
      
      // Update the destination image
      const updatedDestinations = [...destinations];
      updatedDestinations[index].image = data.filePath;
      setDestinations(updatedDestinations);
      
      toast.success("Destination image uploaded successfully");
    } catch (error) {
      console.error("Error uploading destination image:", error);
      toast.error("Failed to upload destination image");
    } finally {
      setUploadingDestinationImage(false);
    }
  };

  // Function to add a new destination
  const addDestination = () => {
    setDestinations([...destinations, { ...emptyDestination }]);
    setIsEditingDestination(destinations.length);
  };

  // Function to remove a destination
  const removeDestination = (index: number) => {
    const updatedDestinations = [...destinations];
    updatedDestinations.splice(index, 1);
    setDestinations(updatedDestinations);
    
    // Reset editing state if we were editing the removed destination
    if (isEditingDestination === index) {
      setIsEditingDestination(null);
    } else if (isEditingDestination !== null && isEditingDestination > index) {
      // Adjust the index if we were editing a destination after the removed one
      setIsEditingDestination(isEditingDestination - 1);
    }
  };

  // Function to update a destination field
  const updateDestination = (index: number, field: keyof Destination, value: any) => {
    const updatedDestinations = [...destinations];
    updatedDestinations[index] = { ...updatedDestinations[index], [field]: value };
    setDestinations(updatedDestinations);
  };

  // Function to add a highlight to a destination
  const addDestinationHighlight = (index: number) => {
    const updatedDestinations = [...destinations];
    updatedDestinations[index].highlights = [...updatedDestinations[index].highlights, ""];
    setDestinations(updatedDestinations);
  };

  // Function to update a destination highlight
  const updateDestinationHighlight = (destinationIndex: number, highlightIndex: number, value: string) => {
    const updatedDestinations = [...destinations];
    updatedDestinations[destinationIndex].highlights[highlightIndex] = value;
    setDestinations(updatedDestinations);
  };

  // Function to remove a destination highlight
  const removeDestinationHighlight = (destinationIndex: number, highlightIndex: number) => {
    const updatedDestinations = [...destinations];
    updatedDestinations[destinationIndex].highlights.splice(highlightIndex, 1);
    setDestinations(updatedDestinations);
  };

  // Function to save destinations
  const saveDestinations = async () => {
    if (!user || !homestay) return;
    
    try {
      setSaving(true);
      
      // API endpoint with optional admin username
      const endpoint = adminUsername 
        ? `/api/homestays/${user.homestayId}/destinations?adminUsername=${adminUsername}`
        : `/api/homestays/${user.homestayId}/destinations`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ destinations })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save destinations');
      }
      
      // Update local homestay state
      setHomestay({ ...homestay, destinations });
      
      // Reset editing state
      setIsEditingDestination(null);
      
      toast.success("Destinations saved successfully");
    } catch (error) {
      console.error("Error saving destinations:", error);
      toast.error("Failed to save destinations");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Homestay Portal</h1>
        <p className="text-gray-600 mb-6 max-w-2xl">
          Customize how visitors will see your homestay. Create an appealing showcase that highlights your unique experience.
        </p>
        
        {homestay && (
          <div className="flex flex-wrap gap-4">
            <Link 
              href={adminUsername 
                ? `/${adminUsername}/homestays/${homestay.homestayId}`
                : `/homestays/${homestay.homestayId}`
              }
              onClick={(e) => {
                if (!homestay.homestayId || homestay.homestayId === 'undefined') {
                  e.preventDefault();
                  console.error("Invalid homestayId parameter:", homestay.homestayId);
                  toast.error("Error: Invalid homestay ID");
                  return false;
                }
                console.log("Navigating to public portal for homestay:", homestay.homestayId);
              }}
              target="_blank"
              className="inline-flex items-center px-5 py-2.5 bg-white border border-primary text-primary font-medium rounded-md hover:bg-primary hover:text-white transition-colors shadow-sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Public Portal
            </Link>
            
            <button
              onClick={saveChanges}
              disabled={saving}
              className="inline-flex items-center px-5 py-2.5 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition-colors disabled:opacity-70 shadow-sm"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : !homestay ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Tabs defaultValue="gallery" value={activeTab} onValueChange={setActiveTab} className="w-full mb-10">
          <TabsList className="grid grid-cols-4 md:grid-cols-8 mb-6">
            <TabsTrigger value="gallery" className="flex items-center gap-1" title="Manage homestay images and description">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Gallery</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-1" title="Add or update team members">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="flex items-center gap-1" title="Manage guest testimonials">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Testimonials</span>
            </TabsTrigger>
            <TabsTrigger value="hero" className="flex items-center gap-1" title="Edit homepage hero section content">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Hero</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-1" title="Update the About page content">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">About</span>
            </TabsTrigger>
            <TabsTrigger value="destinations" className="flex items-center gap-1" title="Manage nearby attractions">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Destinations</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-1" title="Edit FAQ and contact information">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">FAQ</span>
            </TabsTrigger>
            <TabsTrigger value="customFields" className="flex items-center gap-1" title="Additional information requested by administrators">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Custom</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  <span className="inline-block mr-2">📸</span> Gallery
                </h2>
                <button 
                  onClick={toggleAutoSlide}
                  className={`px-3 py-1 text-xs rounded-full ${autoSlide 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'}`}
                >
                  {autoSlide ? 'Auto-slide On' : 'Auto-slide Off'}
                </button>
              </div>
              
              <div className="relative h-64 md:h-96 bg-gray-200 rounded-lg overflow-hidden mb-4 shadow-inner">
                {validGalleryImages.length > 0 ? (
                  validGalleryImages.map((img, index) => renderSliderImage(img, index))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <ImageIcon className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-1">No Gallery Images Yet</h3>
                    <p className="text-gray-500 text-sm">Upload images to showcase your homestay.</p>
                  </div>
                )}
                {validGalleryImages.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors z-10"
                      aria-label="Previous Image"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors z-10"
                      aria-label="Next Image"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2 z-10">
                      {validGalleryImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`h-2 w-2 rounded-full transition-colors duration-300 ${currentSlideIndex === index ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
              <h3 className="text-md font-semibold text-gray-700 mb-3">Manage Gallery</h3>
              <div className="flex flex-wrap items-start gap-3">
                {renderThumbnail(validProfileImage, 'profile')}

                {validGalleryImages.map((img, index) => renderThumbnail(img, 'gallery', index))}
                
                <div className="flex gap-3">
                  <label className="h-16 w-16 md:h-20 md:w-20 rounded-md border-2 border-dashed border-gray-300 hover:border-primary flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-primary transition-all relative flex-shrink-0">
                    {uploadingGallery ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Plus className="h-6 w-6" />
                    )}
                    <span className="text-xs mt-1">Add</span>
                    <input 
                      type="file" 
                      accept="image/jpeg, image/png, image/webp"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleGalleryImageUpload}
                      disabled={uploadingGallery}
                    />
                  </label>
                  
                  <button 
                    onClick={() => multipleFileInputRef.current?.click()}
                    className="h-16 w-16 md:h-20 md:w-20 rounded-md border-2 border-dashed border-gray-300 hover:border-primary flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-primary transition-all relative flex-shrink-0"
                    disabled={uploadingGallery}
                    title="Upload Multiple Images"
                  >
                    {uploadingGallery ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6" />
                    )}
                    <span className="text-xs mt-1">Add Many</span>
                  </button>
                </div>
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden" 
                  onChange={handleMultipleImagesUpload}
                  disabled={uploadingGallery}
                  multiple
                  ref={multipleFileInputRef}
                />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  <span className="inline-block mr-2">📝</span> Description
                </h2>
                <button 
                  onClick={toggleDescriptionEdit}
                  className="inline-flex items-center px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {isEditingDescription ? (
                    <>
                      <X className="h-4 w-4 mr-1.5" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4 mr-1.5" />
                      Edit
                    </>
                  )}
                </button>
              </div>
              
              {isEditingDescription ? (
                <div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-4 border rounded-md h-40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-gray-700"
                    placeholder="Describe your homestay in detail. Share what makes it special, the experience guests can expect, unique cultural elements, and nearby attractions."
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={saveChanges}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary-dark transition-colors disabled:opacity-70 shadow-sm"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1.5"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1.5" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md text-gray-700 whitespace-pre-line min-h-[100px]">
                  {description || <span className="text-gray-400 italic">No description added yet. Click 'Edit' to add one.</span>}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  <span className="inline-block mr-2">👥</span> Team Members
                </h2>
                <Button 
                  onClick={addTeamMember}
                  className="bg-primary hover:bg-primary-dark text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </div>
              
              {/* Team Members List */}
              <div className="space-y-6">
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <Users className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-gray-500 mb-1">No Team Members Yet</h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
                      Add team members to showcase the people behind your homestay.
                    </p>
                    <Button 
                      onClick={addTeamMember}
                      className="bg-primary hover:bg-primary-dark text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Team Member
                    </Button>
                  </div>
                ) : (
                  teamMembers.map((member, index) => (
                    <div key={`team-${index}`} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      {isEditingTeamMember === index ? (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* Team Member Image Upload */}
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-200 border-2 border-primary">
                              {member.photoPath ? (
                                <img 
                                  src={getImageUrl(member.photoPath)}
                                  alt={member.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                  <User className="h-10 w-10" />
                                </div>
                              )}
                              <label className="absolute inset-0 bg-black/30 flex items-center justify-center text-white cursor-pointer hover:bg-black/50 transition-colors">
                                <Camera className="h-6 w-6" />
                                <input 
                                  type="file" 
                                  className="sr-only" 
                                  accept="image/jpeg, image/png, image/webp"
                                  onChange={(e) => handleTeamMemberImageUpload(e, index)}
                                  disabled={uploadingTeamMemberImage}
                                />
                              </label>
                            </div>
                            
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`name-${index}`}>Name</Label>
                                <Input 
                                  id={`name-${index}`}
                                  value={member.name}
                                  onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                                  placeholder="Full Name"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`position-${index}`}>Position</Label>
                                <Input 
                                  id={`position-${index}`}
                                  value={member.position}
                                  onChange={(e) => updateTeamMember(index, 'position', e.target.value)}
                                  placeholder="e.g., Host, Chef, Guide"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`contact-${index}`}>Contact (Optional)</Label>
                                <Input 
                                  id={`contact-${index}`}
                                  value={member.contactNo || ''}
                                  onChange={(e) => updateTeamMember(index, 'contactNo', e.target.value)}
                                  placeholder="Phone Number"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`order-${index}`}>Display Order</Label>
                                <Input 
                                  id={`order-${index}`}
                                  type="number"
                                  value={member.order}
                                  onChange={(e) => updateTeamMember(index, 'order', parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor={`bio-${index}`}>Bio</Label>
                            <Textarea 
                              id={`bio-${index}`}
                              value={member.bio}
                              onChange={(e) => updateTeamMember(index, 'bio', e.target.value)}
                              placeholder="A brief description of this team member..."
                              className="h-24"
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-3">
                            <Button 
                              variant="outline" 
                              onClick={() => setIsEditingTeamMember(null)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => removeTeamMember(index)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                            <Button 
                              onClick={saveTeamMembers}
                              disabled={saving}
                              className="bg-primary hover:bg-primary-dark text-white"
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Team Member Display */}
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            {member.photoPath ? (
                              <img 
                                src={getImageUrl(member.photoPath)}
                                alt={member.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                <User className="h-10 w-10" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <h3 className="font-medium text-gray-900">{member.name || 'Unnamed Member'}</h3>
                                <p className="text-primary text-sm">{member.position || 'No position specified'}</p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-500"
                                onClick={() => setIsEditingTeamMember(index)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-gray-600 text-sm line-clamp-2 mt-2">
                              {member.bio || 'No bio provided'}
                            </p>
                            {member.contactNo && (
                              <p className="text-gray-500 text-xs mt-2">
                                Contact: {member.contactNo}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              {/* Save All Button - only show if there are team members and we're not editing */}
              {teamMembers.length > 0 && isEditingTeamMember === null && (
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={saveTeamMembers}
                    disabled={saving}
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving All...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save All
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="testimonials" className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  <span className="inline-block mr-2">💬</span> Testimonials
                </h2>
                <Button 
                  onClick={addTestimonial}
                  className="bg-primary hover:bg-primary-dark text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Testimonial
                </Button>
              </div>
              
              {/* Testimonials List */}
              <div className="space-y-6">
                {testimonials.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <MessageSquare className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-gray-500 mb-1">No Testimonials Yet</h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
                      Add guest testimonials to showcase positive experiences at your homestay.
                    </p>
                    <Button 
                      onClick={addTestimonial}
                      className="bg-primary hover:bg-primary-dark text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Testimonial
                    </Button>
                  </div>
                ) : (
                  testimonials.map((testimonial, index) => (
                    <div key={`testimonial-${index}`} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      {isEditingTestimonial === index ? (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* Testimonial Image Upload */}
                            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-2 border-primary">
                              {testimonial.photoPath ? (
                                <img 
                                  src={getImageUrl(testimonial.photoPath)}
                                  alt={testimonial.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                  <User className="h-10 w-10" />
                                </div>
                              )}
                              <label className="absolute inset-0 bg-black/30 flex items-center justify-center text-white cursor-pointer hover:bg-black/50 transition-colors">
                                <Camera className="h-6 w-6" />
                                <input 
                                  type="file" 
                                  className="sr-only" 
                                  accept="image/jpeg, image/png, image/webp"
                                  onChange={(e) => handleTestimonialImageUpload(e, index)}
                                  disabled={uploadingTestimonialImage}
                                />
                              </label>
                            </div>
                            
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`testimonial-name-${index}`}>Guest Name</Label>
                                <Input 
                                  id={`testimonial-name-${index}`}
                                  value={testimonial.name}
                                  onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                                  placeholder="Guest Name"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`testimonial-location-${index}`}>Location</Label>
                                <Input 
                                  id={`testimonial-location-${index}`}
                                  value={testimonial.location}
                                  onChange={(e) => updateTestimonial(index, 'location', e.target.value)}
                                  placeholder="e.g., United States, Australia"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`testimonial-rating-${index}`}>Rating (1-5)</Label>
                                <Select
                                  value={testimonial.rating.toString()}
                                  onValueChange={(value) => updateTestimonial(index, 'rating', parseInt(value))}
                                >
                                  <SelectTrigger id={`testimonial-rating-${index}`}>
                                    <SelectValue placeholder="Select rating" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1 Star</SelectItem>
                                    <SelectItem value="2">2 Stars</SelectItem>
                                    <SelectItem value="3">3 Stars</SelectItem>
                                    <SelectItem value="4">4 Stars</SelectItem>
                                    <SelectItem value="5">5 Stars</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor={`testimonial-date-${index}`}>Date</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !testimonial.date && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {testimonial.date ? format(new Date(testimonial.date), "PPP") : <span>Pick a date</span>}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={testimonial.date ? new Date(testimonial.date) : undefined}
                                      onSelect={(date) => updateTestimonial(index, 'date', date?.toISOString() || new Date().toISOString())}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor={`testimonial-quote-${index}`}>Testimonial</Label>
                            <Textarea 
                              id={`testimonial-quote-${index}`}
                              value={testimonial.quote}
                              onChange={(e) => updateTestimonial(index, 'quote', e.target.value)}
                              placeholder="The guest's testimonial about their experience..."
                              className="h-24"
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-3">
                            <Button 
                              variant="outline" 
                              onClick={() => setIsEditingTestimonial(null)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => removeTestimonial(index)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                            <Button 
                              onClick={saveTestimonials}
                              disabled={saving}
                              className="bg-primary hover:bg-primary-dark text-white"
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Testimonial Display */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                            {testimonial.photoPath ? (
                              <img 
                                src={getImageUrl(testimonial.photoPath)}
                                alt={testimonial.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                <User className="h-8 w-8" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <h3 className="font-medium text-gray-900">{testimonial.name || 'Anonymous Guest'}</h3>
                                <div className="flex items-center space-x-2">
                                  <p className="text-gray-500 text-sm">{testimonial.location || 'Unknown location'}</p>
                                  <span className="text-gray-300">•</span>
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span 
                                        key={star} 
                                        className={`text-sm ${star <= testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-500"
                                onClick={() => setIsEditingTestimonial(index)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-gray-600 text-sm mt-2 italic">
                              "{testimonial.quote || 'No testimonial provided'}"
                            </p>
                            <p className="text-gray-400 text-xs mt-2">
                              {testimonial.date 
                                ? format(new Date(testimonial.date), "MMMM d, yyyy") 
                                : 'Unknown date'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              {/* Save All Button - only show if there are testimonials and we're not editing */}
              {testimonials.length > 0 && isEditingTestimonial === null && (
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={saveTestimonials}
                    disabled={saving}
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving All...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save All
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="hero" className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  <span className="inline-block mr-2">🏠</span> Hero Section
                </h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="hero-slogan">Slogan</Label>
                  <Input 
                    id="hero-slogan"
                    value={pageContent.heroSection?.slogan || ''}
                    onChange={(e) => updateHeroContent('slogan', e.target.value)}
                    placeholder="e.g., Experience Authentic Nepali Hospitality"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    A short and catchy tagline that defines your homestay's unique value.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="hero-welcome">Welcome Message</Label>
                  <Textarea 
                    id="hero-welcome"
                    value={pageContent.heroSection?.welcomeMessage || ''}
                    onChange={(e) => updateHeroContent('welcomeMessage', e.target.value)}
                    placeholder="e.g., Welcome to our homestay where traditions meet comfort."
                    className="h-24"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This message appears on your homepage and greets visitors to your homestay.
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={savePageContent}
                    disabled={saving}
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* About Page Tab */}
          <TabsContent value="about" className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  <span className="inline-block mr-2">📖</span> About Page
                </h2>
              </div>
              
              <div className="space-y-6">
                {/* Background Image */}
                <div>
                  <Label className="mb-2 block">Background Image</Label>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 h-24 bg-gray-200 rounded-md overflow-hidden relative">
                      {pageContent.aboutPage?.backgroundImage ? (
                        <img
                          src={getImageUrl(pageContent.aboutPage.backgroundImage)}
                          alt="About page background"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md cursor-pointer hover:bg-primary-dark transition-colors">
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingAboutImage ? 'Uploading...' : 'Upload Image'}
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/jpeg, image/png, image/webp"
                          onChange={handleAboutHeroImageUpload}
                          disabled={uploadingAboutImage}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Recommended size: 1920x1080px
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Title and Subtitle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="about-title">Title</Label>
                    <Input 
                      id="about-title"
                      value={pageContent.aboutPage?.title || ''}
                      onChange={(e) => updateAboutPageContent('title', e.target.value)}
                      placeholder="e.g., About [Homestay Name]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="about-subtitle">Subtitle</Label>
                    <Input 
                      id="about-subtitle"
                      value={pageContent.aboutPage?.subtitle || ''}
                      onChange={(e) => updateAboutPageContent('subtitle', e.target.value)}
                      placeholder="e.g., Our Story and Values"
                    />
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <Label htmlFor="about-description">Description</Label>
                  <Textarea 
                    id="about-description"
                    value={pageContent.aboutPage?.description || ''}
                    onChange={(e) => updateAboutPageContent('description', e.target.value)}
                    placeholder="Share the story and details about your homestay..."
                    className="h-32"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use paragraphs to separate content. You can include your history, unique aspects, and what makes your homestay special.
                  </p>
                </div>
                
                {/* Mission and Vision */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="about-mission">Mission</Label>
                    <Textarea 
                      id="about-mission"
                      value={pageContent.aboutPage?.mission || ''}
                      onChange={(e) => updateAboutPageContent('mission', e.target.value)}
                      placeholder="e.g., We are committed to sustainable tourism..."
                      className="h-24"
                    />
                  </div>
                  <div>
                    <Label htmlFor="about-vision">Vision</Label>
                    <Textarea 
                      id="about-vision"
                      value={pageContent.aboutPage?.vision || ''}
                      onChange={(e) => updateAboutPageContent('vision', e.target.value)}
                      placeholder="e.g., We provide genuine cultural experiences..."
                      className="h-24"
                    />
                  </div>
                </div>
                
                {/* Highlight Points */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Highlight Points</Label>
                    <Button
                      onClick={addHighlightPoint}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Point
                    </Button>
                  </div>
                  
                  {(pageContent.aboutPage?.highlightPoints || []).length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-sm">
                        No highlight points added yet. Add some key features about your homestay.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(pageContent.aboutPage?.highlightPoints || []).map((point, index) => (
                        <div key={`highlight-${index}`} className="flex items-center">
                          <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                          <Input 
                            value={point}
                            onChange={(e) => updateHighlightPoint(index, e.target.value)}
                            placeholder="e.g., Authentic cultural experience"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeHighlightPoint(index)}
                            className="ml-2 text-gray-500 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={savePageContent}
                    disabled={saving}
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Destinations Tab */}
          <TabsContent value="destinations" className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  <span className="inline-block mr-2">🏞️</span> Destinations
                </h2>
                <Button 
                  onClick={addDestination}
                  className="bg-primary hover:bg-primary-dark text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Destination
                </Button>
              </div>
              
              {/* Destinations List */}
              <div className="space-y-6">
                {destinations.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <MapPin className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-gray-500 mb-1">No Destinations Yet</h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
                      Add nearby places that visitors can explore during their stay.
                    </p>
                    <Button 
                      onClick={addDestination}
                      className="bg-primary hover:bg-primary-dark text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Destination
                    </Button>
                  </div>
                ) : (
                  destinations.map((destination, index) => (
                    <div key={`destination-${index}`} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      {isEditingDestination === index ? (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            {/* Destination Image Upload */}
                            <div className="w-full sm:w-40 h-32 bg-gray-200 rounded-lg overflow-hidden relative">
                              {destination.image ? (
                                <img 
                                  src={getImageUrl(destination.image)}
                                  alt={destination.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                  <ImageIcon className="h-10 w-10" />
                                </div>
                              )}
                              <label className="absolute inset-0 bg-black/30 flex items-center justify-center text-white cursor-pointer hover:bg-black/50 transition-colors">
                                <Camera className="h-6 w-6" />
                                <input 
                                  type="file" 
                                  className="sr-only" 
                                  accept="image/jpeg, image/png, image/webp"
                                  onChange={(e) => handleDestinationImageUpload(e, index)}
                                  disabled={uploadingDestinationImage}
                                />
                              </label>
                            </div>
                            
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`destination-name-${index}`}>Name</Label>
                                <Input 
                                  id={`destination-name-${index}`}
                                  value={destination.name}
                                  onChange={(e) => updateDestination(index, 'name', e.target.value)}
                                  placeholder="e.g., Kathmandu Valley"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`destination-distance-${index}`}>Distance</Label>
                                <Input 
                                  id={`destination-distance-${index}`}
                                  value={destination.distance}
                                  onChange={(e) => updateDestination(index, 'distance', e.target.value)}
                                  placeholder="e.g., 2 hours drive"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`destination-category-${index}`}>Category</Label>
                                <Select
                                  value={destination.category}
                                  onValueChange={(value) => updateDestination(index, 'category', value)}
                                >
                                  <SelectTrigger id={`destination-category-${index}`}>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cultural">Cultural</SelectItem>
                                    <SelectItem value="nature">Nature</SelectItem>
                                    <SelectItem value="wildlife">Wildlife</SelectItem>
                                    <SelectItem value="adventure">Adventure</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor={`destination-description-${index}`}>Description</Label>
                            <Textarea 
                              id={`destination-description-${index}`}
                              value={destination.description}
                              onChange={(e) => updateDestination(index, 'description', e.target.value)}
                              placeholder="Describe this destination and what visitors can expect..."
                              className="h-24"
                            />
                          </div>
                          
                          {/* Highlights Section */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <Label>Highlights</Label>
                              <Button
                                onClick={() => addDestinationHighlight(index)}
                                size="sm"
                                variant="outline"
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add Highlight
                              </Button>
                            </div>
                            
                            {destination.highlights.length === 0 ? (
                              <div className="text-center py-3 bg-gray-100 rounded-md">
                                <p className="text-gray-500 text-sm">
                                  No highlights added yet. Add some key attractions.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {destination.highlights.map((highlight, hIndex) => (
                                  <div key={`highlight-${index}-${hIndex}`} className="flex items-center">
                                    <div className="mr-2 text-primary">•</div>
                                    <Input 
                                      value={highlight}
                                      onChange={(e) => updateDestinationHighlight(index, hIndex, e.target.value)}
                                      placeholder="e.g., Durbar Square"
                                      className="flex-1"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeDestinationHighlight(index, hIndex)}
                                      className="ml-2 text-gray-500 hover:text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-end space-x-3">
                            <Button 
                              variant="outline" 
                              onClick={() => setIsEditingDestination(null)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => removeDestination(index)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                            <Button 
                              onClick={saveDestinations}
                              disabled={saving}
                              className="bg-primary hover:bg-primary-dark text-white"
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Destination Display */}
                          <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            {destination.image ? (
                              <img 
                                src={getImageUrl(destination.image)}
                                alt={destination.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                <ImageIcon className="h-8 w-8" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <h3 className="font-medium text-gray-900">{destination.name || 'Unnamed Destination'}</h3>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <span>{destination.distance || 'No distance specified'}</span>
                                  <span className="text-gray-300">•</span>
                                  <span className="capitalize">{destination.category || 'Uncategorized'}</span>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-500"
                                onClick={() => setIsEditingDestination(index)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-gray-600 text-sm line-clamp-2 mt-2">
                              {destination.description || 'No description provided'}
                            </p>
                            {destination.highlights.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {destination.highlights.slice(0, 3).map((highlight, hIndex) => (
                                  <span key={`highlight-preview-${index}-${hIndex}`} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                    {highlight}
                                  </span>
                                ))}
                                {destination.highlights.length > 3 && (
                                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                                    +{destination.highlights.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              {/* Save All Button - only show if there are destinations and we're not editing */}
              {destinations.length > 0 && isEditingDestination === null && (
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={saveDestinations}
                    disabled={saving}
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving All...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save All
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Contact/FAQ Tab */}
          <TabsContent value="contact" className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  <span className="inline-block mr-2">❓</span> Contact Page & FAQ
                </h2>
              </div>
              
              <div className="space-y-6">
                {/* Background Image */}
                <div>
                  <Label className="mb-2 block">Contact Page Background Image</Label>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 h-24 bg-gray-200 rounded-md overflow-hidden relative">
                      {pageContent.contactPage?.backgroundImage ? (
                        <img
                          src={getImageUrl(pageContent.contactPage.backgroundImage)}
                          alt="Contact page background"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md cursor-pointer hover:bg-primary-dark transition-colors">
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingContactImage ? 'Uploading...' : 'Upload Image'}
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/jpeg, image/png, image/webp"
                          onChange={handleContactHeroImageUpload}
                          disabled={uploadingContactImage}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Recommended size: 1920x1080px
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Contact Page Title and Subtitle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact-title">Title</Label>
                    <Input 
                      id="contact-title"
                      value={pageContent.contactPage?.title || ''}
                      onChange={(e) => setPageContent({
                        ...pageContent,
                        contactPage: {
                          ...pageContent.contactPage,
                          title: e.target.value
                        }
                      })}
                      placeholder="e.g., Contact Us"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-subtitle">Subtitle</Label>
                    <Input 
                      id="contact-subtitle"
                      value={pageContent.contactPage?.subtitle || ''}
                      onChange={(e) => setPageContent({
                        ...pageContent,
                        contactPage: {
                          ...pageContent.contactPage,
                          subtitle: e.target.value
                        }
                      })}
                      placeholder="e.g., Get in touch with us to plan your stay"
                    />
                  </div>
                </div>
                
                {/* Form Title and Map Embed */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact-form-title">Contact Form Title</Label>
                    <Input 
                      id="contact-form-title"
                      value={pageContent.contactPage?.formTitle || ''}
                      onChange={(e) => setPageContent({
                        ...pageContent,
                        contactPage: {
                          ...pageContent.contactPage,
                          formTitle: e.target.value
                        }
                      })}
                      placeholder="e.g., Send us a Message"
                    />
                  </div>
                  <div>
                    <Label htmlFor="map-embed">Google Maps Embed URL (Optional)</Label>
                    <Input 
                      id="map-embed"
                      value={pageContent.contactPage?.mapEmbedUrl || ''}
                      onChange={(e) => setPageContent({
                        ...pageContent,
                        contactPage: {
                          ...pageContent.contactPage,
                          mapEmbedUrl: e.target.value
                        }
                      })}
                      placeholder="e.g., https://www.google.com/maps/embed?pb=..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Paste the embed URL from Google Maps to show your location
                    </p>
                  </div>
                </div>
                
                {/* FAQ Section */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">Frequently Asked Questions</h3>
                    <Button
                      onClick={addFaq}
                      size="sm"
                      className="bg-primary hover:bg-primary-dark text-white"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add FAQ
                    </Button>
                  </div>
                  
                  {(!pageContent.contactPage?.faq || pageContent.contactPage.faq.length === 0) ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <HelpCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-gray-500 mb-1">No FAQs Added Yet</h3>
                      <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
                        Add frequently asked questions to help your guests find answers easily.
                      </p>
                      <Button 
                        onClick={addFaq}
                        className="bg-primary hover:bg-primary-dark text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First FAQ
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pageContent.contactPage.faq.map((faq, index) => (
                        <div 
                          key={`faq-${index}`} 
                          className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                        >
                          {editingFaqIndex === index ? (
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor={`faq-question-${index}`}>Question</Label>
                                <Input 
                                  id={`faq-question-${index}`}
                                  value={faq.question}
                                  onChange={(e) => updateFaq(index, 'question', e.target.value)}
                                  placeholder="e.g., What is the check-in time?"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`faq-answer-${index}`}>Answer</Label>
                                <Textarea 
                                  id={`faq-answer-${index}`}
                                  value={faq.answer}
                                  onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                                  placeholder="Provide a clear and helpful answer..."
                                  className="h-24"
                                />
                              </div>
                              <div className="flex justify-end space-x-3">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setEditingFaqIndex(null)}
                                >
                                  Done
                                </Button>
                                <Button 
                                  variant="destructive"
                                  onClick={() => removeFaq(index)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{faq.question || 'Untitled Question'}</h4>
                                <p className="text-gray-600 text-sm mt-1">{faq.answer || 'No answer provided'}</p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-500"
                                onClick={() => setEditingFaqIndex(index)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={savePageContent}
                    disabled={saving}
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="customFields" className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  <span className="inline-block mr-2">📋</span> Custom Fields
                </h2>
              </div>
              
              {homestay?.customFields?.definitions && homestay.customFields.definitions.length > 0 ? (
                renderCustomFields()
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-gray-500 mb-1">No Custom Fields Available</h3>
                  <p className="text-gray-400 text-sm max-w-md mx-auto">
                    Custom fields are additional information requests defined by administrators. 
                    When they add custom fields for your homestay, they will appear here for you to fill out.
                  </p>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">What are Custom Fields?</h4>
                    <p className="text-xs text-blue-700">
                      Custom fields are additional information that the system administrator has requested about your homestay.
                      These fields help collect specific data that might be required for reporting, categorization, or special features.
                      When administrators add new custom fields, they will appear here for you to complete.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full h-auto p-2">
            <button 
              className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              <X size={20} />
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-h-[80vh] mx-auto rounded-md shadow-xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
} 