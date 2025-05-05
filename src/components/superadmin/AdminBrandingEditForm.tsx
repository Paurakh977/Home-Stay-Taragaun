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
  
  const logoRef = useRef<HTMLInputElement>(null);
  const sliderRefs = useRef<HTMLInputElement[]>([]);
  const teamPhotoRefs = useRef<HTMLInputElement[]>([]);

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
        
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 