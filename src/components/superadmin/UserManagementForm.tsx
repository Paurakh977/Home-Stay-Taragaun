'use client';

import { useState, FormEvent } from 'react';
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
import { UserPlus, Eye, EyeOff } from "lucide-react";

interface UserManagementFormProps {
  onUserAdded: (user: any) => void;
}

export function UserManagementForm({ onUserAdded }: UserManagementFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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
    setIsLoading(true);
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
      setIsLoading(false);
      return;
    }

    // Ensure contactNumber is properly formatted (exactly 10 digits)
    if (contactNumber.length !== 10 || !/^\d{10}$/.test(contactNumber)) {
      setErrors(prev => ({
        ...prev,
        contactNumber: 'Contact number must be exactly 10 digits'
      }));
      setIsLoading(false);
      return;
    }

    try {
      console.log("Submitting form with data:", { 
        username, 
        email, 
        contactNumber,
        role
      });

      const response = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          password, 
          email, 
          contactNumber, 
          role 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = data.message || 'Failed to create user';
        console.error('API error response:', data);
        
        if (response.status === 409) {
          errorMessage = 'Username or email already exists.';
        } else if (data.errors) {
          const firstErrorField = Object.keys(data.errors)[0];
          errorMessage = data.errors[firstErrorField].message;
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = `Authentication Error: ${data.message || 'Please log in again.'}`;
        }
        throw new Error(errorMessage);
      }

      console.log("User created successfully:", data.user);
      toast.success('User created successfully!');
      onUserAdded(data.user);

      // Reset form
      setUsername('');
      setPassword('');
      setEmail('');
      setContactNumber('');
      setShowPassword(false);
      setRole('admin');

    } catch (err: any) {
      console.error('User creation error:', err);
      const message = err.message || 'An unexpected error occurred.';
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Two columns on larger screens, single column on mobile */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="username">Username*</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => handleChange('username', e.target.value)}
            placeholder="username"
            required
            disabled={isLoading}
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
            disabled={isLoading}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="password">Password*</Label>
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
              className="pr-10"
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

        <div className="space-y-1.5">
          <Label htmlFor="contactNumber">Contact Number* (10 digits)</Label>
          <Input
            id="contactNumber"
            type="tel"
            value={contactNumber}
            onChange={(e) => handleChange('contactNumber', e.target.value)}
            placeholder="10 digit number"
            required
            disabled={isLoading}
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

      <div className="space-y-1.5">
        <Label htmlFor="role">Role*</Label>
        <Select
          value={role}
          onValueChange={(value) => handleChange('role', value)}
          disabled={isLoading}
          required
        >
          <SelectTrigger id="role" className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="superadmin">Superadmin</SelectItem>
            <SelectItem value="officer">Officer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error and Submit Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {error && (
          <p className="text-sm text-red-500 order-last sm:order-first">{error}</p>
        )}
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto sm:ml-auto">
          {isLoading ? (
            'Creating...'
          ) : (
            <span className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Create User
            </span>
          )}
        </Button>
      </div>
    </form>
  );
} 