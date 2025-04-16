'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  UserPlus, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  X, 
  ChevronsUpDown,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils"; 
import { Badge } from "@/components/ui/badge";

interface User {
  _id: string;
  username: string;
  email: string;
  contactNumber: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface UserManagementFormProps {
  onUserAdded: (user: User) => void;
}

interface TeamMember {
  name: string;
  role: string;
  photoPath?: string;
  photoFile?: File;
  photoPreview?: string;
}

export function UserManagementForm({ onUserAdded }: UserManagementFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Branding states
  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [sliderImages, setSliderImages] = useState<File[]>([]);
  const [sliderPreviews, setSliderPreviews] = useState<string[]>([]);
  
  // Contact info states
  const [address, setAddress] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  
  // About us states
  const [story, setStory] = useState('');
  const [mission, setMission] = useState('');
  const [vision, setVision] = useState('');
  const [team, setTeam] = useState<TeamMember[]>([
    { name: '', role: '' }
  ]);

  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const sliderInputRef = useRef<HTMLInputElement>(null);

  // Auto-switch to branding tab if admin role selected
  useEffect(() => {
    if (role === 'admin' && activeTab === 'basic') {
      // Don't auto-switch if the user has already filled in basic info
      if (username && email && password && contactNumber) {
        setActiveTab('branding');
      }
    }
  }, [role]);

  // Validate form field
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'contactNumber':
        return value.length === 0
          ? 'Contact number is required' 
          : /^\d{10}$/.test(value) 
            ? '' 
            : 'Contact number must be exactly 10 digits';
      case 'email':
        return value.length === 0
          ? 'Email is required'
          : /^\S+@\S+\.\S+$/.test(value)
            ? ''
            : 'Please enter a valid email address';
      default:
        return '';
    }
  };

  // Handle field change with validation
  const handleChange = (field: string, value: string) => {
    // Update the field value
    switch (field) {
      case 'username':
        setUsername(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'contactNumber':
        // Only allow digits and limit to 10 characters
        const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
        setContactNumber(digitsOnly);
        break;
      case 'role':
        setRole(value);
        break;
    }

    // Validate and set any errors
    if (field === 'email' || field === 'contactNumber') {
      const errorMessage = validateField(field, field === 'contactNumber' ? value.replace(/\D/g, '') : value);
      setErrors(prev => ({
        ...prev,
        [field]: errorMessage
      }));
    }
  };

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const target = event.target;
        if (target && target.result) {
          setLogoPreview(target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle slider images selection
  const handleSliderImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      
      // Add new files to state
      setSliderImages(prev => [...prev, ...newFiles]);
      
      // Create previews for each new file
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const target = event.target;
          if (target && target.result) {
            setSliderPreviews(prev => [...prev, target.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Handle removing a slider image
  const handleRemoveSliderImage = (index: number) => {
    setSliderImages(prev => prev.filter((_, i) => i !== index));
    setSliderPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle updating team member info
  const handleTeamMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    setTeam(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Handle team member photo selection
  const handleTeamPhotoChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const target = event.target;
        if (target && target.result) {
          setTeam(prev => {
            const updated = [...prev];
            updated[index] = { 
              ...updated[index], 
              photoFile: file,
              photoPreview: target.result as string
            };
            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove team member photo
  const removeTeamPhoto = (index: number) => {
    setTeam(prev => {
      const updated = [...prev];
      updated[index] = { 
        ...updated[index], 
        photoFile: undefined,
        photoPreview: undefined
      };
      return updated;
    });
  };

  // Add a new team member
  const addTeamMember = () => {
    setTeam(prev => [...prev, { name: '', role: '' }]);
  };

  // Remove a team member
  const removeTeamMember = (index: number) => {
    if (team.length > 1) {
      setTeam(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Make uploadFiles() more streamlined
  const uploadFiles = async () => {
    if (role !== 'admin') return { success: true, paths: {} };

    try {
      const formData = new FormData();
      
      // Only add files that exist
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      
      // Add slider images efficiently
      sliderImages.forEach((file, index) => {
        formData.append(`slider_${index}`, file);
      });
      
      // Add team member photos efficiently
      team.forEach((member, index) => {
        if (member.photoFile) {
          formData.append(`team_${index}`, member.photoFile);
        }
      });
      
      // Add username for folder path
      formData.append('username', username);
      
      // Log what we're uploading for debugging
      console.log(`Uploading assets for ${username}:`, {
        logo: logoFile ? logoFile.name : 'none',
        sliders: sliderImages.length,
        teamPhotos: team.filter(m => m.photoFile).length
      });
      
      const response = await fetch('/api/superadmin/uploads/branding', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload branding assets');
      }
      
      return data;
    } catch (err: unknown) {
      console.error('Upload error:', err);
      throw err;
    }
  };

  // Make handleSubmit more efficient
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Basic validation
      if (!username || !password || !email || !contactNumber) {
        setError('All required fields must be filled in');
        setIsLoading(false);
        return;
      }

      // Contact number validation
      if (contactNumber.length !== 10 || !/^\d{10}$/.test(contactNumber)) {
        setErrors(prev => ({
          ...prev,
          contactNumber: 'Contact number must be exactly 10 digits'
        }));
        setIsLoading(false);
        return;
      }

      // Email validation
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        setErrors(prev => ({
          ...prev,
          email: 'Please enter a valid email address'
        }));
        setIsLoading(false);
        return;
      }

      let uploadedPaths = { logoPath: '', sliderPaths: [], teamPhotoPaths: [] };
      
      // Upload files for admin role
      if (role === 'admin') {
        // Validate branding fields
        if (!brandName || !brandDescription || !logoFile || sliderImages.length === 0) {
          toast.error('Brand name, description, logo and at least one slider image are required');
          setIsLoading(false);
          return;
        }
        
        // Upload files
        try {
          const uploadResult = await uploadFiles();
          if (uploadResult.success) {
            uploadedPaths = uploadResult.paths;
          } else {
            throw new Error('File upload failed');
          }
        } catch (uploadErr) {
          console.error('File upload error:', uploadErr);
          toast.error('Failed to upload files. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      // Prepare the user data
      const userData: any = {
        username,
        password,
        email,
        contactNumber,
        role,
      };

      // Add properly structured branding data for admin role
      if (role === 'admin') {
        // Create branding object according to User model schema
        userData.branding = {
          brandName,
          brandDescription,
          logoPath: uploadedPaths.logoPath,
          sliderImages: uploadedPaths.sliderPaths,
          contactInfo: {
            address,
            email: businessEmail,
            phone,
            socialLinks: {
              facebook,
              instagram,
              twitter,
              tiktok,
              youtube
            }
          },
          aboutUs: {
            story,
            mission,
            vision,
            team: team.map((member, index) => ({
              name: member.name,
              role: member.role,
              photoPath: uploadedPaths.teamPhotoPaths[index] || ''
            }))
          }
        };
      }

      console.log("Submitting user data:", {
        ...userData,
        password: '******' // Don't log the actual password
      });

      const response = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = data.message || 'Failed to create user';
        
        if (response.status === 409) {
          errorMessage = 'Username or email already exists.';
        } else if (data.errors) {
          const firstErrorField = Object.keys(data.errors)[0];
          errorMessage = data.errors[firstErrorField].message;
        }
        
        throw new Error(errorMessage);
      }

      // Success handling
      toast.success('User created successfully!');
      onUserAdded(data.user as User);

      // Reset form
      setUsername('');
      setPassword('');
      setEmail('');
      setContactNumber('');
      setShowPassword(false);
      setRole('admin');
      setBrandName('');
      setBrandDescription('');
      setLogoFile(null);
      setLogoPreview(null);
      setSliderImages([]);
      setSliderPreviews([]);
      setAddress('');
      setBusinessEmail('');
      setPhone('');
      setFacebook('');
      setInstagram('');
      setTwitter('');
      setTiktok('');
      setYoutube('');
      setStory('');
      setMission('');
      setVision('');
      setTeam([{ name: '', role: '' }]);
    } catch (err: unknown) {
      console.error('User creation error:', err);
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-6 bg-white rounded-lg shadow-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b">
          <div className="px-4 py-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {role === 'admin' ? 'New Admin User' : 
               role === 'superadmin' ? 'New Superadmin User' : 'New Officer User'}
            </h2>
            <Badge variant={role === 'admin' ? 'default' : role === 'superadmin' ? 'destructive' : 'secondary'}>
              {role}
            </Badge>
          </div>
          <TabsList className="grid w-full grid-cols-3 bg-muted/20 p-0 h-12">
            <TabsTrigger value="basic" className="data-[state=active]:bg-background rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary">
              Basic Information
            </TabsTrigger>
            {role === 'admin' && (
              <>
                <TabsTrigger value="branding" className="data-[state=active]:bg-background rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary">
                  Branding
                </TabsTrigger>
                <TabsTrigger value="about" className="data-[state=active]:bg-background rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary">
                  Contact & About
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        <form onSubmit={handleSubmit}>
          <TabsContent value="basic" className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username*
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="username"
                  required
                  disabled={isLoading}
                  className={cn(
                    "h-10",
                    errors.username ? "border-red-500 focus-visible:ring-red-500" : ""
                  )}
                />
                {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email*
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="user@example.com"
                  required
                  disabled={isLoading}
                  className={cn(
                    "h-10",
                    errors.email ? "border-red-500 focus-visible:ring-red-500" : ""
                  )}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password*
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Minimum 4 characters"
                    required
                    disabled={isLoading}
                    minLength={4}
                    className="pr-10 h-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber" className="text-sm font-medium">
                  Contact Number* (10 digits)
                </Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => handleChange('contactNumber', e.target.value)}
                  placeholder="10 digit number"
                  required
                  disabled={isLoading}
                  className={cn(
                    "h-10",
                    errors.contactNumber ? "border-red-500 focus-visible:ring-red-500" : ""
                  )}
                  pattern="\\d{10}"
                  title="Please enter exactly 10 digits"
                  inputMode="numeric"
                />
                {errors.contactNumber && <p className="text-xs text-red-500">{errors.contactNumber}</p>}
                {contactNumber && contactNumber.length !== 10 && (
                  <div className="flex items-center mt-1">
                    <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-300",
                          contactNumber.length < 5 ? "bg-red-500" : 
                          contactNumber.length < 8 ? "bg-amber-500" : "bg-green-500"
                        )}
                        style={{ width: `${(contactNumber.length / 10) * 100}%` }}
                      />
                    </div>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {contactNumber.length}/10
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  User Role*
                </Label>
                <Select
                  value={role}
                  onValueChange={(value) => handleChange('role', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin" className="flex items-center gap-2">
                      <Badge className="bg-blue-500">Admin</Badge>
                      <span>Can manage their own homestays</span>
                    </SelectItem>
                    <SelectItem value="superadmin" className="flex items-center gap-2">
                      <Badge className="bg-red-500">Superadmin</Badge>
                      <span>Full system access</span>
                    </SelectItem>
                    <SelectItem value="officer" className="flex items-center gap-2">
                      <Badge className="bg-green-500">Officer</Badge>
                      <span>Limited access</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {role === 'admin' ? 'Admin users manage their own homestays and require branding information.' : 
                   role === 'superadmin' ? 'Superadmin users have full access to the system.' : 
                   'Officer users have limited access to specific functions.'}
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t">
              <div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
              <div className="flex gap-2">
                {role === 'admin' && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab('branding')}
                    disabled={isLoading}
                  >
                    Next: Branding
                  </Button>
                )}
                {role !== 'admin' && (
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" /> Create User
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          {role === 'admin' && (
            <TabsContent value="branding" className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-8">
                {/* Brand basics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-l-4 border-primary pl-3">Basic Brand Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="brandName" className="text-sm font-medium">
                        Brand Name*
                      </Label>
                      <Input
                        id="brandName"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Company/Organization Name"
                        required={role === 'admin'}
                        disabled={isLoading}
                        className={errors.brandName ? "border-red-500" : ""}
                      />
                      {errors.brandName && <p className="text-xs text-red-500">{errors.brandName}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="brandDescription" className="text-sm font-medium">
                        Brand Description*
                      </Label>
                      <Textarea
                        id="brandDescription"
                        value={brandDescription}
                        onChange={(e) => setBrandDescription(e.target.value)}
                        placeholder="A short description of your brand"
                        required={role === 'admin'}
                        disabled={isLoading}
                        className={cn(
                          "resize-none",
                          errors.brandDescription ? "border-red-500" : ""
                        )}
                      />
                      {errors.brandDescription && <p className="text-xs text-red-500">{errors.brandDescription}</p>}
                    </div>
                  </div>
                </div>
                
                {/* Logo upload with preview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-l-4 border-primary pl-3">Logo</h3>
                  
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3">
                      <div 
                        className={cn(
                          "aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center overflow-hidden relative",
                          logoPreview ? "border-primary" : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {logoPreview ? (
                          <>
                            <img 
                              src={logoPreview} 
                              alt="Logo Preview" 
                              className="w-full h-full object-contain"
                            />
                            <button
                              type="button"
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                              onClick={() => {
                                setLogoFile(null);
                                setLogoPreview(null);
                                if (logoInputRef.current) {
                                  logoInputRef.current.value = '';
                                }
                              }}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-10 w-10 text-gray-400" />
                            <p className="text-sm text-gray-500 mt-2">Upload logo image</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="logo" className="text-sm font-medium">
                          Logo Image* <span className="text-xs text-muted-foreground">(PNG, JPG - Recommended size: 200x200px)</span>
                        </Label>
                        <div className="flex items-center gap-3">
                          <input
                            ref={logoInputRef}
                            type="file"
                            id="logo"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleLogoChange}
                            className="hidden"
                            required={role === 'admin' && !logoFile}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={isLoading}
                            className="w-full justify-center"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {logoFile ? 'Change Logo' : 'Select Logo File'}
                          </Button>
                        </div>
                        {errors.logo && <p className="text-xs text-red-500">{errors.logo}</p>}
                      </div>
                      
                      {logoFile && (
                        <div className="p-3 bg-muted/30 rounded-md">
                          <p className="text-sm font-medium">Selected File:</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Check className="h-4 w-4 text-green-500 mr-1" />
                            {logoFile.name} ({Math.round(logoFile.size / 1024)} KB)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Slider images upload with preview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-l-4 border-primary pl-3">Slider Images</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sliderImages" className="text-sm font-medium">
                        Slider Images* <span className="text-xs text-muted-foreground">(At least one required)</span>
                      </Label>
                      <div className="flex items-center gap-3">
                        <input
                          ref={sliderInputRef}
                          type="file"
                          id="sliderImages"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleSliderImagesChange}
                          className="hidden"
                          multiple
                          required={role === 'admin' && sliderImages.length === 0}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => sliderInputRef.current?.click()}
                          disabled={isLoading}
                          className="w-full justify-center"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Add Slider Images
                        </Button>
                      </div>
                      {errors.sliders && <p className="text-xs text-red-500">{errors.sliders}</p>}
                    </div>
                    
                    {/* Slider previews */}
                    {sliderPreviews.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sliderPreviews.map((preview, index) => (
                          <div key={index} className="relative aspect-[16/9] rounded-md border overflow-hidden group">
                            <img 
                              src={preview} 
                              alt={`Slider ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => handleRemoveSliderImage(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <p className="text-white text-xs font-medium">
                                {sliderImages[index].name} ({Math.round(sliderImages[index].size / 1024)} KB)
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-between items-center border-t">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setActiveTab('basic')}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setActiveTab('about')}
                  disabled={isLoading}
                >
                  Next: Contact & About
                </Button>
              </div>
            </TabsContent>
          )}
          
          {role === 'admin' && (
            <TabsContent value="about" className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-8">
                {/* Contact information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-l-4 border-primary pl-3">Contact Information</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium">
                        Business Address*
                      </Label>
                      <Textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Full address"
                        required={role === 'admin'}
                        disabled={isLoading}
                        className={errors.address ? "border-red-500" : ""}
                      />
                      {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="businessEmail" className="text-sm font-medium">
                          Business Email*
                        </Label>
                        <Input
                          id="businessEmail"
                          type="email"
                          value={businessEmail}
                          onChange={(e) => setBusinessEmail(e.target.value)}
                          placeholder="contact@business.com"
                          required={role === 'admin'}
                          disabled={isLoading}
                          className={errors.businessEmail ? "border-red-500" : ""}
                        />
                        {errors.businessEmail && <p className="text-xs text-red-500">{errors.businessEmail}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">
                          Business Phone*
                        </Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+977 1234567890"
                          required={role === 'admin'}
                          disabled={isLoading}
                          className={errors.phone ? "border-red-500" : ""}
                        />
                        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Social Media Links <span className="text-xs text-muted-foreground">(Optional)</span>
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          placeholder="Facebook URL"
                          value={facebook}
                          onChange={(e) => setFacebook(e.target.value)}
                          disabled={isLoading}
                        />
                        <Input
                          placeholder="Instagram URL"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          disabled={isLoading}
                        />
                        <Input
                          placeholder="Twitter URL"
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <Input
                          placeholder="TikTok URL"
                          value={tiktok}
                          onChange={(e) => setTiktok(e.target.value)}
                          disabled={isLoading}
                        />
                        <Input
                          placeholder="YouTube Channel URL"
                          value={youtube}
                          onChange={(e) => setYoutube(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* About us content */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-l-4 border-primary pl-3">About Us Content</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="story" className="text-sm font-medium">
                        Company Story*
                      </Label>
                      <Textarea
                        id="story"
                        value={story}
                        onChange={(e) => setStory(e.target.value)}
                        placeholder="Share your company's history and background..."
                        rows={4}
                        required={role === 'admin'}
                        disabled={isLoading}
                        className={errors.story ? "border-red-500" : ""}
                      />
                      {errors.story && <p className="text-xs text-red-500">{errors.story}</p>}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mission" className="text-sm font-medium">
                          Mission*
                        </Label>
                        <Textarea
                          id="mission"
                          value={mission}
                          onChange={(e) => setMission(e.target.value)}
                          placeholder="Your mission statement..."
                          rows={3}
                          required={role === 'admin'}
                          disabled={isLoading}
                          className={errors.mission ? "border-red-500" : ""}
                        />
                        {errors.mission && <p className="text-xs text-red-500">{errors.mission}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="vision" className="text-sm font-medium">
                          Vision*
                        </Label>
                        <Textarea
                          id="vision"
                          value={vision}
                          onChange={(e) => setVision(e.target.value)}
                          placeholder="Your vision statement..."
                          rows={3}
                          required={role === 'admin'}
                          disabled={isLoading}
                          className={errors.vision ? "border-red-500" : ""}
                        />
                        {errors.vision && <p className="text-xs text-red-500">{errors.vision}</p>}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Team members section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium border-l-4 border-primary pl-3">Team Members</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addTeamMember}
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Member
                    </Button>
                  </div>
                  
                  {errors.team && <p className="text-xs text-red-500">{errors.team}</p>}
                  
                  <div className="space-y-6">
                    {team.map((member, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="bg-muted/20 py-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-sm">Team Member {index + 1}</h4>
                            {team.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTeamMember(index)}
                                className="h-8 w-8 rounded-full p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-4">
                              <div className="relative w-full aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center">
                                {member.photoPreview ? (
                                  <>
                                    <img 
                                      src={member.photoPreview} 
                                      alt={`${member.name || 'Team member'} photo`} 
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                                      onClick={() => removeTeamPhoto(index)}
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-12 w-12 text-gray-400" />
                                  </>
                                )}
                              </div>
                              
                              <div>
                                <Label htmlFor={`member-photo-${index}`} className="text-sm font-medium">
                                  Photo <span className="text-xs text-muted-foreground">(Optional)</span>
                                </Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="file"
                                    id={`member-photo-${index}`}
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={(e) => handleTeamPhotoChange(index, e)}
                                    className="hidden"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById(`member-photo-${index}`)?.click()}
                                    disabled={isLoading}
                                    className="w-full justify-center"
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {member.photoFile ? 'Change Photo' : 'Upload Photo'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="md:col-span-2 space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor={`member-name-${index}`} className="text-sm font-medium">
                                  Name*
                                </Label>
                                <Input
                                  id={`member-name-${index}`}
                                  value={member.name}
                                  onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                                  placeholder="Full Name"
                                  required={role === 'admin'}
                                  disabled={isLoading}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`member-role-${index}`} className="text-sm font-medium">
                                  Role/Position*
                                </Label>
                                <Input
                                  id={`member-role-${index}`}
                                  value={member.role}
                                  onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                                  placeholder="e.g. CEO, Manager"
                                  required={role === 'admin'}
                                  disabled={isLoading}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-between items-center border-t">
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab('branding')}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" /> Create User
                    </div>
                  )}
                </Button>
              </div>
            </TabsContent>
          )}
        </form>
      </Tabs>
    </div>
  );
} 