'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Loader2, User, Mail, Phone, Shield, Trash2, KeyRound, Eye, EyeOff, Plus, Search, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OfficerData {
  _id: string;
  username: string;
  email: string;
  contactNumber: string;
  isActive: boolean;
  parentAdmin: string;
  createdAt: string;
}

interface AdminData {
  _id: string;
  username: string;
  name?: string;
}

export default function SuperadminOfficersPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState<OfficerData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState('all');
  const [adminsLoading, setAdminsLoading] = useState(true);
  
  useEffect(() => {
    fetchOfficers();
    fetchAdmins();
  }, []);
  
  const fetchOfficers = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/superadmin/officers/list');
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
          router.push('/superadmin/login');
          return;
        }
        throw new Error('Failed to fetch officers');
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.officers)) {
        setOfficers(data.officers);
      } else {
        toast.error(data.message || 'Failed to load officers');
      }
    } catch (error) {
      console.error('Error fetching officers:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/superadmin/users/admins');
      
      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }
      
      const data = await response.json();
      if (data.success && Array.isArray(data.admins)) {
        setAdmins(data.admins);
      } else {
        console.error('Failed to load admins');
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setAdminsLoading(false);
    }
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleAdminFilterChange = (value: string) => {
    setSelectedAdmin(value);
  };
  
  const filteredOfficers = officers.filter(officer => {
    // First filter by status tab
    if (activeTab === 'active' && !officer.isActive) return false;
    if (activeTab === 'inactive' && officer.isActive) return false;
    
    // Then filter by admin if not 'all'
    if (selectedAdmin !== 'all' && officer.parentAdmin !== selectedAdmin) return false;
    
    // Then filter by search
    const searchLower = searchTerm.toLowerCase();
    return (
      officer.username.toLowerCase().includes(searchLower) ||
      officer.email.toLowerCase().includes(searchLower) ||
      officer.contactNumber?.includes(searchTerm) ||
      officer.parentAdmin?.toLowerCase().includes(searchLower)
    );
  });
  
  const handleToggleStatus = async (officerId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/superadmin/officers/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officerId,
          isActive: !currentStatus,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(`Officer ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        // Update officer in state
        setOfficers(prev => 
          prev.map(officer => 
            officer._id === officerId 
              ? { ...officer, isActive: !currentStatus } 
              : officer
          )
        );
      } else {
        toast.error(data.message || 'Failed to update officer status');
      }
    } catch (error) {
      console.error('Error updating officer status:', error);
      toast.error('An unexpected error occurred');
    }
  };
  
  const handleDeleteOfficer = async (officerId: string) => {
    if (!confirm('Are you sure you want to delete this officer?')) return;
    
    try {
      const response = await fetch('/api/superadmin/officers/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officerId,
          _method: 'DELETE',
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Officer deleted successfully');
        // Remove officer from state
        setOfficers(prev => prev.filter(officer => officer._id !== officerId));
      } else {
        toast.error(data.message || 'Failed to delete officer');
      }
    } catch (error) {
      console.error('Error deleting officer:', error);
      toast.error('An unexpected error occurred');
    }
  };
  
  const handleResetPassword = async (officerId: string) => {
    // Prompt for new password
    const newPassword = prompt('Enter new password (minimum 6 characters):');
    
    if (!newPassword) return; // User cancelled
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (!confirm('Are you sure you want to reset this officer\'s password?')) return;
    
    try {
      const response = await fetch('/api/superadmin/officers/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officerId,
          newPassword
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Password updated successfully');
      } else {
        toast.error(data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('An unexpected error occurred');
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Officer Management</h2>
          <p className="text-muted-foreground">
            Manage officers assigned to different administrators
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={fetchOfficers} 
            variant="outline" 
            size="icon" 
            title="Refresh list"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Link href="/superadmin/dashboard/users/officers/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Officer
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search officers..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          
          <div className="w-full md:w-64">
            <Select
              value={selectedAdmin}
              onValueChange={handleAdminFilterChange}
              disabled={adminsLoading}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center">
                  {adminsLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Loading admins...</span>
                    </>
                  ) : (
                    <>
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by admin" />
                    </>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {admins.map((admin) => (
                  <SelectItem key={admin._id} value={admin.username}>
                    {admin.name || admin.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>
              Officers
              {selectedAdmin !== 'all' && (
                <span className="ml-2 text-muted-foreground font-normal text-base">
                  for admin: {selectedAdmin}
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {filteredOfficers.length} officers found
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredOfficers.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center space-y-3 text-center">
                <div className="rounded-full bg-muted p-3">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">No officers found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || activeTab !== 'all'
                      ? "Try adjusting your search or filter"
                      : "Create a new officer to get started"}
                  </p>
                </div>
                {!searchTerm && activeTab === 'all' && (
                  <Link href="/superadmin/dashboard/users/officers/create">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Officer
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                      <th className="p-3">Username</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Admin</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Created</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOfficers.map((officer) => (
                      <tr
                        key={officer._id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-3 font-medium">{officer.username}</td>
                        <td className="p-3">{officer.email}</td>
                        <td className="p-3">{officer.parentAdmin}</td>
                        <td className="p-3">
                          <Badge className={`${officer.isActive ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                            {officer.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-3">{formatDate(officer.createdAt)}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleToggleStatus(officer._id, officer.isActive)}
                              title={officer.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {officer.isActive ? 
                                <EyeOff className="h-4 w-4 text-destructive" /> : 
                                <Eye className="h-4 w-4 text-green-500" />
                              }
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleResetPassword(officer._id)}
                              title="Reset Password"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteOfficer(officer._id)}
                              className="text-destructive"
                              title="Delete Officer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 