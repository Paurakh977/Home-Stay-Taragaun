"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon, X, Plus, Camera, Save, Eye, ChevronLeft, ChevronRight, Trash2, Edit3, User } from "lucide-react";
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
    // Calculate all images including profile image
    const allImages = homestay ? 
      [...galleryImages, ...(homestay.profileImage ? [homestay.profileImage] : [])] 
      : [];
    
    if (autoSlide && allImages.length > 1) {
      sliderInterval.current = setInterval(() => {
        setCurrentSlide(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
      }, 5000);
    } else if (sliderInterval.current) {
      clearInterval(sliderInterval.current);
    }

    return () => {
      if (sliderInterval.current) {
        clearInterval(sliderInterval.current);
      }
    };
  }, [autoSlide, galleryImages, homestay, currentSlide]);

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

  // Calculate all images for components to use
  const allImages = homestay ? 
    [...galleryImages, ...(homestay.profileImage ? [homestay.profileImage] : [])]
    : [];

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
    
    try {
      setUploadingGallery(true);
      
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'gallery');
      
      const response = await fetch(`/api/homestays/${user.homestayId}/images`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload gallery image');
      
      const data = await response.json();
      
      // Add new image to gallery
      setGalleryImages(prev => [...prev, data.imageUrl]);
      
    } catch (err) {
      console.error('Error uploading gallery image:', err);
    } finally {
      setUploadingGallery(false);
    }
  };

  // Handle multiple gallery images upload
  const handleMultipleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    
    try {
      setUploadingGallery(true);
      const files = Array.from(e.target.files);
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', 'gallery');
        
        return fetch(`/api/homestays/${user.homestayId}/images`, {
          method: 'POST',
          body: formData,
        })
        .then(response => {
          if (!response.ok) throw new Error('Failed to upload image');
          return response.json();
        })
        .then(data => data.imageUrl);
      });
      
      const newImageUrls = await Promise.all(uploadPromises);
      setGalleryImages(prev => [...prev, ...newImageUrls]);
      
    } catch (err) {
      console.error('Error uploading multiple gallery images:', err);
    } finally {
      setUploadingGallery(false);
      // Reset file input
      if (multipleFileInputRef.current) {
        multipleFileInputRef.current.value = '';
      }
    }
  };

  // Remove gallery image
  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  // Navigate slider
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  // Save portal changes
  const saveChanges = async () => {
    if (!user || !homestay) return;
    
    try {
      setSaving(true);
      
      const response = await fetch(`/api/homestays/${user.homestayId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          galleryImages,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update homestay portal');
      
      // Set editing mode off
      setIsEditingDescription(false);
      
      // Refresh data
      fetchHomestayData(user.homestayId);
      
    } catch (err) {
      console.error('Error updating homestay portal:', err);
    } finally {
      setSaving(false);
    }
  };

  // Toggle description editing mode
  const toggleDescriptionEdit = () => {
    setIsEditingDescription(!isEditingDescription);
  };

  // Toggle auto-slide
  const toggleAutoSlide = () => {
    setAutoSlide(prev => !prev);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
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
        {/* Left column - Gallery */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
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
            <div className="mb-6">
            {allImages.length > 0 ? (
              <>
                  {/* Main Image Display with enhanced styling */}
                  <div className="relative aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden mb-4 shadow-md">
                  <img 
                    src={allImages[currentSlide]} 
                    alt={`Gallery image ${currentSlide + 1}`}
                      className="w-full h-full object-cover transition-opacity duration-500"
                  />
                  
                    {/* Navigation controls with improved styling */}
                  {allImages.length > 1 && (
                    <>
                      <button 
                        onClick={prevSlide}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-all hover:scale-110"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={nextSlide}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-all hover:scale-110"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  
                    {/* Image counter */}
                    <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      {currentSlide + 1} / {allImages.length}
                    </div>
                    
                    {/* Indicator dots with animation */}
                  {allImages.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                      {allImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              currentSlide === index 
                                ? 'bg-white w-4' 
                                : 'bg-white/50 hover:bg-white/80'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                  {/* Thumbnails with improved styling */}
                  <div className="flex flex-wrap gap-3 mt-4">
                  {/* Existing images */}
                  {galleryImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <div 
                          className={`h-20 w-20 rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                            allImages[currentSlide] === image ? 'border-primary shadow-md scale-105' : 'border-transparent hover:border-gray-300'
                        }`}
                        onClick={() => setCurrentSlide(galleryImages.indexOf(image))}
                      >
                        <img 
                          src={image} 
                          alt={`Thumbnail ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removeGalleryImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Profile image thumbnail if exists */}
                  {homestay?.profileImage && (
                    <div className="relative group">
                      <div 
                          className={`h-20 w-20 rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                            allImages[currentSlide] === homestay.profileImage ? 'border-primary shadow-md scale-105' : 'border-transparent hover:border-gray-300'
                        }`}
                        onClick={() => setCurrentSlide(allImages.indexOf(homestay.profileImage!))}
                      >
                        <img 
                          src={homestay.profileImage} 
                          alt="Profile image"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-medium">Profile</span>
                        </div>
                      </div>
                      
                      {/* Profile edit button */}
                        <label className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm">
                        <Edit3 className="h-3 w-3" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleProfileImageUpload}
                        />
                      </label>
                    </div>
                  )}
                  
                    {/* Upload buttons with improved styling */}
                  <div className="flex gap-2">
                    {/* Add single image */}
                      <label className="h-20 w-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors hover:border-primary/50">
                      {uploadingGallery ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                      ) : (
                        <>
                          <Plus className="h-6 w-6 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Add image</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleGalleryImageUpload}
                        disabled={uploadingGallery}
                      />
                    </label>
                    
                    {/* Add multiple images */}
                      <label className="h-20 px-2 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors hover:border-primary/50">
                      <Upload className="h-6 w-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Upload multiple</span>
                      <input 
                        ref={multipleFileInputRef}
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        multiple
                        onChange={handleMultipleImagesUpload}
                        disabled={uploadingGallery}
                      />
                    </label>
                    
                    {/* Add profile if not exists */}
                    {!homestay?.profileImage && (
                        <label className="h-20 px-2 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors hover:border-primary/50">
                        {uploadingProfile ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                        ) : (
                          <>
                            <User className="h-6 w-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Add profile</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleProfileImageUpload}
                          disabled={uploadingProfile}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
                <div className="mb-4">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
                <p className="text-gray-500 mb-6">Upload some images to showcase your homestay</p>
                
                <div className="flex flex-wrap justify-center gap-4">
                  {/* Single image upload */}
                    <label className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md cursor-pointer hover:bg-primary-dark transition shadow-sm">
                    <Plus className="mr-2 h-5 w-5" />
                    <span>Add image</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleGalleryImageUpload}
                      disabled={uploadingGallery}
                    />
                  </label>
                  
                  {/* Multiple image upload */}
                    <label className="inline-flex items-center px-4 py-2 border border-primary text-primary font-medium rounded-md cursor-pointer hover:bg-primary hover:text-white transition-colors shadow-sm">
                    <Upload className="mr-2 h-5 w-5" />
                    <span>Upload multiple</span>
                    <input 
                      ref={multipleFileInputRef}
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImagesUpload}
                      disabled={uploadingGallery}
                    />
                  </label>
                </div>
              </div>
            )}
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

      {/* Image Preview Modal with enhanced styling */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
} 