"use client";

/**
 * DEPRECATED: This page is deprecated. 
 * Please use the new officer creation page at /admin/[adminUsername]/officer/create instead.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Loader2, User, Mail, Phone, Lock, Check, X, Shield } from 'lucide-react';

// Custom hook to get the authenticated admin username
function useAuthenticatedAdmin() {
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchAuthInfo() {
      try {
        // First check if we're accessing as a superadmin
        const superadminResponse = await fetch('/api/superadmin/auth/me');
        
        if (superadminResponse.ok) {
          const superadminData = await superadminResponse.json();
          if (superadminData.user?.username) {
            setAdminUsername(superadminData.user.username);
            setIsLoading(false);
            return;
          }
        }
        
        // Regular admin - get info from auth endpoint
        const response = await fetch('/api/admin/auth/me');
        
        if (!response.ok) {
          setError('Authentication failed. Please log in again.');
          router.push('/admin/login');
          return;
        }
        
        const data = await response.json();
        
        if (!data.success || !data.user) {
          setError('Failed to retrieve admin information');
          router.push('/admin/login');
          return;
        }
        
        // Set admin username
        setAdminUsername(data.user.username);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching admin info:', err);
        setError('Failed to load admin information');
        setIsLoading(false);
      }
    }
    
    fetchAuthInfo();
  }, [router]);

  return { adminUsername, isLoading, error };
}

interface Permission {
  key: string;
  label: string;
  description: string;
}

const permissions: Permission[] = [
  { 
    key: 'adminDashboardAccess', 
    label: 'Dashboard Access', 
    description: 'View admin dashboard'
  },
  { 
    key: 'homestayApproval', 
    label: 'Homestay Approval', 
    description: 'Approve or reject homestay listings'
  },
  { 
    key: 'homestayEdit', 
    label: 'Homestay Edit', 
    description: 'Edit homestay information'
  },
  { 
    key: 'homestayDelete', 
    label: 'Homestay Delete', 
    description: 'Delete homestay listings'
  },
  { 
    key: 'documentUpload', 
    label: 'Document Upload', 
    description: 'Upload documents for homestays'
  },
  { 
    key: 'imageUpload', 
    label: 'Image Upload', 
    description: 'Upload images for homestays'
  },
];

export default function OfficerCreatePage({params}: {params: {adminUsername: string}}) {
  const router = useRouter();
  const { adminUsername, isLoading: adminLoading, error: adminError } = useAuthenticatedAdmin();
  
  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<{[key: string]: boolean}>({});
  
  // Admin's permissions that limit what can be assigned
  const [adminPermissions, setAdminPermissions] = useState<{[key: string]: boolean}>({});
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Add deprecation UI notification
  const [showDeprecationNotice, setShowDeprecationNotice] = useState(true);
  
  // Fetch admin's own permissions
  useEffect(() => {
    if (!adminUsername) return;
    
    const fetchAdminPermissions = async () => {
      try {
        setInitialLoading(true);
        
        // First check if we're accessing as a superadmin
        const superadminResponse = await fetch('/api/superadmin/auth/me');
        
        if (superadminResponse.ok) {
          // Superadmin has all permissions
          const allPermissions = permissions.reduce((acc, perm) => {
            acc[perm.key] = true;
            return acc;
          }, {} as {[key: string]: boolean});
          
          setAdminPermissions(allPermissions);
          setInitialLoading(false);
          return;
        }
        
        // Regular admin - check own permissions
        const response = await fetch('/api/admin/auth/me');
        
        if (!response.ok) {
          toast.error('Authentication failed. Please log in again.');
          router.push(`/admin/login`);
          return;
        }
        
        const data = await response.json();
        
        if (!data.success || !data.user) {
          toast.error('Failed to retrieve admin information');
          return;
        }
        
        // Set admin permissions
        setAdminPermissions(data.user.permissions || {});
      } catch (error) {
        console.error('Error fetching admin permissions:', error);
        toast.error('Failed to load permissions');
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchAdminPermissions();
  }, [adminUsername, router]);
  
  // Show error if admin authentication fails
  useEffect(() => {
    if (adminError) {
      toast.error(adminError);
    }
  }, [adminError]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminUsername) {
      toast.error('Admin session not found. Please log in again.');
      router.push('/admin/login');
      return;
    }
    
    // Validate form
    if (!username || !password || !email || !contactNumber) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Basic email validation
    const emailPattern = /^\S+@\S+\.\S+$/;
    if (!emailPattern.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Phone number validation (basic)
    if (contactNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Creating officer with admin:', adminUsername);
      
      const response = await fetch('/api/admin/officer/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          email,
          contactNumber,
          isActive,
          permissions: selectedPermissions,
          adminUsername: adminUsername,
        }),
      });
      
      // Log raw response for debugging
      console.log(`Response status: ${response.status}`);
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      // Parse JSON if possible
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('Error parsing response:', error);
        toast.error('Server response is not valid JSON');
        setLoading(false);
        return;
      }
      
      if (response.ok && data.success) {
        toast.success('Officer created successfully');
        // Clear form
        setUsername('');
        setPassword('');
        setEmail('');
        setContactNumber('');
        setSelectedPermissions({});
        // Redirect to manage officers page
        router.push(`/admin/${adminUsername}/officer/list`);
      } else {
        console.error('Error from server:', data);
        toast.error(data.message || 'Failed to create officer');
      }
    } catch (error) {
      console.error('Error creating officer:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const togglePermission = (key: string) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Check if admin has specific permission
  const adminHasPermission = (key: string): boolean => {
    return adminPermissions[key] === true;
  };
  
  // Check if a permission can be assigned (admin has it)
  const canAssignPermission = (key: string): boolean => {
    return adminHasPermission(key);
  };
  
  // If admin session is still loading, show loading state
  if (adminLoading || !adminUsername) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading admin session...</span>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Admin Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <AdminSidebar username={adminUsername} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Deprecation Notice */}
          {showDeprecationNotice && (
            <div className="bg-amber-100 border border-amber-400 text-amber-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
              <div>
                <p className="font-bold">This page is deprecated</p>
                <p>Please use the new officer creation page at <button 
                  className="text-blue-600 underline"
                  onClick={() => router.push(`/admin/${params.adminUsername}/officer/create`)}
                >
                  /admin/{params.adminUsername}/officer/create
                </button></p>
              </div>
              <button onClick={() => setShowDeprecationNotice(false)} className="text-amber-700">
                <span className="text-xl">&times;</span>
              </button>
            </div>
          )}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create Officer</h1>
            <button
              onClick={() => router.push(`/admin/${adminUsername}/officer/list`)}
              className="text-sm px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              View All Officers
            </button>
          </div>
          
          {initialLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-6">
                  Create a new officer under your admin account. Officers will have limited access based on the permissions you grant them.
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Current admin */}
                  <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                    Creating officer for admin account: <span className="font-bold">{adminUsername}</span>
                  </div>
                  
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Username */}
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                          placeholder="officer_username"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                          placeholder="Strong password"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                          placeholder="officer@example.com"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Contact Number */}
                    <div>
                      <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="contactNumber"
                          type="tel"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                          placeholder="9812345678"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Active Status */}
                  <div>
                    <div className="flex items-center">
                      <input
                        id="isActive"
                        type="checkbox"
                        checked={isActive}
                        onChange={() => setIsActive(!isActive)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                        Active Account
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Inactive officers cannot log in to the system.
                    </p>
                  </div>
                  
                  {/* Permissions Section */}
                  <div className="border-t border-gray-200 pt-5">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-gray-400" />
                      Officer Permissions
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Select the permissions this officer should have. You can only assign permissions that you have.
                    </p>
                    
                    <div className="mt-4 space-y-2">
                      {permissions.map((permission) => {
                        const isDisabled = !canAssignPermission(permission.key);
                        
                        return (
                          <div 
                            key={permission.key}
                            className={`flex items-start p-3 rounded-md 
                              ${isDisabled ? 'bg-gray-50 opacity-60' : 'bg-white hover:bg-gray-50'} 
                              ${selectedPermissions[permission.key] ? 'border-l-4 border-green-500' : 'border-l-4 border-transparent'}
                            `}
                          >
                            <div className="flex items-center h-5">
                              <input
                                id={permission.key}
                                name={permission.key}
                                type="checkbox"
                                checked={selectedPermissions[permission.key] || false}
                                onChange={() => togglePermission(permission.key)}
                                disabled={isDisabled}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm flex-1">
                              <label htmlFor={permission.key} className={`font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
                                {permission.label}
                              </label>
                              <p className={`${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                                {permission.description}
                              </p>
                            </div>
                            <div className="ml-2">
                              {isDisabled ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                                  <X className="mr-1 h-3 w-3" /> Not Available
                                </span>
                              ) : (
                                adminHasPermission(permission.key) && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    <Check className="mr-1 h-3 w-3" /> Available
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/${adminUsername}`)}
                      className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mr-3"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          Creating...
                        </>
                      ) : 'Create Officer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 