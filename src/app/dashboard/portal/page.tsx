"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon, X, Plus, Camera, Save, Eye, ChevronLeft, ChevronRight, Trash2, Edit3, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface UserInfo {
  homestayId: string;
  homeStayName: string;
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
}

// Add adminUsername to the props interface
interface PortalPageProps {
  adminUsername?: string;
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

export default function PortalPage({ adminUsername }: PortalPageProps) {
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

  // Load user data and profile info
  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        setUser(userData);
        // After setting user data from local storage, fetch homestay data
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

  // Fetch homestay data
  const fetchHomestayData = async (homestayId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/homestays/${homestayId}?adminUsername=${adminUsername || ''}`);
      
      if (!response.ok) throw new Error('Failed to fetch homestay data');
      
      const data = await response.json();
      setHomestay(data.homestay);
      
      // Set description from homestay data or default
      setDescription(data.homestay.description || "");
      
      // Set gallery images from homestay data or empty array
      setGalleryImages(data.homestay.galleryImages || []);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching homestay data:', err);
      setLoading(false);
    }
  };

  // Calculate VALID gallery images ONLY for the main check and slider
  const validGalleryImages = galleryImages.filter(img => typeof img === 'string' && img.trim() !== '');

  // For the slider, use only gallery images
  const currentSlideIndex = validGalleryImages.length > 0 ? currentSlide % validGalleryImages.length : 0;
  const currentImageSrc = validGalleryImages.length > 0 ? validGalleryImages[currentSlideIndex] : null;

  // Auto-slide functionality - moved after validGalleryImages definition
  useEffect(() => {
    if (validGalleryImages.length > 1 && autoSlide) {
      sliderInterval.current = setInterval(() => {
        setCurrentSlide(prev => (prev === validGalleryImages.length - 1 ? 0 : prev + 1));
      }, 5000);
    } else if (sliderInterval.current) {
      clearInterval(sliderInterval.current);
    }

    return () => {
      if (sliderInterval.current) {
        clearInterval(sliderInterval.current);
      }
    };
  }, [autoSlide, validGalleryImages, currentSlide]);

  // Profile image handling is separate now
  const validProfileImage = homestay?.profileImage && typeof homestay.profileImage === 'string' && homestay.profileImage.trim() !== '' ? homestay.profileImage : null;

  // Determine if the gallery is truly empty
  const isGalleryEmpty = !validProfileImage && validGalleryImages.length === 0;

  // Handle profile image upload
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
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
      
      // Update homestay state with new profile image
      if (homestay) {
        setHomestay({
          ...homestay,
          profileImage: data.imageUrl
        });
      }
      
      // Refresh homestay data
      fetchHomestayData(user.homestayId);
      
    } catch (err) {
      console.error('Error uploading profile image:', err);
    } finally {
      setUploadingProfile(false);
    }
  };

  // Remove gallery image and trigger save
  const removeGalleryImage = async (imageUrlToRemove: string) => {
    if (!user || !imageUrlToRemove) return;

    try {
      // First update the UI optimistically
      const updatedImages = galleryImages.filter(img => img !== imageUrlToRemove);
      setGalleryImages(updatedImages);
      
      // Call the DELETE endpoint to remove the image
      const deleteUrl = adminUsername 
        ? `/api/homestays/${user.homestayId}/images?imagePath=${encodeURIComponent(imageUrlToRemove)}&adminUsername=${adminUsername}`
        : `/api/homestays/${user.homestayId}/images?imagePath=${encodeURIComponent(imageUrlToRemove)}`;
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }
      
      // Show success toast
      toast.success("Image deleted successfully");
      
      // Refresh data after deletion
      fetchHomestayData(user.homestayId);
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error("Failed to delete image");
      // Revert the optimistic update if the API call fails
      fetchHomestayData(user.homestayId);
    }
  };

  // Handle single gallery image upload
  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
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
      newImageUrl = data.imageUrl; // This might be null or not a string
      
      // Check if we got a valid string URL
      if (newImageUrl && typeof newImageUrl === 'string') {
          const validUrl = newImageUrl;
          // Update state first
          const updatedImages = [...galleryImages, validUrl]; 
          setGalleryImages(updatedImages);
          // Then trigger save with the updated list
          await savePortalData(description, updatedImages); // Save with the new list
          // Show success toast
          toast.success("Image uploaded successfully");
          // Explicitly refetch after save
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

  // Handle multiple gallery images upload
  const handleMultipleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    
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
      
      // Wait for all upload promises to resolve
      const results = await Promise.allSettled(uploadPromises);
      
      // Extract successful uploads
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          successfullyUploadedUrls.push(result.value);
        }
      });
      
      if (successfullyUploadedUrls.length > 0) {
        // Update the gallery images with the newly uploaded images
        const updatedImages = [...galleryImages, ...successfullyUploadedUrls];
        setGalleryImages(updatedImages);
        
        // Save changes to the database
        await savePortalData(description, updatedImages);
        
        // Show success toast with count
        toast.success(`${successfullyUploadedUrls.length} images uploaded successfully`);
        
        // Refresh data after upload
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
      // Clear the file input
      if (multipleFileInputRef.current) {
        multipleFileInputRef.current.value = '';
      }
    }
  };

  // Navigate slider
  const nextSlide = () => {
    if (validGalleryImages.length === 0) return;
    setCurrentSlide((prev) => (prev === validGalleryImages.length - 1 ? 0 : prev + 1));
  };
  
  const prevSlide = () => {
    if (validGalleryImages.length === 0) return;
    setCurrentSlide((prev) => (prev === 0 ? validGalleryImages.length - 1 : prev - 1));
  };

  // Refactored Save function to be called directly
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

      // Update local state with the saved data if needed (optional, as we updated state before saving)
      const savedData = await response.json();
      if (savedData.success && savedData.homestay) {
        // Optional: Synchronize state precisely with server response
        // setDescription(savedData.homestay.description || "");
        // setGalleryImages(savedData.homestay.galleryImages || []);
        toast.success("Changes saved successfully");
      } 
      
      setIsEditingDescription(false); // Ensure edit mode is off
      // No need to call fetchHomestayData here as we already updated the state optimistically
    
    } catch (err) {
      console.error('Error updating homestay portal:', err);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Original saveChanges (now just calls the refactored function)
  const saveChanges = async () => {
    await savePortalData(description, galleryImages);
  };

  // Toggle description editing mode
  const toggleDescriptionEdit = () => {
    setIsEditingDescription(!isEditingDescription);
  };

  // Toggle auto-slide
  const toggleAutoSlide = () => {
    setAutoSlide(prev => !prev);
  };

  // Main Slider Image (Uses validGalleryImages)
  const renderSliderImage = (imageSrc: string, index: number) => {
    // imageSrc will be like "/uploads/[homestayId]/gallery/[filename]"
    // We need to convert it to "/api/images/[homestayId]/gallery/[filename]"
    const apiUrl = imageSrc.replace('/uploads/', '/api/images/') + `?t=${new Date().getTime()}`;
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

  // Thumbnail rendering (Profile + Gallery)
  const renderThumbnail = (imageSrc: string | null, type: 'profile' | 'gallery', index?: number) => {
    const baseClasses = "h-16 w-16 md:h-20 md:w-20 rounded-md overflow-hidden cursor-pointer border-2 transition-all duration-200 relative group flex-shrink-0";
    const activeClass = "border-primary scale-105 shadow-md";
    const inactiveClass = "border-transparent hover:border-primary/50 opacity-80 hover:opacity-100";
    
    const isActive = (type === 'gallery' && validGalleryImages[currentSlideIndex] === imageSrc);

    if (imageSrc && typeof imageSrc === 'string' && imageSrc.trim() !== '') {
      // Convert /uploads/[...] path to /api/images/[...] path
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
          {/* Delete button for gallery thumbs */}
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
      // Render profile initials placeholder if profile image is null/invalid
      console.log("[Portal Thumb] Rendering profile initials placeholder");
      const initials = getInitials(homestay?.homeStayName || '');
      return (
        <div key="profile-thumb-placeholder" className={`${baseClasses} ${inactiveClass} bg-gray-100 flex items-center justify-center`}>
          <span className="text-gray-400 font-semibold text-xl">{initials}</span>
        </div>
      );
    } 
    
    return null; // Return null if gallery image is invalid and not a profile placeholder
  };

  // Update the image URL handling
  const getImageUrl = (filePath?: string) => {
    if (!filePath) return '/placeholder.png';
    // Convert /uploads/ path to /api/images/ path
    return filePath.startsWith('/uploads/') 
      ? filePath.replace('/uploads/', '/api/images/')
      : filePath;
  };

  // Update the image preview handling
  const openPreview = (imageSrc: string | null) => {
    if (imageSrc && typeof imageSrc === 'string' && imageSrc.trim() !== '') {
      // Convert to API URL if needed
      const apiUrl = imageSrc.startsWith('/uploads/') 
        ? imageSrc.replace('/uploads/', '/api/images/')
        : imageSrc;
      setPreviewImage(apiUrl);
    } else {
      setPreviewImage(null);
    }
  };

  // Add auto-refresh functionality
  useEffect(() => {
    const fetchHomestayData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/homestays/${user?.homestayId}?adminUsername=${adminUsername || ''}`);
        
        if (!response.ok) throw new Error('Failed to fetch homestay data');
        
        const data = await response.json();
        setHomestay(data.homestay);
        setDescription(data.homestay.description || "");
        setGalleryImages(data.homestay.galleryImages || []);
        
      } catch (err) {
        console.error('Error fetching homestay data:', err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    if (user?.homestayId) {
      fetchHomestayData();
    }

    // Set up polling every 30 seconds
    const interval = setInterval(() => {
      if (user?.homestayId) {
        fetchHomestayData();
      }
    }, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [user?.homestayId, adminUsername]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!homestay) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header section with improved styling */}
      <div className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Homestay Portal</h1>
        <p className="text-gray-600 mb-6 max-w-2xl">
          Customize how visitors will see your homestay. Create an appealing showcase that highlights your unique experience.
        </p>
        
        {/* Action buttons with improved styling */}
        {homestay && (
          <div className="flex flex-wrap gap-4">
            <Link 
              href={adminUsername 
                ? `/${adminUsername}/homestays/${homestay.homestayId}`
                : `/homestays/${homestay.homestayId}`
              }
              onClick={(e) => {
                // Validate the homestayId before allowing the navigation
                if (!homestay.homestayId || homestay.homestayId === 'undefined') {
                  e.preventDefault();
                  console.error("Invalid homestayId parameter:", homestay.homestayId);
                  toast.error("Error: Invalid homestay ID");
                  // Don't navigate
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

      {/* Main content area with cards layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Left column - Gallery & Manage Gallery */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Gallery Display */}
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
            
            {/* Image Gallery with Editing - Enhanced */}
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
              {/* Slider Navigation (only if multiple images) */}
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
                  {/* Dots indicator */}
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
                      
          {/* Moved Thumbnails Section (Manage Gallery) */}
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
            <h3 className="text-md font-semibold text-gray-700 mb-3">Manage Gallery</h3>
            {/* Ensure flex-wrap and alignment */}
            <div className="flex flex-wrap items-start gap-3">
              {/* Always show profile slot */}
              {renderThumbnail(validProfileImage, 'profile')}

              {/* Render gallery thumbnails */}
              {validGalleryImages.map((img, index) => renderThumbnail(img, 'gallery', index))}
              
              {/* Upload Buttons Container */}
              <div className="flex gap-3">
                {/* Single Upload Button */}
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
                    
                {/* Multiple Upload Button */}
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
              {/* Hidden input for multiple files (keep outside the button) */}
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
        
          {/* Description Section with enhanced design */}
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
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-2" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
              {description ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{description}</p>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 italic mb-4">
                      No description yet. Tell visitors about your homestay.
                    </p>
                    <button
                      onClick={toggleDescriptionEdit}
                      className="px-4 py-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                    >
                      Add description
                    </button>
                  </div>
              )}
            </div>
          )}
          </div>
        </div>
        
        {/* Right column - Homestay Details */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 sticky top-4">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                <span className="inline-block mr-2">🏡</span> Homestay Details
              </h2>
            <Link 
              href="/dashboard/update-info"
                className="inline-flex items-center px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
            >
                <Edit3 className="h-4 w-4 mr-1.5" />
                Update
            </Link>
          </div>
          
            {/* Status indicator */}
            <div className="mb-4">
              <div className={`flex items-center px-3 py-2 rounded-md ${
                homestay?.status === 'active' 
                  ? 'bg-green-50 text-green-700 border border-green-100' 
                  : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  homestay?.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-sm font-medium">
                  Status: {homestay?.status === 'active' ? 'Active & Visible' : 'Pending Approval'}
                </span>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2 text-gray-700 flex items-center">
                  <span className="inline-block w-5 mr-1">🏠</span> Basic Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm border border-gray-100">
                  <p><span className="text-gray-500 font-medium">Name:</span> {homestay?.homeStayName}</p>
                  <p><span className="text-gray-500 font-medium">Village:</span> {homestay?.villageName}</p>
                  <p><span className="text-gray-500 font-medium">Type:</span> {homestay?.homeStayType === 'community' ? 'Community Homestay' : 'Private Homestay'}</p>
                  
                  {/* DHSR Number */}
                  <div className="mt-2 border-t border-gray-200 pt-2">
                    <p className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">DHSR No:</span> 
                      <span className="font-mono bg-primary/10 px-2 py-0.5 rounded text-primary font-medium">
                        {homestay?.dhsrNo || 'Not Assigned'}
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex gap-4 pt-1 border-t border-gray-200 mt-2">
                    <div className="text-center">
                      <span className="block text-lg font-semibold text-primary">{homestay?.homeCount}</span>
                      <span className="text-xs text-gray-500">Homes</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-lg font-semibold text-primary">{homestay?.roomCount}</span>
                      <span className="text-xs text-gray-500">Rooms</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-lg font-semibold text-primary">{homestay?.bedCount}</span>
                      <span className="text-xs text-gray-500">Beds</span>
                    </div>
                  </div>
              </div>
            </div>
            
            <div>
                <h3 className="font-medium mb-2 text-gray-700 flex items-center">
                  <span className="inline-block w-5 mr-1">📍</span> Location
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm border border-gray-100">
                  <p><span className="text-gray-500 font-medium">Address:</span> {homestay?.address.formattedAddress.en}</p>
                  <p><span className="text-gray-500 font-medium">Directions:</span> {homestay?.directions || 'Not provided'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 text-gray-700 flex items-center">
                  <span className="inline-block w-5 mr-1">✨</span> Features & Attractions
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm border border-gray-100">
                  <div>
                    <p className="text-gray-500 font-medium mb-1">Local Attractions:</p>
                    {homestay?.features.localAttractions.length ? (
                      <div className="flex flex-wrap gap-1">
                        {homestay.features.localAttractions.map((item, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-gray-400">None listed</p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-gray-500 font-medium mb-1">Tourism Services:</p>
                    {homestay?.features.tourismServices.length ? (
                      <div className="flex flex-wrap gap-1">
                        {homestay.features.tourismServices.map((item, i) => (
                          <span key={i} className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-gray-400">None listed</p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-gray-500 font-medium mb-1">Infrastructure:</p>
                    {homestay?.features.infrastructure.length ? (
                      <div className="flex flex-wrap gap-1">
                        {homestay.features.infrastructure.map((item, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-gray-400">None listed</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)} // Close on backdrop click
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}> 
          <img 
              src={previewImage} // Already contains /api/images path
            alt="Preview" 
              className="block object-contain max-w-full max-h-full rounded-lg shadow-2xl"
              onError={(e) => {
                console.error("Failed to load preview image:", previewImage);
                setPreviewImage(null); // Close modal on error
              }}
          />
          <button
            onClick={() => setPreviewImage(null)}
              className="absolute -top-4 -right-4 p-2 bg-white/80 text-black rounded-full hover:bg-white shadow-lg"
              aria-label="Close preview"
          >
              <X className="h-5 w-5" />
          </button>
          </div>
        </div>
      )}
    </div>
  );
} 