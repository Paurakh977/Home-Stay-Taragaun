"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon, X, Plus, Camera, Save, Eye, ChevronLeft, ChevronRight, Trash2, Edit3, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function PortalPage() {
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

  // Load user data and homestay information
  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        setUser(userData);
        fetchHomestayData(userData.homestayId);
      } catch (err) {
        console.error("Error parsing user data:", err);
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  // Auto-slide functionality
  useEffect(() => {
    const allValidDisplayImages = [
      ...(homestay?.profileImage ? [homestay.profileImage] : []),
      ...galleryImages,
    ].filter(img => typeof img === 'string' && img.trim().startsWith('/uploads/'));
    
    if (autoSlide && allValidDisplayImages.length > 1) {
      sliderInterval.current = setInterval(() => {
        setCurrentSlide(prev => (prev === allValidDisplayImages.length - 1 ? 0 : prev + 1));
      }, 5000);
    } else if (sliderInterval.current) {
      clearInterval(sliderInterval.current);
    }

    return () => {
      if (sliderInterval.current) {
        clearInterval(sliderInterval.current);
      }
    };
  }, [autoSlide, homestay?.profileImage, galleryImages, currentSlide]);

  // Fetch homestay data
  const fetchHomestayData = async (homestayId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/homestays/${homestayId}`);
      
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
      
      const response = await fetch(`/api/homestays/${user.homestayId}/images`, {
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

  // Handle single gallery image upload
  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    let newImageUrl: string | null = null;
    try {
      setUploadingGallery(true);
      
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/homestays/${user.homestayId}/images`, {
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
          // Explicitly refetch after save
          if (user) {
            console.log("[Upload Single] Refetching homestay data after save...");
            await fetchHomestayData(user.homestayId);
          }
      } else {
         console.error('Upload succeeded but did not return a valid image URL.');
         // Optionally show an error toast to the user
      }
      
    } catch (err) {
      console.error('Error uploading gallery image:', err);
      // Optionally show an error toast
    } finally {
      setUploadingGallery(false);
      // No need for save logic here anymore, it's handled in the try block
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
        
        return fetch(`/api/homestays/${user.homestayId}/images`, {
          method: 'POST',
          body: formData,
        })
        .then(async response => { // Make async to parse json
          if (!response.ok) {
            console.error('Failed upload for file:', file.name);
            return null; // Indicate failure for this file
          }
          const data = await response.json();
          return data.imageUrl as string; // Ensure result is string or null
        })
      });
      
      const results = await Promise.all(uploadPromises);
      // Filter out nulls *before* updating state
      successfullyUploadedUrls = results.filter((url): url is string => url !== null);
      
      if (successfullyUploadedUrls.length > 0) {
        // Update state with successfully uploaded images (guaranteed to be string[])
        setGalleryImages(prev => [...prev, ...successfullyUploadedUrls]);
      }
      
    } catch (err) {
      console.error('Error uploading multiple gallery images:', err);
    } finally {
      setUploadingGallery(false);
      // Reset file input
      if (multipleFileInputRef.current) {
        multipleFileInputRef.current.value = '';
      }
      // If at least one upload was successful, trigger save
      if (successfullyUploadedUrls.length > 0 && user) {
         // Use the state update function's callback to ensure state is set before saving
        setGalleryImages(currentImages => {
          const imagesToSave = [...currentImages]; // Use the latest state
          savePortalData(description, imagesToSave).then(() => {
            // Refetch AFTER save completes
            if (user) { // Check user again just in case
              console.log("[Upload Multiple] Refetching homestay data after save...");
              fetchHomestayData(user.homestayId);
            }
          });
          return currentImages; // Return the state passed to the callback
        });
      }
    }
  };

  // Remove gallery image and trigger save
  const removeGalleryImage = async (imageUrlToRemove: string) => {
    const updatedImages = galleryImages.filter(img => img !== imageUrlToRemove);
    setGalleryImages(updatedImages);
    // Immediately save the change
    if (user) {
        await savePortalData(description, updatedImages);
    }
  };

  // Navigate slider
  const nextSlide = () => {
    const allValidDisplayImages = [
      ...(homestay?.profileImage ? [homestay.profileImage] : []),
      ...galleryImages,
    ].filter(img => typeof img === 'string' && img.trim().startsWith('/uploads/'));
    if (allValidDisplayImages.length === 0) return;
    setCurrentSlide((prev) => (prev === allValidDisplayImages.length - 1 ? 0 : prev + 1));
  };
  
  const prevSlide = () => {
    const allValidDisplayImages = [
      ...(homestay?.profileImage ? [homestay.profileImage] : []),
      ...galleryImages,
    ].filter(img => typeof img === 'string' && img.trim().startsWith('/uploads/'));
    if (allValidDisplayImages.length === 0) return;
    setCurrentSlide((prev) => (prev === 0 ? allValidDisplayImages.length - 1 : prev - 1));
  };

  // Refactored Save function to be called directly
  const savePortalData = async (currentDescription: string, currentGalleryImages: string[]) => {
      if (!user) {
          console.error("Save failed: User not available");
          return; 
      }
    
      setSaving(true);
      try {
      const response = await fetch(`/api/homestays/${user.homestayId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
                  description: currentDescription,       // Use passed description
                  galleryImages: currentGalleryImages, // Use passed gallery images
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
          } 
          
          setIsEditingDescription(false); // Ensure edit mode is off
          // No need to call fetchHomestayData here as we already updated the state optimistically
      
    } catch (err) {
      console.error('Error updating homestay portal:', err);
          // Maybe add toast notification here
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
    const filename = imageSrc.split('/').pop();
    if (!filename) return null; // Skip if filename invalid
    const apiUrl = `/api/images/${filename}?t=${new Date().getTime()}`;
    console.log(`[Portal Slider] Rendering image ${index} via API: ${apiUrl}`);
    return (
      <div
        key={index}
        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
          index === currentSlideIndex ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => openPreview(apiUrl)} // Open preview with API URL
      >
        <img 
          src={apiUrl}
          alt={`Gallery Image ${index + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            console.warn(`[Portal Slider] Failed to load image via API: ${apiUrl}`);
            // Optionally replace with a placeholder or hide
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
    
    // Determine if this thumbnail corresponds to the current main slide
    const isActive = (type === 'gallery' && validGalleryImages[currentSlideIndex] === imageSrc);

    if (imageSrc && typeof imageSrc === 'string' && imageSrc.trim() !== '') {
      const filename = imageSrc.split('/').pop();
      if (!filename) return null; // Skip invalid paths
      const apiUrl = `/api/images/${filename}?t=${new Date().getTime()}`;
      console.log(`[Portal Thumb] Rendering ${type} thumb via API: ${apiUrl}`);

      return (
        <div 
          key={type === 'profile' ? 'profile-thumb' : `gallery-thumb-${index}`}
          className={`${baseClasses} ${isActive ? activeClass : inactiveClass}`}
          onClick={() => {
            if (type === 'gallery' && index !== undefined) {
                // Find the index within validGalleryImages to set the main slide
                const validIndex = validGalleryImages.findIndex(img => img === imageSrc);
                if (validIndex !== -1) setCurrentSlide(validIndex);
            } else {
                // Clicking profile thumb could show it in preview?
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
                 // Simple fallback: hide broken image
                (e.target as HTMLImageElement).style.display = 'none';
                // Consider adding initials here for profile if needed
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
                e.stopPropagation(); // Prevent triggering the main onClick
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

  // Ensure the modal also uses the API path
  const openPreview = (imageSrc: string | null) => {
    if (imageSrc && typeof imageSrc === 'string' && imageSrc.trim() !== '') {
        // Expecting an API URL like /api/images/filename.jpg?t=...
        setPreviewImage(imageSrc);
    } else {
        setPreviewImage(null);
    }
  };

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
              href={`/homestays/${homestay.homestayId}`}
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