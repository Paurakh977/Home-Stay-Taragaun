'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Loader2, User, Mail, Phone, Lock, Check, X, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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

interface Admin {
  _id: string;
  username: string;
  name?: string;
}

export default function CreateOfficerPage() {
  const router = useRouter();
  
  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({});
  const [selectedAdmin, setSelectedAdmin] = useState('');
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  
  // Fetch all admins for the dropdown
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setAdminsLoading(true);
        const response = await fetch('/api/superadmin/users/admins');
        
        if (!response.ok) {
          throw new Error('Failed to fetch admins');
        }
        
        const data = await response.json();
        if (data.success && Array.isArray(data.admins)) {
          setAdmins(data.admins);
        } else {
          throw new Error(data.message || 'Failed to load admins');
        }
      } catch (error) {
        console.error('Error fetching admins:', error);
        toast.error('Failed to load administrators');
      } finally {
        setAdminsLoading(false);
      }
    };
    
    fetchAdmins();
  }, []);
  
  // Initialize permissions with all keys set to false
  useEffect(() => {
    const initialPermissions: Record<string, boolean> = {};
    permissions.forEach(permission => {
      initialPermissions[permission.key] = false;
    });
    setSelectedPermissions(initialPermissions);
  }, []);
  
  const togglePermission = (key: string) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAdmin) {
      toast.error('Please select an administrator');
      return;
    }
    
    if (!username || !password || !email || !contactNumber) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Ensure all permission keys are included
    const completePermissions = { ...selectedPermissions };
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/superadmin/officers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          email,
          contactNumber,
          permissions: completePermissions,
          isActive,
          adminUsername: selectedAdmin
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Officer created successfully');
        router.push('/superadmin/dashboard/users/officers');
      } else {
        toast.error(data.message || 'Failed to create officer');
      }
    } catch (error) {
      console.error('Error creating officer:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/superadmin/dashboard/users/officers')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create Officer</h2>
          <p className="text-muted-foreground">
            Create a new officer account assigned to an administrator
          </p>
        </div>
      </div>
      
      <Separator />
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the officer's account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9"
                    placeholder="johndoe"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contactNumber"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="pl-9"
                    placeholder="+1234567890"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin">Assign to Administrator</Label>
              <Select 
                onValueChange={setSelectedAdmin} 
                value={selectedAdmin}
                disabled={adminsLoading}
              >
                <SelectTrigger id="admin" className="w-full">
                  <SelectValue placeholder="Select an administrator" />
                </SelectTrigger>
                <SelectContent>
                  {adminsLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Loading administrators...</span>
                      </div>
                    </SelectItem>
                  ) : admins.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No administrators found
                    </SelectItem>
                  ) : (
                    admins.map((admin) => (
                      <SelectItem key={admin._id} value={admin.username}>
                        {admin.name || admin.username}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Active Account</Label>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              Select the permissions for this officer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {permissions.map((permission) => (
                <div
                  key={permission.key}
                  className="flex items-start space-x-3 rounded-md border p-4"
                >
                  <Checkbox
                    id={permission.key}
                    checked={!!selectedPermissions[permission.key]}
                    onCheckedChange={() => togglePermission(permission.key)}
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor={permission.key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {permission.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {permission.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/superadmin/dashboard/users/officers')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Officer
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 