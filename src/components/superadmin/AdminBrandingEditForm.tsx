'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import Image from 'next/image';
import { 
  CameraIcon, 
  Trash2Icon, 
  PlusCircleIcon, 
  XCircleIcon,
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  YoutubeIcon
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

interface BrandingFormProps {
  adminData: any;
  onSuccess: () => void;
}

export function AdminBrandingEditForm({ adminData, onSuccess }: BrandingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [sliderPreviews, setSliderPreviews] = useState<string[]>([]);
  const [teamPhotoPreviews, setTeamPhotoPreviews] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<{name: string; role: string; photoPath?: string}[]>([]);
  
  // New state for featured section and testimonials
  const [features, setFeatures] = useState<{icon: string; title: string; description: string; imagePath: string}[]>([]);
  const [featureImagePreviews, setFeatureImagePreviews] = useState<string[]>([]);
  const [testimonials, setTestimonials] = useState<{quote: string; author: string; location: string; avatarPath: string}[]>([]);
  const [testimonialAvatarPreviews, setTestimonialAvatarPreviews] = useState<string[]>([]);
  
  const logoRef = useRef<HTMLInputElement>(null);
  const sliderRefs = useRef<HTMLInputElement[]>([]);
  const teamPhotoRefs = useRef<HTMLInputElement[]>([]);
  
  // New refs for featured section and testimonial images
  const featureImageRefs = useRef<HTMLInputElement[]>([]);
  const testimonialAvatarRefs = useRef<HTMLInputElement[]>([]);

  // Initialize form with existing admin data
  const form = useForm({
    defaultValues: {
      brandName: adminData?.branding?.brandName || '',
      brandDescription: adminData?.branding?.brandDescription || '',
      address: adminData?.branding?.contactInfo?.address || '',
      email: adminData?.branding?.contactInfo?.email || '',
      phone: adminData?.branding?.contactInfo?.phone || '',
      facebook: adminData?.branding?.contactInfo?.socialLinks?.facebook || '',
      instagram: adminData?.branding?.contactInfo?.socialLinks?.instagram || '',
      twitter: adminData?.branding?.contactInfo?.socialLinks?.twitter || '',
      tiktok: adminData?.branding?.contactInfo?.socialLinks?.tiktok || '',
      youtube: adminData?.branding?.contactInfo?.socialLinks?.youtube || '',
      story: adminData?.branding?.aboutUs?.story || '',
      mission: adminData?.branding?.aboutUs?.mission || '',
      vision: adminData?.branding?.aboutUs?.vision || '',
    }
  });

  // Initialize previews and team members from admin data
  useEffect(() => {
    if (adminData?.branding) {
      // Set logo preview
      if (adminData.branding.logoPath) {
        setLogoPreview(getImageUrl(adminData.branding.logoPath));
      }
      
      // Set slider previews
      if (adminData.branding.sliderImages && adminData.branding.sliderImages.length > 0) {
        setSliderPreviews(adminData.branding.sliderImages.map((img: string) => getImageUrl(img)));
      }
      
      // Set team members and their photo previews
      if (adminData.branding.aboutUs?.team && adminData.branding.aboutUs.team.length > 0) {
        const team = adminData.branding.aboutUs.team;
        setTeamMembers(team.map((member: any) => ({
          name: member.name || '',
          role: member.role || '',
          photoPath: member.photoPath || ''
        })));
        setTeamPhotoPreviews(team.map((member: any) => 
          member.photoPath ? getImageUrl(member.photoPath) : ''
        ));
      }
      
      // Set featured section data
      if (adminData.branding.featuredSection?.features && adminData.branding.featuredSection.features.length > 0) {
        const featuredItems = adminData.branding.featuredSection.features;
        setFeatures(featuredItems.map((feature: any) => ({
          icon: feature.icon || '',
          title: feature.title || '',
          description: feature.description || '',
          imagePath: feature.imagePath || ''
        })));
        setFeatureImagePreviews(featuredItems.map((feature: any) => 
          feature.imagePath ? getImageUrl(feature.imagePath) : ''
        ));
      } else {
        // Set default features if none exist
        setFeatures([
          { icon: '🏠', title: 'Authentic Local Experience', description: 'Stay with local families and experience authentic Nepali hospitality and culture.', imagePath: '/images/features/feature-1.jpg' },
          { icon: '🍽️', title: 'Traditional Cuisine', description: 'Enjoy homemade Nepali dishes prepared with locally sourced organic ingredients.', imagePath: '/images/features/feature-2.jpg' },
          { icon: '🌿', title: 'Scenic Locations', description: 'Our home stays are situated in beautiful locations with stunning mountain views.', imagePath: '/images/features/feature-3.jpg' },
          { icon: '🧳', title: 'Personalized Service', description: 'Each home stay offers personalized service to make your stay comfortable and memorable.', imagePath: '/images/features/feature-4.jpg' }
        ]);
        setFeatureImagePreviews([
          '/images/features/feature-1.jpg',
          '/images/features/feature-2.jpg',
          '/images/features/feature-3.jpg',
          '/images/features/feature-4.jpg'
        ]);
      }
      
      // Set testimonials data
      if (adminData.branding.testimonials && adminData.branding.testimonials.length > 0) {
        const testimonialsData = adminData.branding.testimonials;
        setTestimonials(testimonialsData.map((testimonial: any) => ({
          quote: testimonial.quote || '',
          author: testimonial.author || '',
          location: testimonial.location || '',
          avatarPath: testimonial.avatarPath || ''
        })));
        setTestimonialAvatarPreviews(testimonialsData.map((testimonial: any) => 
          testimonial.avatarPath ? getImageUrl(testimonial.avatarPath) : ''
        ));
      } else {
        // Set default testimonials if none exist
        setTestimonials([
          { quote: 'Our stay at the Hamro Home Stay was incredible. The hospitality was unmatched, and we felt like part of the family. The views were breathtaking!', author: 'Sarah Johnson', location: 'United States', avatarPath: '/images/testimonials/avatar-1.jpg' },
          { quote: 'The authentic food, the warm hospitality, and the cultural experience made our stay unforgettable. Definitely coming back next year!', author: 'James Wilson', location: 'United Kingdom', avatarPath: '/images/testimonials/avatar-2.jpg' },
          { quote: 'If you want to experience the real Nepal, this is the place. Our host family was amazing, and the home-cooked meals were the best we had during our entire trip.', author: 'Emma Thompson', location: 'Australia', avatarPath: '/images/testimonials/avatar-3.jpg' },
          { quote: 'The perfect blend of comfort and authentic cultural experience. Waking up to mountain views every morning was magical!', author: 'David Chen', location: 'Canada', avatarPath: '/images/testimonials/avatar-4.jpg' }
        ]);
        setTestimonialAvatarPreviews([
          '/images/testimonials/avatar-1.jpg',
          '/images/testimonials/avatar-2.jpg',
          '/images/testimonials/avatar-3.jpg',
          '/images/testimonials/avatar-4.jpg'
        ]);
      }
    }
  }, [adminData]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const newPreviews = [...sliderPreviews];
      newPreviews[index] = URL.createObjectURL(file);
      setSliderPreviews(newPreviews);
    }
  };

  const handleTeamPhotoChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const newPreviews = [...teamPhotoPreviews];
      newPreviews[index] = URL.createObjectURL(file);
      setTeamPhotoPreviews(newPreviews);
    }
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: '', role: '' }]);
    setTeamPhotoPreviews([...teamPhotoPreviews, '']);
  };

  const removeTeamMember = (index: number) => {
    const newMembers = [...teamMembers];
    newMembers.splice(index, 1);
    setTeamMembers(newMembers);
    
    const newPreviews = [...teamPhotoPreviews];
    newPreviews.splice(index, 1);
    setTeamPhotoPreviews(newPreviews);
  };

  const updateTeamMember = (index: number, field: 'name' | 'role', value: string) => {
    const newMembers = [...teamMembers];
    newMembers[index][field] = value;
    setTeamMembers(newMembers);
  };

  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      
      // Add username
      formData.append('username', adminData.username);
      
      // Add basic branding fields
      Object.entries(values).forEach(([key, value]) => {
        if (value) formData.append(key, value as string);
      });
      
      // Add logo if changed
      if (logoRef.current?.files?.[0]) {
        formData.append('logo', logoRef.current.files[0]);
      }
      
      // Add slider images if changed
      sliderRefs.current.forEach((ref, index) => {
        if (ref?.files?.[0]) {
          formData.append(`slider_${index}`, ref.files[0]);
        }
      });
      
      // Add team members
      teamMembers.forEach((member, index) => {
        formData.append(`teamMember_${index}_name`, member.name);
        formData.append(`teamMember_${index}_role`, member.role);
        
        // Add team photos if changed
        if (teamPhotoRefs.current[index]?.files?.[0]) {
          formData.append(`team_${index}`, teamPhotoRefs.current[index].files[0]);
        }
      });
      
      // Add features
      features.forEach((feature, index) => {
        formData.append(`feature_${index}_icon`, feature.icon);
        formData.append(`feature_${index}_title`, feature.title);
        formData.append(`feature_${index}_description`, feature.description);
        
        // Add feature images if changed
        if (featureImageRefs.current[index]?.files?.[0]) {
          formData.append(`feature_image_${index}`, featureImageRefs.current[index].files[0]);
        } else if (feature.imagePath) {
          formData.append(`feature_${index}_imagePath`, feature.imagePath);
        }
      });
      
      // Add testimonials
      testimonials.forEach((testimonial, index) => {
        formData.append(`testimonial_${index}_quote`, testimonial.quote);
        formData.append(`testimonial_${index}_author`, testimonial.author);
        formData.append(`testimonial_${index}_location`, testimonial.location);
        
        // Add testimonial avatars if changed
        if (testimonialAvatarRefs.current[index]?.files?.[0]) {
          formData.append(`testimonial_avatar_${index}`, testimonialAvatarRefs.current[index].files[0]);
        } else if (testimonial.avatarPath) {
          formData.append(`testimonial_${index}_avatarPath`, testimonial.avatarPath);
        }
      });
      
      // Submit form data
      const response = await fetch(`/api/superadmin/users/${adminData._id}/branding`, {
        method: 'PATCH',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update branding');
      }
      
      toast.success('Branding updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating branding:', error);
      toast.error('Failed to update branding');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a slider image
  const deleteSliderImage = async (index: number) => {
    if (!adminData?.branding?.sliderImages || index >= adminData.branding.sliderImages.length) {
      toast.error('Invalid slider image');
      return;
    }

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this slider image?')) {
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('deleteSliderIndex', index.toString());

      const response = await fetch(`/api/superadmin/users/${adminData._id}/branding`, {
        method: 'PATCH',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete slider image');
      }

      // Update the UI
      const newPreviews = [...sliderPreviews];
      newPreviews.splice(index, 1);
      setSliderPreviews(newPreviews);

      toast.success('Slider image deleted successfully');
    } catch (error) {
      console.error('Error deleting slider image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete slider image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const newPreviews = [...featureImagePreviews];
      newPreviews[index] = URL.createObjectURL(file);
      setFeatureImagePreviews(newPreviews);
    }
  };

  const handleTestimonialAvatarChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const newPreviews = [...testimonialAvatarPreviews];
      newPreviews[index] = URL.createObjectURL(file);
      setTestimonialAvatarPreviews(newPreviews);
    }
  };

  const updateFeature = (index: number, field: keyof typeof features[0], value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFeatures(newFeatures);
  };

  const updateTestimonial = (index: number, field: keyof typeof testimonials[0], value: string) => {
    const newTestimonials = [...testimonials];
    newTestimonials[index] = { ...newTestimonials[index], [field]: value };
    setTestimonials(newTestimonials);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Basic Information</h3>
            
            <FormField
              control={form.control}
              name="brandName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="brandDescription"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Brand Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Logo</h3>
            <div className="flex items-center space-x-4">
              <div className="relative h-24 w-24 rounded-md overflow-hidden border bg-gray-50">
                {logoPreview ? (
                  <Image 
                    src={logoPreview} 
                    alt="Logo preview" 
                    fill 
                    className="object-cover" 
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    No logo
                  </div>
                )}
              </div>
              
              <div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => logoRef.current?.click()}
                  className="flex items-center"
                >
                  <CameraIcon className="mr-2 h-4 w-4" />
                  Change Logo
                </Button>
                <input 
                  type="file" 
                  ref={logoRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleLogoChange} 
                />
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-4">Slider Images</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={`slider-${index}`} className="relative">
                <div className="relative h-32 w-full rounded-md overflow-hidden border bg-gray-50">
                  {sliderPreviews[index] ? (
                    <Image 
                      src={sliderPreviews[index]} 
                      alt={`Slider ${index+1}`} 
                      fill 
                      className="object-cover" 
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      Slider {index+1}
                    </div>
                  )}
                </div>
                
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleSliderChange(e, index)}
                  ref={(el) => {
                    if (el) sliderRefs.current[index] = el;
                  }} 
                />
                
                <div className="absolute bottom-1 right-1 flex space-x-1">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-full bg-white/80"
                    onClick={() => sliderRefs.current[index]?.click()}
                  >
                    <CameraIcon className="h-4 w-4" />
                  </Button>
                  
                  {sliderPreviews[index] && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-red-100"
                      onClick={() => deleteSliderImage(index)}
                    >
                      <Trash2Icon className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <h4 className="text-md font-medium mt-6 mb-4">Social Media Links</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="facebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <FacebookIcon className="h-4 w-4 mr-2" />
                    Facebook
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://facebook.com/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <InstagramIcon className="h-4 w-4 mr-2" />
                    Instagram
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://instagram.com/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <TwitterIcon className="h-4 w-4 mr-2" />
                    Twitter
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://twitter.com/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="youtube"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <YoutubeIcon className="h-4 w-4 mr-2" />
                    YouTube
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://youtube.com/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-medium mb-4">About Us</h3>
          
          <FormField
            control={form.control}
            name="story"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Our Story</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <FormField
              control={form.control}
              name="mission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mission</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="vision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vision</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Separator />
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Team Members</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addTeamMember}
            >
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
          
          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No team members added yet
            </div>
          ) : (
            <div className="space-y-6">
              {teamMembers.map((member, index) => (
                <div key={`team-${index}`} className="p-4 border rounded-md bg-gray-50 relative">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full text-gray-400 hover:text-red-500"
                    onClick={() => removeTeamMember(index)}
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </Button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Photo</h4>
                      <div className="relative h-24 w-24 rounded-md overflow-hidden border bg-gray-50">
                        {teamPhotoPreviews[index] ? (
                          <Image 
                            src={teamPhotoPreviews[index]} 
                            alt={`Team Member ${index+1}`} 
                            fill 
                            className="object-cover" 
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400">
                            No photo
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => teamPhotoRefs.current[index]?.click()}
                      >
                        <CameraIcon className="h-4 w-4 mr-2" />
                        Upload Photo
                      </Button>
                      
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleTeamPhotoChange(e, index)}
                        ref={(el) => {
                          if (el) teamPhotoRefs.current[index] = el;
                        }} 
                      />
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Name</h4>
                      <Input 
                        value={member.name} 
                        onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                        placeholder="Full Name" 
                      />
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Role/Position</h4>
                      <Input 
                        value={member.role} 
                        onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                        placeholder="e.g. Manager" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <Separator />
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Featured Section</h3>
          </div>
          
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={`feature-${index}`} className="p-4 border rounded-md bg-gray-50 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Icon</h4>
                        <Input 
                          value={feature.icon} 
                          onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                          placeholder="Emoji or icon (e.g. 🏠)" 
                        />
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Title</h4>
                        <Input 
                          value={feature.title} 
                          onChange={(e) => updateFeature(index, 'title', e.target.value)}
                          placeholder="Feature title" 
                        />
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <Textarea 
                          value={feature.description} 
                          onChange={(e) => updateFeature(index, 'description', e.target.value)}
                          placeholder="Feature description" 
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Image</h4>
                    <div className="relative h-48 w-full rounded-md overflow-hidden border bg-gray-50">
                      {featureImagePreviews[index] ? (
                        <Image 
                          src={featureImagePreviews[index]} 
                          alt={`Feature ${index+1}`} 
                          fill 
                          className="object-cover" 
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => featureImageRefs.current[index]?.click()}
                    >
                      <CameraIcon className="h-4 w-4 mr-2" />
                      Change Image
                    </Button>
                    
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleFeatureImageChange(e, index)}
                      ref={(el) => {
                        if (el) featureImageRefs.current[index] = el;
                      }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Testimonials</h3>
          </div>
          
          <div className="space-y-6">
            {testimonials.map((testimonial, index) => (
              <div key={`testimonial-${index}`} className="p-4 border rounded-md bg-gray-50 relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Avatar</h4>
                    <div className="relative h-24 w-24 rounded-full overflow-hidden border bg-gray-50">
                      {testimonialAvatarPreviews[index] ? (
                        <Image 
                          src={testimonialAvatarPreviews[index]} 
                          alt={`${testimonial.author}'s avatar`} 
                          fill 
                          className="object-cover" 
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                          No avatar
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => testimonialAvatarRefs.current[index]?.click()}
                    >
                      <CameraIcon className="h-4 w-4 mr-2" />
                      Change Avatar
                    </Button>
                    
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleTestimonialAvatarChange(e, index)}
                      ref={(el) => {
                        if (el) testimonialAvatarRefs.current[index] = el;
                      }} 
                    />
                    
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium">Author Info</h4>
                      <Input 
                        value={testimonial.author} 
                        onChange={(e) => updateTestimonial(index, 'author', e.target.value)}
                        placeholder="Author name" 
                        className="mb-2"
                      />
                      <Input 
                        value={testimonial.location} 
                        onChange={(e) => updateTestimonial(index, 'location', e.target.value)}
                        placeholder="Location (e.g., United States)" 
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <h4 className="font-medium mb-2">Testimonial</h4>
                    <Textarea 
                      value={testimonial.quote} 
                      onChange={(e) => updateTestimonial(index, 'quote', e.target.value)}
                      placeholder="Testimonial quote" 
                      rows={8}
                      className="h-full min-h-[200px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 