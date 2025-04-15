'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Filter, 
  Search, 
  Plus, 
  Trash, 
  Edit, 
  Save, 
  Check, 
  X, 
  RefreshCw,
  Eye,
  Building, 
  FileText, 
  MapPin, 
  Home,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";

// Define custom field types for field definitions
interface CustomFieldDefinition {
  fieldId: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  required: boolean;
  addedBy: string;
  addedAt: string;
  appliedTo?: { homestayId: string; homeStayName: string }[];
}

// Define homestay interface similar to permissions page
interface Homestay {
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
}

// Define filter options
interface FilterOptions {
  adminUsername?: string;
  province?: string;
  district?: string;
  municipality?: string;
  homeStayType?: 'community' | 'private' | 'all';
}

interface AdminOption {
  username: string;
  email: string;
}

// Address data interface matching permissions page
interface AddressData {
  allProvinces: string[];
  provinceDistrictsMap: Record<string, string[]>;
  districtMunicipalitiesMap: Record<string, string[]>;
  districtTranslations: Record<string, string>;
  municipalityTranslations: Record<string, string>;
}

export default function CustomFieldsPage() {
  // State for custom fields
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for homestays (similar to permissions page)
  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [filteredHomestays, setFilteredHomestays] = useState<Homestay[]>([]);
  const [selectedHomestayIds, setSelectedHomestayIds] = useState<string[]>([]);
  const [homestayLoading, setHomestayLoading] = useState(true);
  const [homestaySearchQuery, setHomestaySearchQuery] = useState('');
  
  // State for filtering (match permissions page)
  const [filters, setFilters] = useState<FilterOptions>({
    adminUsername: 'all',
    province: 'all',
    district: 'all',
    municipality: 'all',
    homeStayType: 'all'
  });
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  
  // Address data state (match permissions page)
  const [addressData, setAddressData] = useState<AddressData>({
    allProvinces: [],
    provinceDistrictsMap: {},
    districtMunicipalitiesMap: {},
    districtTranslations: {},
    municipalityTranslations: {}
  });
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);
  
  // State for the new field dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newField, setNewField] = useState<Partial<CustomFieldDefinition>>({
    type: 'text',
    required: false
  });
  const [applyToAll, setApplyToAll] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initial data load
  useEffect(() => {
    Promise.all([
      fetchCustomFields(),
      fetchHomestays(),
      fetchAdmins(),
      fetchAddressData()
    ]).catch(err => {
      console.error("Failed to load initial data:", err);
      setError("Failed to load initial data. Please try again.");
    }).finally(() => {
      setLoading(false);
    });
  }, []);
  
  // Update available districts when province changes
  useEffect(() => {
    if (filters.province && filters.province !== 'all' && addressData.provinceDistrictsMap) {
      const districts = addressData.provinceDistrictsMap[filters.province] || [];
      setAvailableDistricts(districts);
      
      // Reset district if it's no longer valid
      const currentDistrict = filters.district || 'all';
      if (currentDistrict !== 'all' && !districts.includes(currentDistrict)) {
        setFilters(prev => ({ ...prev, district: 'all', municipality: 'all' }));
      }
    } else {
      setAvailableDistricts([]);
      if (filters.district !== 'all') {
        setFilters(prev => ({ ...prev, district: 'all', municipality: 'all' }));
      }
    }
  }, [filters.province, addressData.provinceDistrictsMap, filters.district]);
  
  // Update available municipalities when district changes
  useEffect(() => {
    if (filters.district && filters.district !== 'all' && addressData.districtMunicipalitiesMap) {
      const municipalities = addressData.districtMunicipalitiesMap[filters.district] || [];
      setAvailableMunicipalities(municipalities);
      
      // Reset municipality if it's no longer valid
      const currentMunicipality = filters.municipality || 'all';
      if (currentMunicipality !== 'all' && !municipalities.includes(currentMunicipality)) {
        setFilters(prev => ({ ...prev, municipality: 'all' }));
      }
    } else {
      setAvailableMunicipalities([]);
      if (filters.municipality !== 'all') {
        setFilters(prev => ({ ...prev, municipality: 'all' }));
      }
    }
  }, [filters.district, addressData.districtMunicipalitiesMap, filters.municipality]);
  
  // Fetch custom fields
  const fetchCustomFields = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query params from filters
      const params = new URLSearchParams();
      if (filters.adminUsername && filters.adminUsername !== 'all') params.append('adminUsername', filters.adminUsername);
      if (filters.province && filters.province !== 'all') params.append('province', filters.province);
      if (filters.district && filters.district !== 'all') params.append('district', filters.district);
      if (filters.municipality && filters.municipality !== 'all') params.append('municipality', filters.municipality);
      if (filters.homeStayType && filters.homeStayType !== 'all') params.append('homeStayType', filters.homeStayType);
      
      const response = await fetch(`/api/superadmin/custom-fields?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCustomFields(data.fieldDefinitions || []);
    } catch (err) {
      console.error("Failed to fetch custom fields:", err);
      setError("Failed to fetch custom fields. Please try again.");
      toast.error("Failed to fetch custom fields");
    } finally {
      setLoading(false);
    }
  };

  // Fetch homestays (similar to permissions page)
  const fetchHomestays = async () => {
    try {
      setHomestayLoading(true);
      const response = await fetch('/api/superadmin/homestays');
      const data = await response.json();
      
      if (data.homestays) {
        // Normalize the data with proper type handling
        const normalizedHomestays = data.homestays.map((homestay: any) => {
          // Ensure proper type handling
          let typeValue = homestay.homeStayType || 'private';
          const normalizedType = typeValue.toLowerCase().includes('community') ? 'community' : 'private';
          
          return {
            ...homestay,
            homeStayType: normalizedType
          };
        });
        
        setHomestays(normalizedHomestays);
        setFilteredHomestays(normalizedHomestays);
      }
    } catch (error) {
      console.error('Error fetching homestays:', error);
      toast.error('Failed to load homestays');
    } finally {
      setHomestayLoading(false);
    }
  };
  
  // Fetch admins for filtering
  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/superadmin/users?role=admin');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAdmins(data.users || []);
    } catch (err) {
      console.error("Failed to fetch admins:", err);
      toast.error("Failed to fetch admin list");
    }
  };
  
  // Fetch address data for filters (match permissions page)
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
      toast.error("Failed to load location data");
    }
  };
  
  // Filter homestays on search and filter changes
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
    
    // Apply admin filter
    if (filters.adminUsername && filters.adminUsername !== 'all') {
      results = results.filter(homestay => homestay.adminUsername === filters.adminUsername);
    }
    
    // Apply province filter
    if (filters.province && filters.province !== 'all') {
      results = results.filter(homestay => {
        const province = homestay.address?.province;
        if (!province) return false;
        
        return (
          (province.ne && province.ne.toLowerCase() === filters.province?.toLowerCase()) ||
          (province.en && province.en.toLowerCase() === filters.province?.toLowerCase())
        );
      });
    }
    
    // Apply district filter
    if (filters.district && filters.district !== 'all') {
      results = results.filter(homestay => {
        const district = homestay.address?.district;
        if (!district) return false;
        
        return (
          (district.ne && district.ne.toLowerCase() === filters.district?.toLowerCase()) ||
          (district.en && district.en.toLowerCase() === filters.district?.toLowerCase())
        );
      });
    }
    
    // Apply municipality filter
    if (filters.municipality && filters.municipality !== 'all') {
      results = results.filter(homestay => {
        const municipality = homestay.address?.municipality;
        if (!municipality) return false;
        
        return (
          (municipality.ne && municipality.ne.toLowerCase() === filters.municipality?.toLowerCase()) ||
          (municipality.en && municipality.en.toLowerCase() === filters.municipality?.toLowerCase())
        );
      });
    }
    
    // Apply homestay type filter
    if (filters.homeStayType && filters.homeStayType !== 'all') {
      results = results.filter(homestay => 
        homestay.homeStayType.toLowerCase() === filters.homeStayType?.toLowerCase()
      );
    }
    
    setFilteredHomestays(results);
  }, [homestays, homestaySearchQuery, filters]);
  
  // Handle filter changes
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    // If province changes, reset district and municipality
    if (key === 'province') {
      setFilters(prev => ({ ...prev, [key]: value, district: 'all', municipality: 'all' }));
    }
    // If district changes, reset municipality
    else if (key === 'district') {
      setFilters(prev => ({ ...prev, [key]: value, municipality: 'all' }));
    }
    // Otherwise just update the single field
    else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };
  
  // Apply filters and fetch results
  const applyFilters = () => {
    // Just re-fetch custom fields based on current filters
    fetchCustomFields();
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      adminUsername: 'all',
      province: 'all',
      district: 'all',
      municipality: 'all',
      homeStayType: 'all'
    });
    setHomestaySearchQuery('');
    fetchCustomFields();
  };
  
  // Toggle select all homestays
  const toggleSelectAllHomestays = () => {
    if (selectedHomestayIds.length === filteredHomestays.length) {
      setSelectedHomestayIds([]);
    } else {
      setSelectedHomestayIds(filteredHomestays.map(homestay => homestay._id));
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
  
  // Handle new field input changes
  const handleNewFieldChange = (key: string, value: any) => {
    setNewField(prev => ({ ...prev, [key]: value }));
  };
  
  // Add options to a select-type field
  const addOption = () => {
    const option = prompt("Enter option text:");
    if (!option) return;
    
    setNewField(prev => ({
      ...prev,
      options: [...(prev.options || []), option]
    }));
  };
  
  // Remove an option from a select-type field
  const removeOption = (index: number) => {
    setNewField(prev => ({
      ...prev,
      options: (prev.options || []).filter((_, i) => i !== index)
    }));
  };
  
  // Create a new custom field
  const createCustomField = async () => {
    setIsSubmitting(true);
    setError('');
    
    // Validate input
    if (!newField.label || newField.label.trim() === '') {
      setError('Field label is required');
      setIsSubmitting(false);
      return;
    }
    
    if (!newField.type) {
      setError('Field type is required');
      setIsSubmitting(false);
      return;
    }
    
    // If not applying to all, require at least one homestay to be selected
    if (!applyToAll && (!selectedHomestayIds || selectedHomestayIds.length === 0)) {
      setError('Please select at least one homestay or enable "Apply to all matching homestays"');
      setIsSubmitting(false);
      return;
    }

    // Automatically set applyToAll to false if homestays are selected
    const shouldApplyToAll = selectedHomestayIds.length === 0 ? applyToAll : false;
    
    try {
      // Debug information
      console.log('Creating custom field with:', {
        fieldLabel: newField.label,
        fieldType: newField.type,
        applyToAll: shouldApplyToAll,
        selectedCount: selectedHomestayIds.length,
        selectedIds: selectedHomestayIds,
        filters: filters
      });
      
      const response = await fetch('/api/superadmin/custom-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldDefinition: newField,
          filter: filters,
          applyToAll: shouldApplyToAll,
          selectedHomestayIds: selectedHomestayIds
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error creating custom field:', data);
        setError(data.error || data.details || 'Failed to create custom field');
        toast.error(data.error || data.details || 'Failed to create custom field');
        setIsSubmitting(false);
        return;
      }

      console.log('Custom field created successfully:', data);
      toast.success(
        `Custom field "${newField.label}" created and applied to ${data.affectedHomestays} homestays`
      );
      
      // Reset form
      setNewField({
        label: '',
        type: 'text',
        options: [],
        required: false,
      });
      setSelectedHomestayIds([]);
      setApplyToAll(true);
      
      // Refresh data
      fetchHomestays();
      fetchCustomFields();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating custom field:', error);
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to create custom field. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete a custom field
  const deleteCustomField = async (fieldId: string) => {
    if (!confirm("Are you sure you want to delete this custom field? This will remove it from all homestays.")) {
      return;
    }
    
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('fieldId', fieldId);
      if (filters.adminUsername && filters.adminUsername !== 'all') params.append('adminUsername', filters.adminUsername);
      
      const response = await fetch(`/api/superadmin/custom-fields?${params.toString()}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      toast.success("Custom field deleted successfully");
      
      // Refresh the custom fields list
      fetchCustomFields();
    } catch (err) {
      console.error("Failed to delete custom field:", err);
      toast.error("Failed to delete custom field");
    }
  };
  
  // Render geographic filters
  const renderGeographicFilters = () => (
    <div className="flex flex-col gap-3 mb-4 p-3 border rounded-md bg-muted/20">
      <div className="text-sm font-medium mb-1 w-full">Geographic Filters</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
        <div className="space-y-1">
          <label className="block text-xs font-medium mb-1">Province</label>
          <select
            value={filters.province}
            onChange={(e) => handleFilterChange('province', e.target.value)}
            className="w-full p-2 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Provinces</option>
            {addressData.allProvinces
              .filter(province => province && province.trim() !== '')
              .map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="block text-xs font-medium mb-1">District</label>
          <select
            value={filters.district}
            onChange={(e) => handleFilterChange('district', e.target.value)}
            className="w-full p-2 rounded-md border border-input bg-background text-sm"
            disabled={filters.province === 'all'}
          >
            <option value="all">All Districts</option>
            {availableDistricts
              .filter(district => district && district.trim() !== '')
              .map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="block text-xs font-medium mb-1">Municipality</label>
          <select
            value={filters.municipality}
            onChange={(e) => handleFilterChange('municipality', e.target.value)}
            className="w-full p-2 rounded-md border border-input bg-background text-sm"
            disabled={filters.district === 'all'}
          >
            <option value="all">All Municipalities</option>
            {availableMunicipalities
              .filter(municipality => municipality && municipality.trim() !== '')
              .map((municipality) => (
                <option key={municipality} value={municipality}>
                  {municipality}
                </option>
              ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full mt-2">
        <div className="space-y-1">
          <label className="block text-xs font-medium mb-1">Homestay Type</label>
          <select
            value={filters.homeStayType}
            onChange={(e) => handleFilterChange('homeStayType', e.target.value as any)}
            className="w-full p-2 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Types</option>
            <option value="private">Private</option>
            <option value="community">Community</option>
          </select>
        </div>
      </div>
    </div>
  );
  
  // Render homestays table similar to permissions page
  const renderHomestaysTable = () => (
    <div className="rounded-md border shadow-sm mt-4 mb-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={selectedHomestayIds.length > 0 && selectedHomestayIds.length === filteredHomestays.length} 
                onCheckedChange={toggleSelectAllHomestays}
              />
            </TableHead>
            <TableHead>Homestay Name</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Province</TableHead>
            <TableHead>District</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {homestayLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-muted-foreground">Loading homestays...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : filteredHomestays.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <div className="flex flex-col items-center justify-center">
                  <Building className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No homestays found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredHomestays.map((homestay) => (
              <TableRow key={homestay._id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedHomestayIds.includes(homestay._id)} 
                    onCheckedChange={() => toggleHomestaySelection(homestay._id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{homestay.homeStayName}</TableCell>
                <TableCell>{homestay.homestayId}</TableCell>
                <TableCell>{homestay.adminUsername}</TableCell>
                <TableCell>
                  <Badge variant={homestay.homeStayType === 'community' ? 'default' : 'outline'}>
                    {homestay.homeStayType === 'community' ? 'Community' : 'Private'}
                  </Badge>
                </TableCell>
                <TableCell>{homestay.address?.province?.en || '-'}</TableCell>
                <TableCell>{homestay.address?.district?.en || '-'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Custom Fields</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Custom Field
        </Button>
      </div>
      
      <p className="text-muted-foreground">
        Create and manage custom fields for homestays based on specific criteria.
      </p>
      
      {/* Filter Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RefreshCw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
          <CardDescription>
            Filter homestays to apply custom fields to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Admin Filter */}
            <div className="space-y-2">
              <Label htmlFor="adminFilter">Admin</Label>
              <Select 
                value={filters.adminUsername} 
                onValueChange={(value) => handleFilterChange('adminUsername', value)}
              >
                <SelectTrigger id="adminFilter">
                  <SelectValue placeholder="Select admin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Admins</SelectItem>
                  {admins.map(admin => (
                    <SelectItem key={admin.username} value={admin.username}>
                      {admin.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Homestay Search */}
            <div className="space-y-2">
              <Label htmlFor="homestaySearch">Search Homestays</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="homestaySearch"
                  placeholder="Search by name, ID, or DHSR number..."
                  value={homestaySearchQuery}
                  onChange={(e) => setHomestaySearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          
          {/* Geographic filters */}
          {renderGeographicFilters()}
          
          {/* Homestays table for selection */}
          {renderHomestaysTable()}
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedHomestayIds.length} homestays selected
            </div>
            <Button onClick={applyFilters}>
              <Filter className="mr-2 h-4 w-4" /> Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Custom Fields List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Custom Fields</CardTitle>
          <CardDescription>
            Custom fields that are currently defined for the selected filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">{error}</p>
              <Button onClick={fetchCustomFields}>Try Again</Button>
            </div>
          ) : customFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No custom fields found for the selected filters.</p>
              <p>Use the "Add Custom Field" button to create a new field.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customFields.map((field) => (
                <div key={field.fieldId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{field.label}</h3>
                      <Badge variant="outline">
                        {field.type.charAt(0).toUpperCase() + field.type.slice(1)}
                      </Badge>
                      {field.required && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Required
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteCustomField(field.fieldId)}
                      className="text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    Field ID: {field.fieldId}
                  </div>
                  
                  {field.type === 'select' && field.options && field.options.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium mb-1">Options:</p>
                      <div className="flex flex-wrap gap-1">
                        {field.options.map((option, i) => (
                          <Badge key={i} variant="secondary">{option}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    Added by {field.addedBy} on {new Date(field.addedAt).toLocaleDateString()}
                  </div>
                  
                  {field.appliedTo && field.appliedTo.length > 0 && (
                    <Accordion type="single" collapsible className="mt-2">
                      <AccordionItem value="appliedTo">
                        <AccordionTrigger className="text-sm">
                          Applied to {field.appliedTo.length} homestays
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="max-h-40 overflow-y-auto">
                            <ul className="space-y-1">
                              {field.appliedTo.map(homestay => (
                                <li key={homestay.homestayId} className="text-sm">
                                  {homestay.homeStayName} ({homestay.homestayId})
                                </li>
                              ))}
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* New Custom Field Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
            <DialogDescription>
              Create a new custom field for homestays that match your filters.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fieldLabel">Field Label*</Label>
              <Input
                id="fieldLabel"
                value={newField.label || ''}
                onChange={(e) => handleNewFieldChange('label', e.target.value)}
                placeholder="e.g. Special Feature, Local Cuisine"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fieldType">Field Type*</Label>
              <Select 
                value={newField.type} 
                onValueChange={(value) => handleNewFieldChange('type', value)}
              >
                <SelectTrigger id="fieldType">
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="boolean">Yes/No</SelectItem>
                  <SelectItem value="select">Select (Dropdown)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newField.type === 'select' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Options</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={addOption}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Option
                  </Button>
                </div>
                
                {(!newField.options || newField.options.length === 0) ? (
                  <p className="text-sm text-muted-foreground">No options added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {newField.options?.map((option, index) => (
                      <div key={index} className="flex items-center">
                        <div className="flex-grow bg-secondary rounded px-3 py-1 text-sm">
                          {option}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeOption(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="required" 
                checked={newField.required} 
                onCheckedChange={(checked) => handleNewFieldChange('required', checked)}
              />
              <Label htmlFor="required">Required field</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="applyToAll" 
                checked={applyToAll} 
                onCheckedChange={(checked) => setApplyToAll(!!checked)}
              />
              <Label htmlFor="applyToAll">
                {applyToAll ? 
                  "Apply to all matching homestays" : 
                  "Apply only to selected homestays"
                }
              </Label>
            </div>
            
            {!applyToAll && selectedHomestayIds.length === 0 && (
              <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                Please select at least one homestay from the table above.
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={createCustomField}
              disabled={(!applyToAll && selectedHomestayIds.length === 0) || !newField.label || !newField.type}
            >
              Create Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 