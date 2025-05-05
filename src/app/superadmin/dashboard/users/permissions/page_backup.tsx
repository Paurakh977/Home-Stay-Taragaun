'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, User, Home, Check, X, Filter, Search, RefreshCw, Building, MapPin, Users, ChevronsUpDown, Check as CheckIcon, Trash, CircleCheck, CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Types for users and permissions
interface UserPermissions {
  adminDashboardAccess: boolean;
  homestayApproval: boolean;
  homestayEdit: boolean;
  homestayDelete: boolean;
  documentUpload: boolean;
  imageUpload: boolean;
}

interface HomeStayFeatureAccess {
  dashboard: boolean;
  profile: boolean;
  portal: boolean;
  documents: boolean;
  imageUpload: boolean;
  settings: boolean;
  chat: boolean;
  updateInfo: boolean;
}

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'officer' | 'superadmin';
  permissions: UserPermissions;
}

interface HomeStay {
  _id: string;
  homestayId: string;
  homeStayName: string;
  status: 'pending' | 'approved' | 'rejected';
  adminUsername: string;
  dhsrNo?: string;
  homeStayType: 'community' | 'private';
  address?: {
    province?: { en: string; ne: string };
    district?: { en: string; ne: string };
    municipality?: { en: string; ne: string };
    villageName?: string;
    formattedAddress?: { en: string; ne: string };
  };
  featureAccess?: HomeStayFeatureAccess;
}

export default function PermissionsPage() {
  // State for users
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userLoading, setUserLoading] = useState(true);
  
  // State for homestays
  const [homestays, setHomestays] = useState<HomeStay[]>([]);
  const [filteredHomestays, setFilteredHomestays] = useState<HomeStay[]>([]);
  const [selectedHomestayIds, setSelectedHomestayIds] = useState<string[]>([]);
  const [homestaySearchQuery, setHomestaySearchQuery] = useState('');
  const [homestayStatusFilter, setHomestayStatusFilter] = useState('all');
  const [homestayAdminFilter, setHomestayAdminFilter] = useState('all');
  const [homestayLoading, setHomestayLoading] = useState(true);

  // State for bulk changes
  const [userBulkPermissions, setUserBulkPermissions] = useState<Partial<UserPermissions>>({});
  const [homestayBulkFeatures, setHomestayBulkFeatures] = useState<Partial<HomeStayFeatureAccess>>({});

  // User permission labels
  const userPermissionLabels = {
    adminDashboardAccess: 'Admin Dashboard Access',
    homestayApproval: 'Approve/Reject Homestays',
    homestayEdit: 'Edit Homestay Details',
    homestayDelete: 'Delete Homestays',
    documentUpload: 'Upload Documents',
    imageUpload: 'Upload Images',
  };

  // Homestay feature access labels
  const featureAccessLabels = {
    dashboard: 'Dashboard Access',
    profile: 'Profile Management',
    portal: 'Portal Access',
    documents: 'Document Management',
    imageUpload: 'Image Upload',
    settings: 'Settings Access',
    chat: 'Chat Feature',
    updateInfo: 'Update Information',
  };

  // Geographic filter states
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('all');
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);

  // Address data state
  const [addressData, setAddressData] = useState<{
    allProvinces: string[];
    provinceDistrictsMap: Record<string, string[]>;
    districtMunicipalitiesMap: Record<string, string[]>;
    districtTranslations: Record<string, string>;
    municipalityTranslations: Record<string, string>;
  }>({
    allProvinces: [],
    provinceDistrictsMap: {},
    districtMunicipalitiesMap: {},
    districtTranslations: {},
    municipalityTranslations: {}
  });

  // Add to the homestay filter states
  const [selectedType, setSelectedType] = useState<string>('all');

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUserLoading(true);
        const response = await fetch('/api/superadmin/users');
        const data = await response.json();
        
        if (data.users) {
          // Add default permissions if not present
          const usersWithPermissions = data.users.map((user: User) => ({
            ...user,
            permissions: user.permissions || {
              adminDashboardAccess: false,
              homestayApproval: false,
              homestayEdit: false,
              homestayDelete: false,
              documentUpload: false,
              imageUpload: false
            }
          }));
          
          setUsers(usersWithPermissions);
          setFilteredUsers(usersWithPermissions);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setUserLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Fetch homestays
  useEffect(() => {
    const fetchHomestays = async () => {
      try {
        setHomestayLoading(true);
        // We need to create this API endpoint to get all homestays for the superadmin
        const response = await fetch('/api/superadmin/homestays');
        const data = await response.json();
        
        if (data.homestays) {
          // Add default feature access if not present
          const homestaysWithFeatures = data.homestays.map((homestay: HomeStay) => ({
            ...homestay,
            featureAccess: homestay.featureAccess || {
              dashboard: false,
              profile: false,
              portal: false,
              documents: false,
              imageUpload: false,
              settings: false,
              chat: false,
              updateInfo: false
            }
          }));
          
          setHomestays(homestaysWithFeatures);
          setFilteredHomestays(homestaysWithFeatures);
        }
      } catch (error) {
        console.error('Error fetching homestays:', error);
        toast.error('Failed to load homestays');
      } finally {
        setHomestayLoading(false);
      }
    };
    
    fetchHomestays();
  }, []);

  // Filter users
  useEffect(() => {
    let results = [...users];
    
    // Apply search filter
    if (userSearchQuery) {
      const query = userSearchQuery.toLowerCase();
      results = results.filter(user => 
        user.username.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query)
      );
    }
    
    // Apply role filter
    if (userRoleFilter !== 'all') {
      results = results.filter(user => user.role === userRoleFilter);
    }
    
    setFilteredUsers(results);
  }, [users, userSearchQuery, userRoleFilter]);

  // Filter homestays
  useEffect(() => {
    let results = [...homestays];
    
    // Apply search filter
    if (homestaySearchQuery) {
      const query = homestaySearchQuery.toLowerCase();
      results = results.filter(homestay => 
        homestay.homestayId.toLowerCase().includes(query) || 
        homestay.homeStayName.toLowerCase().includes(query) ||
        (homestay.dhsrNo && homestay.dhsrNo.toLowerCase().includes(query)) ||
        (homestay.address?.villageName && homestay.address.villageName.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (homestayStatusFilter !== 'all') {
      results = results.filter(homestay => homestay.status === homestayStatusFilter);
    }
    
    // Apply admin filter
    if (homestayAdminFilter !== 'all') {
      results = results.filter(homestay => homestay.adminUsername === homestayAdminFilter);
    }
    
    // Apply province filter
    if (selectedProvince && selectedProvince !== 'all') {
      results = results.filter(homestay => {
        const province = homestay.address?.province;
        if (!province) return false;
        
        return (
          province.ne === selectedProvince ||
          province.en === selectedProvince
        );
      });
    }
    
    // Apply district filter
    if (selectedDistrict && selectedDistrict !== 'all') {
      results = results.filter(homestay => {
        const district = homestay.address?.district;
        if (!district) return false;
        
        return (
          district.ne === selectedDistrict ||
          district.en === selectedDistrict
        );
      });
    }
    
    // Apply municipality filter
    if (selectedMunicipality && selectedMunicipality !== 'all') {
      results = results.filter(homestay => {
        const municipality = homestay.address?.municipality;
        if (!municipality) return false;
        
        return (
          municipality.ne === selectedMunicipality ||
          municipality.en === selectedMunicipality
        );
      });
    }
    
    // Apply homestay type filter
    if (selectedType && selectedType !== 'all') {
      results = results.filter(homestay => homestay.homeStayType === selectedType);
    }
    
    setFilteredHomestays(results);
  }, [
    homestays, 
    homestaySearchQuery, 
    homestayStatusFilter, 
    homestayAdminFilter, 
    selectedProvince,
    selectedDistrict,
    selectedMunicipality,
    selectedType
  ]);

  // Get unique admin usernames from homestays for filter
  const adminUsernames = [...new Set(homestays.map(homestay => homestay.adminUsername))];

  // Toggle select all users
  const toggleSelectAllUsers = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(user => user._id));
    }
  };

  // Toggle select all homestays
  const toggleSelectAllHomestays = () => {
    if (selectedHomestayIds.length === filteredHomestays.length) {
      setSelectedHomestayIds([]);
    } else {
      setSelectedHomestayIds(filteredHomestays.map(homestay => homestay._id));
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  // Toggle homestay selection
  const toggleHomestaySelection = (homestayId: string) => {
    if (selectedHomestayIds.includes(homestayId)) {
      setSelectedHomestayIds(selectedHomestayIds.filter(id => id !== homestayId));
    } else {
      setSelectedHomestayIds([...selectedHomestayIds, homestayId]);
    }
  };

  // Toggle bulk user permission
  const toggleBulkUserPermission = (permission: keyof UserPermissions) => {
    setUserBulkPermissions(prev => {
      const newValue = prev[permission] === undefined ? true : 
                       prev[permission] === true ? false : true;
      return { ...prev, [permission]: newValue };
    });
  };

  // Toggle bulk homestay feature
  const toggleBulkHomestayFeature = (feature: keyof HomeStayFeatureAccess, value?: boolean) => {
    setHomestayBulkFeatures(prev => {
      if (value === undefined) {
        // Remove the feature from the update object (no change)
        const newFeatures = { ...prev };
        delete newFeatures[feature];
        return newFeatures;
      } else {
        // Set to the explicit value (true or false)
        return { ...prev, [feature]: value };
      }
    });
  };

  // Apply bulk user permissions
  const applyBulkUserPermissions = async () => {
    if (Object.keys(userBulkPermissions).length === 0) {
      toast.error('No permission changes selected');
      return;
    }
    
    if (selectedUserIds.length === 0) {
      toast.error('No users selected');
      return;
    }
    
    try {
      toast.loading('Updating user permissions...');
      
      const updatePromises = selectedUserIds.map(async (userId) => {
        const user = users.find(u => u._id === userId);
        if (!user) return null;
        
        // Merge existing permissions with bulk updates
        const updatedPermissions = {
          ...user.permissions,
          ...userBulkPermissions
        };
        
        const response = await fetch(`/api/superadmin/users/${userId}/permissions`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissions: updatedPermissions }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update permissions for ${user.username}`);
        }
        
        return await response.json();
      });
      
      await Promise.all(updatePromises);
      
      // Refresh user data
      const response = await fetch('/api/superadmin/users');
      const data = await response.json();
      
      if (data.users) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      }
      
      // Clear selections and bulk changes
      setSelectedUserIds([]);
      setUserBulkPermissions({});
      
      toast.dismiss();
      toast.success('User permissions updated successfully');
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.dismiss();
      toast.error('Failed to update permissions');
    }
  };

  // Apply bulk homestay features
  const applyBulkHomestayFeatures = async () => {
    if (Object.keys(homestayBulkFeatures).length === 0) {
      toast.error('No feature changes selected');
      return;
    }
    
    if (selectedHomestayIds.length === 0) {
      toast.error('No homestays selected');
      return;
    }
    
    try {
      toast.loading('Updating homestay features...');
      
      const updatePromises = selectedHomestayIds.map(async (homestayId) => {
        const homestay = homestays.find(h => h._id === homestayId);
        if (!homestay) return null;
        
        // Merge existing features with bulk updates
        const updatedFeatures = {
          ...homestay.featureAccess,
          ...homestayBulkFeatures
        };
        
        const response = await fetch(`/api/superadmin/homestays/${homestayId}/feature-access`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featureAccess: updatedFeatures }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update features for ${homestay.homeStayName}`);
        }
        
        return await response.json();
      });
      
      await Promise.all(updatePromises);
      
      // Refresh homestay data
      const response = await fetch('/api/superadmin/homestays');
      const data = await response.json();
      
      if (data.homestays) {
        setHomestays(data.homestays);
        setFilteredHomestays(data.homestays);
      }
      
      // Clear selections and bulk changes
      setSelectedHomestayIds([]);
      setHomestayBulkFeatures({});
      
      toast.dismiss();
      toast.success('Homestay features updated successfully');
    } catch (error) {
      console.error('Error updating features:', error);
      toast.dismiss();
      toast.error('Failed to update features');
    }
  };

  // Reset filters
  const resetUserFilters = () => {
    setUserSearchQuery('');
    setUserRoleFilter('all');
  };

  const resetHomestayFilters = () => {
    setHomestaySearchQuery('');
    setHomestayStatusFilter('all');
    setHomestayAdminFilter('all');
    setSelectedProvince('all');
    setSelectedDistrict('all');
    setSelectedMunicipality('all');
    setSelectedType('all');
  };

  // Load address data for filters
  useEffect(() => {
    const fetchAddressData = async () => {
      try {
        const responses = await Promise.all([
          fetch('/address/all-provinces.json').then(res => res.json()),
          fetch('/address/map-province-districts.json').then(res => res.json()),
          fetch('/address/map-districts-municipalities.json').then(res => res.json()),
          fetch('/address/all-districts.json').then(res => res.json()),
          fetch('/address/all-municipalities.json').then(res => res.json())
        ]);

        setAddressData({
          allProvinces: responses[0] as string[],
          provinceDistrictsMap: responses[1] as Record<string, string[]>,
          districtMunicipalitiesMap: responses[2] as Record<string, string[]>,
          districtTranslations: responses[3] as Record<string, string>,
          municipalityTranslations: responses[4] as Record<string, string>
        });
      } catch (error) {
        console.error("Error loading address data:", error);
      }
    };

    fetchAddressData();
  }, []);

  // Update available districts when province changes
  useEffect(() => {
    if (selectedProvince && addressData.provinceDistrictsMap) {
      const districts = addressData.provinceDistrictsMap[selectedProvince] || [];
      setAvailableDistricts(districts);
      
      // Reset district if it's no longer valid
      if (selectedDistrict && !districts.includes(selectedDistrict)) {
        setSelectedDistrict("");
        setSelectedMunicipality("");
        setAvailableMunicipalities([]);
      }
    } else {
      setAvailableDistricts([]);
      setSelectedDistrict("");
      setSelectedMunicipality("");
      setAvailableMunicipalities([]);
    }
  }, [selectedProvince, addressData.provinceDistrictsMap, selectedDistrict]);

  // Update available municipalities when district changes
  useEffect(() => {
    if (selectedDistrict && addressData.districtMunicipalitiesMap) {
      const municipalities = addressData.districtMunicipalitiesMap[selectedDistrict] || [];
      setAvailableMunicipalities(municipalities);
      
      // Reset municipality if it's no longer valid
      if (selectedMunicipality && !municipalities.includes(selectedMunicipality)) {
        setSelectedMunicipality("");
      }
    } else {
      setAvailableMunicipalities([]);
      setSelectedMunicipality("");
    }
  }, [selectedDistrict, addressData.districtMunicipalitiesMap, selectedMunicipality]);

  // Render user permissions section
  const renderUserPermissions = () => (
    <div className="space-y-4">
      {/* Search and filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="officer">Officer</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="sm" onClick={resetUserFilters} className="whitespace-nowrap">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Filters
        </Button>
      </div>
      
      {/* Bulk actions */}
      <Card className="shadow-sm bg-muted/30">
        <CardHeader className="py-3">
          <CardTitle className="text-md">Bulk Permissions Update</CardTitle>
          <CardDescription>
            Set permissions for multiple users at once
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            {Object.entries(userPermissionLabels).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox 
                  id={`bulk-${key}`} 
                  checked={userBulkPermissions[key as keyof UserPermissions] === true}
                  indeterminate={userBulkPermissions[key as keyof UserPermissions] === false}
                  onCheckedChange={() => toggleBulkUserPermission(key as keyof UserPermissions)}
                />
                <label htmlFor={`bulk-${key}`} className="text-sm">
                  {label}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between py-3">
          <div className="text-sm text-muted-foreground">
            {selectedUserIds.length} users selected
          </div>
          <Button 
            size="sm" 
            onClick={applyBulkUserPermissions}
            disabled={selectedUserIds.length === 0 || Object.keys(userBulkPermissions).length === 0}
          >
            Apply Changes
          </Button>
        </CardFooter>
      </Card>
      
      {/* Users table */}
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length} 
                  indeterminate={selectedUserIds.length > 0 && selectedUserIds.length < filteredUsers.length}
                  onCheckedChange={toggleSelectAllUsers}
                />
              </TableHead>
              <TableHead>Username</TableHead>
              <TableHead className="hidden md:table-cell">Role</TableHead>
              <TableHead colSpan={Object.keys(userPermissionLabels).length} className="text-center">
                Permissions
              </TableHead>
            </TableRow>
            <TableRow className="bg-muted/50">
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead className="hidden md:table-cell"></TableHead>
              {Object.values(userPermissionLabels).map((label, i) => (
                <TableHead key={i} className="text-center text-xs font-medium px-1">
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {userLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[80px]" /></TableCell>
                  {Object.keys(userPermissionLabels).map((_, j) => (
                    <TableCell key={j} className="text-center"><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedUserIds.includes(user._id)}
                      onCheckedChange={() => toggleUserSelection(user._id)}
                      disabled={user.role === 'superadmin'}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.username}
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={user.role === 'superadmin' ? 'destructive' : 
                                     user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  {Object.keys(userPermissionLabels).map((permission) => (
                    <TableCell key={permission} className="text-center">
                      {user.role === 'superadmin' ? (
                        <Check className="h-4 w-4 text-green-500 mx-auto opacity-50" />
                      ) : user.permissions?.[permission as keyof UserPermissions] ? (
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={Object.keys(userPermissionLabels).length + 3} className="text-center py-6">
                  <div className="flex flex-col items-center">
                    <User className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  // Render homestay permissions section
  const renderHomestayPermissions = () => (
    <div className="space-y-4">
      {/* Search and filter */}
      <div className="flex flex-col md:flex-row flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search homestays..."
            value={homestaySearchQuery}
            onChange={(e) => setHomestaySearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={homestayStatusFilter} onValueChange={setHomestayStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={homestayAdminFilter} onValueChange={setHomestayAdminFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by admin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Admins</SelectItem>
            {adminUsernames.filter(username => username && username.trim() !== '').map((username) => (
              <SelectItem key={username} value={username}>{username}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Homestay Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="community">Community</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="sm" onClick={resetHomestayFilters} className="whitespace-nowrap">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Filters
        </Button>
      </div>
      
      {/* Enhanced geographic filters */}
      <div className="flex flex-col md:flex-row flex-wrap gap-3 mb-4 p-3 border rounded-md bg-muted/20">
        <div className="text-sm font-medium mb-1 w-full">Geographic Filters</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          <div className="space-y-1">
            <label className="block text-xs font-medium mb-1">Province</label>
            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                {addressData.allProvinces.filter(province => province && province.trim() !== '').map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <label className="block text-xs font-medium mb-1">District</label>
            <Select 
              value={selectedDistrict} 
              onValueChange={setSelectedDistrict}
              disabled={!selectedProvince}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {availableDistricts.filter(district => district && district.trim() !== '').map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <label className="block text-xs font-medium mb-1">Municipality</label>
            <Select 
              value={selectedMunicipality} 
              onValueChange={setSelectedMunicipality}
              disabled={!selectedDistrict}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Municipality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Municipalities</SelectItem>
                {availableMunicipalities.filter(municipality => municipality && municipality.trim() !== '').map((municipality) => (
                  <SelectItem key={municipality} value={municipality}>
                    {municipality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Bulk actions */}
      <Card className="shadow-sm bg-muted/30">
        <CardHeader className="py-3">
          <CardTitle className="text-md">Bulk Feature Access Update</CardTitle>
          <CardDescription>
            Set feature access for multiple homestays at once
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {Object.entries(featureAccessLabels).map(([key, label]) => (
              <div key={key} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id={`bulk-feature-${key}`} 
                    checked={homestayBulkFeatures[key as keyof HomeStayFeatureAccess] === true}
                    onCheckedChange={(checked) => {
                      // If already true, set to false (explicit deny)
                      // If false or undefined, set to true (allow)
                      const newValue = checked === 'indeterminate' 
                        ? undefined 
                        : Boolean(checked);
                      
                      toggleBulkHomestayFeature(key as keyof HomeStayFeatureAccess, newValue);
                    }}
                    className={homestayBulkFeatures[key as keyof HomeStayFeatureAccess] === false 
                      ? "bg-red-100 border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:text-white" 
                      : ""}
                  />
                  <label htmlFor={`bulk-feature-${key}`} className="text-sm">
                    {label}
                  </label>
                </div>
                <div className="text-xs ml-6 text-muted-foreground">
                  {homestayBulkFeatures[key as keyof HomeStayFeatureAccess] === true && 
                    <span className="text-green-600">Allow</span>
                  }
                  {homestayBulkFeatures[key as keyof HomeStayFeatureAccess] === false && 
                    <span className="text-red-600">Deny</span>
                  }
                  {homestayBulkFeatures[key as keyof HomeStayFeatureAccess] === undefined && 
                    <span>No change</span>
                  }
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-sm bg-green-500"></div>
                <span>Allow access</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-sm bg-red-500"></div>
                <span>Deny access</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-sm border"></div>
                <span>No change</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between py-3">
          <div className="text-sm text-muted-foreground">
            {selectedHomestayIds.length} homestays selected
          </div>
          <Button 
            size="sm" 
            onClick={applyBulkHomestayFeatures}
            disabled={selectedHomestayIds.length === 0 || Object.keys(homestayBulkFeatures).length === 0}
          >
            Apply Changes
          </Button>
        </CardFooter>
      </Card>
      
      {/* Homestays table */}
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedHomestayIds.length > 0 && selectedHomestayIds.length === filteredHomestays.length} 
                  indeterminate={selectedHomestayIds.length > 0 && selectedHomestayIds.length < filteredHomestays.length}
                  onCheckedChange={toggleSelectAllHomestays}
                />
              </TableHead>
              <TableHead>Homestay</TableHead>
              <TableHead className="hidden md:table-cell">Admin</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead colSpan={Object.keys(featureAccessLabels).length} className="text-center">
                Feature Access
              </TableHead>
            </TableRow>
            <TableRow className="bg-muted/50">
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead className="hidden md:table-cell"></TableHead>
              <TableHead className="hidden md:table-cell"></TableHead>
              {Object.values(featureAccessLabels).map((label, i) => (
                <TableHead key={i} className="text-center text-xs font-medium px-1">
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {homestayLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[80px]" /></TableCell>
                  {Object.keys(featureAccessLabels).map((_, j) => (
                    <TableCell key={j} className="text-center"><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredHomestays.length > 0 ? (
              filteredHomestays.map((homestay) => (
                <TableRow key={homestay._id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedHomestayIds.includes(homestay._id)}
                      onCheckedChange={() => toggleHomestaySelection(homestay._id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {homestay.homeStayName}
                    <div className="text-xs text-muted-foreground flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {homestay.address?.province?.en || 'N/A'}, {homestay.address?.district?.en || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center">
                      <Building className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      {homestay.adminUsername}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={
                      homestay.status === 'approved' ? 'default' : 
                      homestay.status === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {homestay.status}
                    </Badge>
                  </TableCell>
                  {Object.keys(featureAccessLabels).map((feature) => (
                    <TableCell key={feature} className="text-center">
                      {homestay.featureAccess?.[feature as keyof HomeStayFeatureAccess] ? (
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={Object.keys(featureAccessLabels).length + 4} className="text-center py-6">
                  <div className="flex flex-col items-center">
                    <Home className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No homestays found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
        <p className="text-muted-foreground">
          Configure granular permissions for users and feature access for homestays
        </p>
      </div>

      {/* Permissions Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            User Permissions
          </TabsTrigger>
          <TabsTrigger value="homestays" className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            Homestay Features
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-4">
          {renderUserPermissions()}
        </TabsContent>
        
        <TabsContent value="homestays" className="mt-4">
          {renderHomestayPermissions()}
        </TabsContent>
      </Tabs>
    </div>
  );
} 