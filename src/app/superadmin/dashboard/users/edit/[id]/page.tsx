'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface UserData {
  _id: string;
  username: string;
  email: string;
  contactNumber: string;
  role: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  // Form state - initialize with empty strings to avoid controlled/uncontrolled switching
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin'); // Default to admin to avoid uncontrolled Select
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    // Fetch user data on component mount
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching user data for ID:', userId);
      const response = await fetch(`/api/superadmin/users/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to load user data`);
      }
      
      const data = await response.json();
      const userData = data.user;
      console.log('User data received:', userData);
      
      // Store the full user data
      setUserData(userData);
      
      // Set form values - use empty string if fields are not provided
      setUsername(userData.username || '');
      setEmail(userData.email || '');
      setContactNumber(userData.contactNumber || '');
      setRole(userData.role || 'admin');
      
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setError('Could not load user data. Please try again.');
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Validate all fields before submission
    const contactNumberError = validateField('contactNumber', contactNumber);
    const emailError = validateField('email', email);
    
    const validationErrors = {
      contactNumber: contactNumberError,
      email: emailError
    };
    
    setErrors(validationErrors);
    
    // Check if there are any validation errors
    if (contactNumberError || emailError) {
      setIsSaving(false);
      return;
    }

    // Prepare update data, only including fields that have values
    const updateData: Record<string, string> = {
      username,
      email,
      contactNumber,
      role,
    };

    // Only include password if it's been entered
    if (password) {
      updateData.password = password;
    }

    try {
      console.log('Submitting data to update user:', {
        ...updateData,
        password: password ? '[REDACTED]' : undefined
      });
      
      const response = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      console.log('Response from update API:', data);

      if (!response.ok) {
        let errorMessage = data.message || 'Failed to update user';
        
        if (response.status === 404) {
          errorMessage = 'User not found';
        } else if (data.errors) {
          const firstErrorField = Object.keys(data.errors)[0];
          errorMessage = data.errors[firstErrorField].message;
        }
        throw new Error(errorMessage);
      }

      toast.success('User updated successfully!');
      
      // Refresh the data
      fetchUserData();
      
      // Reset password field
      setPassword('');
      setShowPassword(false);

    } catch (err: any) {
      console.error('User update error:', err);
      setError(err.message || 'An unexpected error occurred.');
      toast.error(err.message || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
          <p className="text-muted-foreground mt-1">
            Update user information and permissions
          </p>
        </div>
        <Link href="/superadmin/dashboard/users">
          <Button variant="outline" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
        </Link>
      </div>

      {/* Edit User Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <span>User Information</span>
          </CardTitle>
          <CardDescription>
            Edit the user's profile information and credentials
          </CardDescription>
        </CardHeader>

        {isLoading ? (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        ) : error ? (
          <CardContent>
            <div className="flex justify-center items-center p-6 text-red-500 text-center">
              <p>{error}</p>
            </div>
            <div className="flex justify-center mt-4">
              <Button 
                variant="outline" 
                onClick={fetchUserData} 
                size="sm"
                className="gap-1"
              >
                <Loader2 className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Username and Email */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username*</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    placeholder="username"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email*</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="user@example.com"
                    required
                    disabled={isSaving}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>
              </div>

              {/* Password and Contact Number */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password (leave empty to keep current)</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="New password (minimum 4 characters)"
                      disabled={isSaving}
                      minLength={password ? 4 : 0}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                      onClick={togglePasswordVisibility}
                      disabled={isSaving}
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

                <div className="space-y-1.5">
                  <Label htmlFor="contactNumber">Contact Number* (10 digits)</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => handleChange('contactNumber', e.target.value)}
                    placeholder="10 digit number"
                    required
                    disabled={isSaving}
                    className={errors.contactNumber ? 'border-red-500' : ''}
                    pattern="\d{10}"
                    title="Please enter exactly 10 digits"
                    inputMode="numeric"
                  />
                  {errors.contactNumber && <p className="text-xs text-red-500">{errors.contactNumber}</p>}
                  {contactNumber && contactNumber.length !== 10 && (
                    <p className="text-xs text-amber-500">
                      {contactNumber.length < 10 
                        ? `${10 - contactNumber.length} more digit${10 - contactNumber.length !== 1 ? 's' : ''} needed` 
                        : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Role selector */}
              <div className="space-y-1.5">
                <Label htmlFor="role">Role*</Label>
                <Select
                  value={role}
                  onValueChange={(value) => handleChange('role', value)}
                  disabled={isSaving}
                  required
                >
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="officer">Officer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Current User Data Debug Section */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-4 bg-slate-100 rounded-md text-xs">
                  <h4 className="font-medium mb-1">Current User Data:</h4>
                  <pre className="whitespace-pre-wrap">
                    {userData ? JSON.stringify(userData, null, 2) : 'No data'}
                  </pre>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between border-t p-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/superadmin/dashboard/users')}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
} 