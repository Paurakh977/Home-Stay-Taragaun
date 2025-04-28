"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, BarChart2, Mail, Phone, MapPin, Calendar, Download, FileText, FileSpreadsheet, Search, Filter, ArrowUpDown } from 'lucide-react';
import Image from 'next/image';
import { useBranding } from '@/context/BrandingContext';
import { getImageUrl } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { attractionsCategories } from '@/app/register/components/HomestayFeaturesForm';

interface FilterOptions {
  province?: string;
  district?: string;
  municipality?: string;
  homestayType?: 'community' | 'private' | '';
  status?: 'approved' | 'pending' | 'rejected' | '';
  selectedAttractions?: string[];
  selectedInfrastructure?: string[];
  selectedServices?: string[];
}

interface Homestay {
  _id: string;
  homestayId: string;
  homeStayName: string;
  homeStayType: 'community' | 'private';
  dhsrNo?: string;
  status: 'pending' | 'approved' | 'rejected';
  address?: {
    formattedAddress: {
      en: string;
      ne: string;
    };
    province: {
      en: string;
      ne: string;
    };
    district: {
      en: string;
      ne: string;
    };
    municipality: {
      en: string;
      ne: string;
    };
    ward?: string;
    city?: string;
    tole?: string;
  };
  villageName?: string;
  roomCount?: number;
  homeCount?: number;
  bedCount?: number;
  description?: string;
  features?: {
    localAttractions?: string[];
    tourismServices?: string[];
    infrastructure?: string[];
  };
}

interface ReportPageProps {
  title: string;
  description: string;
  type: 'geographical-classification' | 'service-ratings' | 'tourism-attractions' | 'infrastructure' | 'homestay-services';
  userType: 'admin' | 'officer';
  username: string;
}

// Add infrastructure constants (should match HomestayFeaturesForm)
const commonInfrastructure = [
  { value: "Community Building/सामुदायिक भवन", checked: false },
  { value: "Guest Room, Toilet, Bathroom/पाहुना कोठा, शौचालय, स्नानघर", checked: false },
  { value: "Transportation Facility/यातायात सुविधा", checked: false },
  { value: "Drinking Water and Solar Lighting/खानेपानी तथा सोलार बत्ती", checked: false },
  { value: "Security Post (Nepaltar)/सुरक्षा चौकी (नेपालटार)", checked: false },
  { value: "Health Post (Udayapurgadhi)/स्वास्थ्य चौकी (उदयपुरगढी)", checked: false },
  { value: "Communication Facility (Mobile)/सञ्चार सुविधा (मोबाइल)", checked: false },
];

// Add tourism services constants (should match HomestayFeaturesForm)
const commonTourismServices = [
  { value: "Welcome and Farewell/स्वागत तथा विदाई", checked: false },
  { value: "Comfortable Accommodation/आरामदायी आवास", checked: false },
  { value: "Gift or Souvenir/मायाको चिनो (उपहार)", checked: false },
  { value: "Traditional Cultural Program/परम्परागत सांस्कृतिक कार्यक्रम", checked: false },
  { value: "Local Dishes/स्थानीय परिकारहरू", checked: false },
];

export default function ReportPage({ 
  title, 
  description, 
  type,
  userType,
  username
}: ReportPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  
  const branding = useBranding();
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Fetch homestays data
  useEffect(() => {
    const fetchHomestays = async () => {
      if (type !== 'geographical-classification' && type !== 'tourism-attractions' && type !== 'infrastructure' && type !== 'homestay-services') return;
      
      try {
        setLoading(true);
        
        // Build query string from filters
        const queryParams = new URLSearchParams();
        
        // Add standard filtering parameters
        if (filters.province) queryParams.append('province', filters.province);
        if (filters.district) queryParams.append('district', filters.district);
        if (filters.municipality) queryParams.append('municipality', filters.municipality);
        if (filters.homestayType) queryParams.append('homestayType', filters.homestayType);
        if (filters.status) queryParams.append('status', filters.status);
        
        // Add attraction filter if applicable
        if (type === 'tourism-attractions' && filters.selectedAttractions && filters.selectedAttractions.length > 0) {
          queryParams.append('attractions', filters.selectedAttractions.join(','));
          queryParams.append('includeFeatures', 'true'); // Ensure features are included when filtering by attractions
        } else if (type === 'tourism-attractions') {
          queryParams.append('includeFeatures', 'true');
        }
        
        // Add infrastructure filter if applicable
        if (type === 'infrastructure') {
          queryParams.append('includeFeatures', 'true'); // Always include features for infrastructure report
          
          if (filters.selectedInfrastructure && filters.selectedInfrastructure.length > 0) {
            queryParams.append('infrastructure', filters.selectedInfrastructure.join(','));
          }
        }
        
        // Add tourism services filter if applicable
        if (type === 'homestay-services') {
          queryParams.append('includeFeatures', 'true'); // Always include features for homestay services report
          
          if (filters.selectedServices && filters.selectedServices.length > 0) {
            queryParams.append('services', filters.selectedServices.join(','));
          }
        }
        
        // Add admin username from props
        queryParams.append('adminUsername', username);
        
        // Build full API endpoint URL with query parameters
        const endpoint = userType === 'admin' 
          ? `/api/admin/homestays?${queryParams.toString()}`
          : `/api/officer/homestays?${queryParams.toString()}`;
        
        console.log('Fetching homestays with params:', endpoint);
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch homestay data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        // Process and set homestays data
        const homestaysArray = Array.isArray(data) ? data : 
                              (data.homestays ? data.homestays : []);
        
        console.log('Processed homestays:', homestaysArray);
        setHomestays(homestaysArray);
        
        // Extract unique location data from received homestays if API doesn't provide dropdowns
        const uniqueProvinces = [...new Set(homestaysArray
          .filter((h: Homestay) => h.address?.province?.en)
          .map((h: Homestay) => h.address?.province?.en))];
        
        setProvinces(uniqueProvinces as string[]);
        
        // Extract districts if province is selected
        if (filters.province) {
          const uniqueDistricts = [...new Set(homestaysArray
            .filter((h: Homestay) => 
              getValue(h, 'address.province.en') === filters.province)
            .map((h: Homestay) => getValue(h, 'address.district.en')))];
          setDistricts(uniqueDistricts.filter(Boolean) as string[]);
        }
        
        // Extract municipalities if district is selected
        if (filters.district) {
          const uniqueMunicipalities = [...new Set(homestaysArray
            .filter((h: Homestay) => 
              getValue(h, 'address.district.en') === filters.district)
            .map((h: Homestay) => getValue(h, 'address.municipality.en')))];
          setMunicipalities(uniqueMunicipalities.filter(Boolean) as string[]);
        }
        
        // Also try to fetch location data for dropdowns from API
        try {
          const fetchLocationsResponse = await fetch('/api/admin/locations');
          if (fetchLocationsResponse.ok) {
            const locationsData = await fetchLocationsResponse.json();
            
            // Get unique provinces for filter dropdown if API provides them
            if (locationsData.provinces && Array.isArray(locationsData.provinces)) {
              setProvinces(locationsData.provinces);
            }
            
            // Get districts for the selected province
            if (filters.province && locationsData.districts) {
              const provinceDistricts = locationsData.districts
                .filter((d: any) => d.province === filters.province)
                .map((d: any) => d.name);
              setDistricts(provinceDistricts);
            }
            
            // Get municipalities for the selected district
            if (filters.district && locationsData.municipalities) {
              const districtMunicipalities = locationsData.municipalities
                .filter((m: any) => m.district === filters.district)
                .map((m: any) => m.name);
              setMunicipalities(districtMunicipalities);
            }
          }
        } catch (locError) {
          console.error('Error fetching location data:', locError);
          // Fallback to locations extracted from homestays is handled above
        }
        
      } catch (error) {
        console.error('Error fetching homestay data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHomestays();
  // Separate individual filter properties to ensure proper dependency tracking
  }, [type, filters.province, filters.district, filters.municipality, 
      filters.homestayType, filters.status, filters.selectedAttractions, 
      filters.selectedInfrastructure, filters.selectedServices, username, userType]);
  
  const goBack = () => {
    const basePath = userType === 'admin' ? `/admin/${username}` : `/officer/${username}`;
    router.push(basePath);
  };
  
  // Handle filter change for various filter types
  const handleFilterChange = (name: keyof FilterOptions, value: string, e?: React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLInputElement>) => {
    // Special handling for checkboxes (attractions and infrastructure)
    if ((name === 'selectedAttractions' || name === 'selectedInfrastructure' || name === 'selectedServices') && e?.target.type === 'checkbox') {
      const isChecked = e.target.checked;
      
      setFilters(prevFilters => {
        // Get the current array or initialize it
        const currentArray = prevFilters[name] || [];
        
        // Add or remove the value
        if (isChecked) {
          return { ...prevFilters, [name]: [...currentArray, value] };
        } else {
          return { ...prevFilters, [name]: currentArray.filter(item => item !== value) };
        }
      });
      
      return;
    }
    
    // Regular handling for other filters
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value };
      
      // When province changes, reset district and municipality
      if (name === 'province') {
        newFilters.district = '';
        newFilters.municipality = '';
      }
      
      // When district changes, reset municipality
      if (name === 'district') {
        newFilters.municipality = '';
      }
      
      return newFilters;
    });
  };
  
  const resetFilters = () => {
    setFilters({});
    setDistricts([]);
    setMunicipalities([]);
  };

  // Helper function to get nested properties safely
  const getValue = (obj: any, path: string) => {
    if (!obj) return '';
    
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === undefined || result === null) return '';
      result = result[key];
    }
    
    // Handle {en, ne} objects specifically
    if (result && typeof result === 'object' && 'en' in result) {
      return result.en || '';
    }
    
    return result !== undefined && result !== null ? result : '';
  };

  // Sort function for table columns
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting to homestays data
  const sortedHomestays = [...homestays].sort((a, b) => {
    if (!sortConfig) return 0;
    
    // Special handling for attractions field
    if (sortConfig.key === 'features.localAttractions') {
      const aAttractions = a.features?.localAttractions || [];
      const bAttractions = b.features?.localAttractions || [];
      
      const aValue = aAttractions.length;
      const bValue = bAttractions.length;
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    }
    
    let aValue: any = getValue(a, sortConfig.key);
    let bValue: any = getValue(b, sortConfig.key);
    
    // Handle null or undefined values
    if (aValue === undefined || aValue === null) aValue = '';
    if (bValue === undefined || bValue === null) bValue = '';
    
    // Convert to lower case for string comparison
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Helper function to format attractions for display
  const formatAttractions = (attractions: string[] | undefined) => {
    if (!attractions || attractions.length === 0) return 'None';
    
    // Count attractions by category
    const categories = {
      natural: 0,
      cultural: 0,
      products: 0,
      forest: 0,
      wildlife: 0,
      adventure: 0,
      other: 0
    };
    
    // Categorize each attraction
    attractions.forEach(attr => {
      if (attr.startsWith('natural:')) {
        categories.natural++;
      } else if (attr.startsWith('cultural:')) {
        categories.cultural++;
      } else if (attr.startsWith('products:')) {
        categories.products++;
      } else if (attr.startsWith('forest:')) {
        categories.forest++;
      } else if (attr.startsWith('wildlife:')) {
        categories.wildlife++;
      } else if (attr.startsWith('adventure:')) {
        categories.adventure++;
      } else if (attr.includes('Park') || attr.includes('National') || attr.includes('River')) {
        categories.natural++;
      } else if (attr.includes('Museum') || attr.includes('Heritage') || attr.includes('Traditional')) {
        categories.cultural++;
      } else {
        categories.other++;
      }
    });
    
    // Format as a summary string
    const parts = [];
    if (categories.natural > 0) parts.push(`${categories.natural} natural`);
    if (categories.cultural > 0) parts.push(`${categories.cultural} cultural`);
    if (categories.products > 0) parts.push(`${categories.products} product`);
    if (categories.forest > 0) parts.push(`${categories.forest} forest`);
    if (categories.wildlife > 0) parts.push(`${categories.wildlife} wildlife`);
    if (categories.adventure > 0) parts.push(`${categories.adventure} adventure`);
    if (categories.other > 0) parts.push(`${categories.other} other`);
    
    return `${attractions.length} attractions (${parts.join(', ')})`;
  };
  
  // Helper function to extract English and Nepali parts from attraction string
  const extractBilingualParts = (attraction: string) => {
    // Handle attractions with category prefix (e.g., "natural:Attraction Name")
    const parts = attraction.split(':');
    const valueWithoutPrefix = parts.length > 1 ? parts[1] : attraction;
    
    // Handle attractions with slash format (English/Nepali)
    const bilingualParts = valueWithoutPrefix.split('/');
    
    if (bilingualParts.length > 1) {
      return {
        en: bilingualParts[0].trim(),
        ne: bilingualParts[1].trim()
      };
    }
    
    // If no Nepali translation exists, return the original value for both
    return {
      en: valueWithoutPrefix.trim(),
      ne: valueWithoutPrefix.trim()
    };
  };

  // For downloading the report data in various formats
  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      setLoading(true);
      
      // Make sure we use the fully filtered data for exports
      const dataToExport = sortedHomestays;
      
      if (format === 'excel') {
        // For Excel export, we'll use the xlsx library
        const XLSX = await import('xlsx');
        
        // Create a header/branding worksheet - REMOVED FILTER INFO
        const brandingWorksheet = XLSX.utils.aoa_to_sheet([
          [`${branding.brandName || 'Department of Tourism'}`],
          ['Government of Nepal'],
          ['Homestay Management System'],
          [''],
          [`Report: ${title}`],
          [description],
          [''],
          [`Generated on: ${currentDate}`],
          [''],
          [`Ref. No: HMS/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}`]
        ]);
        
        // Set wider column width for branding
        brandingWorksheet['!cols'] = [{ wch: 80 }];
        
        // Create data worksheet based on report type
        let worksheet;
        
        if (type === 'tourism-attractions') {
          // For tourism attractions, normalize the data with one attraction per row
          const normalizedData: Array<{
            'S.N.': number;
            'Homestay Name': string;
            'DHSR No': string;
            'Type': string;
            'Formatted Address': string;
            'Local Attraction': string;
            'Homes': number;
            'Rooms': number;
            'Beds': number;
            'Remarks': string;
          }> = [];
          let rowCounter = 1;
          
          dataToExport.forEach((homestay, index) => {
            // Get all basic homestay information
            const homestayInfo = {
              'S.N.': index + 1,
              'Homestay Name': getValue(homestay, 'homeStayName') || 'N/A',
              'DHSR No': getValue(homestay, 'dhsrNo') || 'N/A',
              'Type': getValue(homestay, 'homeStayType') === 'community' ? 'Community' : 'Private',
              'Formatted Address': getValue(homestay, 'address.formattedAddress.en') || 'N/A',
              'Homes': parseInt(getValue(homestay, 'homeCount')) || 0,
              'Rooms': parseInt(getValue(homestay, 'roomCount')) || 0,
              'Beds': parseInt(getValue(homestay, 'bedCount')) || 0,
              'Remarks': ''
            };
            
            // If no attractions, add one row with "None" as attraction
            if (!homestay.features?.localAttractions || homestay.features.localAttractions.length === 0) {
              normalizedData.push({
                ...homestayInfo,
                'Local Attraction': 'None'
              });
              rowCounter++;
              return;
            }
            
            // For each attraction, create a separate row with the same homestay info
            homestay.features.localAttractions.forEach(attraction => {
              const { en } = extractBilingualParts(attraction);
              normalizedData.push({
                ...homestayInfo,
                'Local Attraction': en
              });
              rowCounter++;
            });
          });
          
          worksheet = XLSX.utils.json_to_sheet(normalizedData);
          
          // Set column widths for tourism attractions
          worksheet['!cols'] = [
            { wch: 5 },   // S.N.
            { wch: 25 },  // Homestay Name
            { wch: 15 },  // DHSR No
            { wch: 12 },  // Type
            { wch: 40 },  // Formatted Address
            { wch: 60 },  // Local Attraction
            { wch: 10 },  // Homes
            { wch: 10 },  // Rooms
            { wch: 10 },   // Beds
            { wch: 20 }    // Remarks
          ];
        } else {
          // Original geographical-classification columns
          worksheet = XLSX.utils.json_to_sheet(
          dataToExport.map((homestay, index) => ({
            'S.N.': index + 1,
            'Homestay Name': getValue(homestay, 'homeStayName') || 'N/A',
            'DHSR No': getValue(homestay, 'dhsrNo') || 'N/A',
            'Type': getValue(homestay, 'homeStayType'),
            'Status': getValue(homestay, 'status'),
            'Province': getValue(homestay, 'address.province.en') || 'N/A',
            'District': getValue(homestay, 'address.district.en') || 'N/A',
            'Municipality': getValue(homestay, 'address.municipality.en') || 'N/A',
            'Ward': getValue(homestay, 'address.ward') || 'N/A',
            'City': getValue(homestay, 'address.city') || 'N/A',
            'Tole': getValue(homestay, 'address.tole') || 'N/A',
            'Village': getValue(homestay, 'villageName') || 'N/A',
            'Homes': parseInt(getValue(homestay, 'homeCount')) || 0,
            'Rooms': parseInt(getValue(homestay, 'roomCount')) || 0,
            'Beds': parseInt(getValue(homestay, 'bedCount')) || 0,
            'Remarks': ''
          }))
        );
        
          // Set column widths for geographical classification
          worksheet['!cols'] = [
          { wch: 5 },  // S.N.
          { wch: 25 }, // Homestay Name
          { wch: 15 }, // DHSR No
          { wch: 12 }, // Type
          { wch: 12 }, // Status
          { wch: 20 }, // Province
          { wch: 20 }, // District
          { wch: 20 }, // Municipality
          { wch: 10 }, // Ward
          { wch: 15 }, // City
          { wch: 15 }, // Tole
          { wch: 15 }, // Village
          { wch: 10 }, // Homes
          { wch: 10 }, // Rooms
          { wch: 10 },  // Beds
          { wch: 20 }   // Remarks
        ];
        }
        
        // Create workbook and add the worksheets
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, brandingWorksheet, 'Report Info');
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Homestays');
        
        // Generate filename with date and report type
        const today = new Date().toISOString().slice(0, 10);
        const reportType = type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, '_');
        const filename = `Homestay_${reportType}_Report_${today}.xlsx`;
        
        // Write and download
        XLSX.writeFile(workbook, filename);
        
      } else if (format === 'pdf') {
        // Create a new PDF document
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
          compress: true
        });
        
        // Add header with branding
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;
        
        // Add logo if available
        if (branding.logoPath) {
          try {
            const logoUrl = getImageUrl(branding.logoPath);
            // Create image with width and height to satisfy TypeScript
            const logoImg = document.createElement('img');
            logoImg.crossOrigin = 'Anonymous';
            
            logoImg.onload = function() {
              const aspectRatio = logoImg.width / logoImg.height;
              const imgWidth = 30;  // Increase width for better visibility
              const imgHeight = imgWidth / aspectRatio;
              
              // Adjust position to be centered higher on the page
              doc.addImage(logoImg, 'JPEG', centerX - imgWidth/2, 5, imgWidth, imgHeight);
              completePdfGeneration();
            };
            
            logoImg.onerror = function() {
              console.error('Failed to load logo for PDF');
              completePdfGeneration();
            };
            
            logoImg.src = logoUrl;
          } catch (error) {
            console.error('Error adding logo to PDF:', error);
            completePdfGeneration();
          }
        } else {
          // No logo, continue with the rest of the PDF content
          completePdfGeneration();
        }
        
        // Function to complete PDF generation after attempting to add the logo
        function completePdfGeneration() {
          // Add document title
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text(`${branding.brandName || 'Department of Tourism'}`, centerX, 40, { align: 'center' });
          
          // Add contact information immediately after brand name
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          let contactY = 46;
          
          if (branding.contactInfo?.address) {
            doc.text(`${branding.contactInfo.address}`, centerX, contactY, { align: 'center' });
            contactY += 4;
          }
          
          // Add email and phone on the same line if both exist
          if (branding.contactInfo?.email || branding.contactInfo?.phone) {
            let contactText = '';
            if (branding.contactInfo?.email) {
              contactText += branding.contactInfo.email;
            }
            if (branding.contactInfo?.email && branding.contactInfo?.phone) {
              contactText += ' | ';
            }
            if (branding.contactInfo?.phone) {
              contactText += branding.contactInfo.phone;
            }
            doc.text(contactText, centerX, contactY, { align: 'center' });
            contactY += 6; // Add more space after contact info
          }
          
          // Government and system info after contact info
          doc.setFontSize(12);
          doc.text('Government of Nepal', centerX, contactY, { align: 'center' });
          contactY += 6;
          doc.text('Homestay Management System', centerX, contactY, { align: 'center' });
          contactY += 8;
          
          // Add report title and description
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(`Report: ${title}`, centerX, contactY, { align: 'center' });
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(description, centerX, contactY + 6, { align: 'center' });
          
          // Add date and reference number
          doc.text(`Date: ${currentDate}`, pageWidth - 20, 15, { align: 'right' });
          // Ensure type is treated as string before using substring
          const reportType: string = type.substring(0, 3).toUpperCase();
          const timestamp = Date.now().toString().slice(-6);
          doc.text(`Ref. No: HMS/${reportType}/${new Date().getFullYear()}/${timestamp}`, 20, 15);
          
          // Calculate table start Y position based on content above
          const tableStartY = contactY + 15; // Add more space after the description
          
          // Generate table with data based on report type
          if (type === 'tourism-attractions') {
            // For tourism attractions, normalize the data with one attraction per row
            const normalizedData: Array<(string | number)[]> = [];
            const normalizedHeaders = ['S.N.', 'Homestay Name', 'DHSR No', 'Type', 'Formatted Address', 'Local Attraction', 'Homes', 'Rooms', 'Beds', 'Remarks'];
            
            dataToExport.forEach((homestay, index) => {
              // Only process homestays with complete essential data
              if (!getValue(homestay, 'homeStayName') || !getValue(homestay, 'address.formattedAddress.en')) {
                return; // Skip this homestay if it's missing essential data
              }
              
              // If no attractions, add one row with "None"
              if (!homestay.features?.localAttractions || homestay.features.localAttractions.length === 0) {
                normalizedData.push([
                  index + 1,
                  getValue(homestay, 'homeStayName') || 'N/A',
                  getValue(homestay, 'dhsrNo') || 'N/A',
                  getValue(homestay, 'homeStayType') === 'community' ? 'Community' : 'Private',
                  getValue(homestay, 'address.formattedAddress.en') || 'N/A',
                  'None',
                  Number(getValue(homestay, 'homeCount')) || 0,
                  Number(getValue(homestay, 'roomCount')) || 0,
                  Number(getValue(homestay, 'bedCount')) || 0,
                  ''
                ]);
                return;
              }
              
              // For each attraction, create a separate row
              homestay.features.localAttractions.forEach((attraction, attrIndex) => {
                const { en } = extractBilingualParts(attraction);
                
                // Skip empty attractions
                if (!en || en.trim() === '') return;
                
                normalizedData.push([
                  index + 1, // Keep the same S.N. for all rows of the same homestay
                  getValue(homestay, 'homeStayName') || 'N/A',
                  getValue(homestay, 'dhsrNo') || 'N/A',
                  getValue(homestay, 'homeStayType') === 'community' ? 'Community' : 'Private',
                  getValue(homestay, 'address.formattedAddress.en') || 'N/A',
                  en || 'N/A', // Ensure we always have a value
                  Number(getValue(homestay, 'homeCount')) || 0,
                  Number(getValue(homestay, 'roomCount')) || 0,
                  Number(getValue(homestay, 'bedCount')) || 0,
                  ''
                ]);
              });
            });
            
            // Make sure data rows are filtered to remove any with empty values
            const filteredData = normalizedData.filter(row => 
              row[1] !== 'N/A' && 
              row[1] !== '' && 
              row[4] !== 'N/A' && 
              row[4] !== '' && 
              row[5] !== 'N/A' && 
              row[5] !== ''
            );
            
            autoTable(doc, {
              startY: tableStartY,
              head: [normalizedHeaders],
              body: filteredData,
              styles: {
                fontSize: 8,
                cellPadding: 2,
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                halign: 'left',
                valign: 'middle',
                overflow: 'ellipsize',
                cellWidth: 'auto',
                font: 'helvetica'
              },
              columnStyles: {
                0: { cellWidth: 10 },   // S.N.
                1: { cellWidth: 28 },  // Homestay Name
                2: { cellWidth: 20 },  // DHSR No
                3: { cellWidth: 22 },  // Type - increased width
                4: { cellWidth: 70, overflow: 'linebreak' }, // Formatted Address
                5: { cellWidth: 55, overflow: 'linebreak' },  // Local Attraction (increased width)
                6: { cellWidth: 15 },  // Homes
                7: { cellWidth: 15 },  // Rooms
                8: { cellWidth: 12 },   // Beds
                9: { cellWidth: 20 }    // Remarks
              },
              headStyles: {
                fillColor: [220, 220, 220],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center'
              },
              alternateRowStyles: {
                fillColor: [245, 245, 245]
              },
              margin: { top: 60 },
              didDrawPage: function(pageData) {
                // Add header to continuation pages
                if (pageData.pageNumber > 1) {
                  // Add branding first
                  doc.setFontSize(12);
                  doc.setFont('helvetica', 'bold');
                  doc.text(`${branding.brandName || 'Department of Tourism'}`, centerX, 15, { align: 'center' });
                  
                  // Add logo to continuation pages - use a synchronous approach
                  if (branding.logoPath) {
                    try {
                      // Create a temporary image element to get dimensions
                      const tmpImg = document.createElement('img');
                      tmpImg.src = getImageUrl(branding.logoPath);
                      
                      // Default dimensions if image not loaded yet
                      const imgWidth = 20;
                      const imgHeight = 20;
                      
                      // Add the image directly without waiting for onload
                      doc.addImage(
                        getImageUrl(branding.logoPath), 
                        'JPEG', 
                        centerX - 55, 
                        5, 
                        imgWidth, 
                        imgHeight
                      );
                    } catch (error) {
                      console.error('Error adding logo to continuation page:', error);
                    }
                  }
                  
                  // Add contact information on continuation pages
                  doc.setFontSize(8);
                  doc.setFont('helvetica', 'normal');
                  let contPageContactY = 20;
                  
                  if (branding.contactInfo?.address) {
                    doc.text(`${branding.contactInfo.address}`, centerX, contPageContactY, { align: 'center' });
                    contPageContactY += 4;
                  }
                  
                  if (branding.contactInfo?.email || branding.contactInfo?.phone) {
                    let contactText = '';
                    if (branding.contactInfo?.email) {
                      contactText += branding.contactInfo.email;
                    }
                    if (branding.contactInfo?.email && branding.contactInfo?.phone) {
                      contactText += ' | ';
                    }
                    if (branding.contactInfo?.phone) {
                      contactText += branding.contactInfo.phone;
                    }
                    doc.text(contactText, centerX, contPageContactY, { align: 'center' });
                    contPageContactY += 4;
                  }
                  
                  doc.setFontSize(10);
                  doc.text('Government of Nepal', centerX, contPageContactY + 2, { align: 'center' });
                  doc.text('Homestay Management System', centerX, contPageContactY + 7, { align: 'center' });
                  
                  doc.setFont('helvetica', 'bold');
                  doc.text(`Tourism Attractions Report - Continued`, centerX, contPageContactY + 12, { align: 'center' });
                  doc.setDrawColor(0);
                  doc.setLineWidth(0.5);
                  doc.line(20, contPageContactY + 15, pageWidth - 20, contPageContactY + 15);
                }
                
                // Move page numbers to bottom left corner
                doc.setFontSize(8);
                doc.text(`Page ${doc.getNumberOfPages()}`, 20, doc.internal.pageSize.getHeight() - 10);
              }
            });
          } else if (type === 'infrastructure') {
            // For infrastructure report, normalize the data with one infrastructure item per row
            const normalizedData: Array<(string | number)[]> = [];
            const normalizedHeaders = ['S.N.', 'Homestay Name', 'DHSR No', 'Type', 'Formatted Address', 'Infrastructure Item', 'Homes', 'Rooms', 'Beds', 'Remarks'];
            
            dataToExport.forEach((homestay, index) => {
              // Only process homestays with complete essential data
              if (!getValue(homestay, 'homeStayName') || !getValue(homestay, 'address.formattedAddress.en')) {
                return; // Skip this homestay if it's missing essential data
              }
              
              // If no infrastructure items, add one row with "None"
              if (!homestay.features?.infrastructure || homestay.features.infrastructure.length === 0) {
                normalizedData.push([
                  index + 1,
                  getValue(homestay, 'homeStayName') || 'N/A',
                  getValue(homestay, 'dhsrNo') || 'N/A',
                  getValue(homestay, 'homeStayType') === 'community' ? 'Community' : 'Private',
                  getValue(homestay, 'address.formattedAddress.en') || 'N/A',
                  'None',
                  Number(getValue(homestay, 'homeCount')) || 0,
                  Number(getValue(homestay, 'roomCount')) || 0,
                  Number(getValue(homestay, 'bedCount')) || 0,
                  ''
                ]);
                return;
              }
              
              // For each infrastructure item, create a separate row
              homestay.features.infrastructure.forEach((infrastructure, infraIndex) => {
                // Handle bilingual infrastructure items (English/Nepali format)
                const parts = infrastructure.split('/');
                const infraEn = parts[0]?.trim() || infrastructure;
                
                // Skip empty infrastructure
                if (!infraEn || infraEn.trim() === '') return;
                
                normalizedData.push([
                  index + 1, // Keep the same S.N. for all rows of the same homestay
                  getValue(homestay, 'homeStayName') || 'N/A',
                  getValue(homestay, 'dhsrNo') || 'N/A',
                  getValue(homestay, 'homeStayType') === 'community' ? 'Community' : 'Private',
                  getValue(homestay, 'address.formattedAddress.en') || 'N/A',
                  infraEn || 'N/A', // English part of infrastructure name
                  Number(getValue(homestay, 'homeCount')) || 0,
                  Number(getValue(homestay, 'roomCount')) || 0,
                  Number(getValue(homestay, 'bedCount')) || 0,
                  ''
                ]);
              });
            });
            
            // Make sure data rows are filtered to remove any with empty values
            const filteredData = normalizedData.filter(row => 
              row[1] !== 'N/A' && 
              row[1] !== '' && 
              row[4] !== 'N/A' && 
              row[4] !== '' && 
              row[5] !== 'N/A' && 
              row[5] !== ''
            );
            
            autoTable(doc, {
              startY: tableStartY,
              head: [normalizedHeaders],
              body: filteredData,
              styles: {
                fontSize: 8,
                cellPadding: 2,
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                halign: 'left',
                valign: 'middle',
                overflow: 'ellipsize',
                cellWidth: 'auto',
                font: 'helvetica'
              },
              columnStyles: {
                0: { cellWidth: 10 },   // S.N.
                1: { cellWidth: 28 },  // Homestay Name
                2: { cellWidth: 20 },  // DHSR No
                3: { cellWidth: 22 },  // Type
                4: { cellWidth: 70, overflow: 'linebreak' }, // Formatted Address
                5: { cellWidth: 65, overflow: 'linebreak' },  // Infrastructure Item - reduced from 95 to 65
                6: { cellWidth: 15 },  // Homes
                7: { cellWidth: 15 },  // Rooms
                8: { cellWidth: 12 },   // Beds
                9: { cellWidth: 20 }    // Remarks
              },
              headStyles: {
                fillColor: [220, 220, 220],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center'
              },
              alternateRowStyles: {
                fillColor: [245, 245, 245]
              },
              margin: { top: 60 },
              didDrawPage: function(pageData) {
                // Add header to continuation pages
                if (pageData.pageNumber > 1) {
                  // Add branding first
                  doc.setFontSize(12);
                  doc.setFont('helvetica', 'bold');
                  doc.text(`${branding.brandName || 'Department of Tourism'}`, centerX, 15, { align: 'center' });
                  
                  // Add logo to continuation pages - use a synchronous approach
                  if (branding.logoPath) {
                    try {
                      // Create a temporary image element to get dimensions
                      const tmpImg = document.createElement('img');
                      tmpImg.src = getImageUrl(branding.logoPath);
                      
                      // Default dimensions if image not loaded yet
                      const imgWidth = 20;
                      const imgHeight = 20;
                      
                      // Add the image directly without waiting for onload
                      doc.addImage(
                        getImageUrl(branding.logoPath), 
                        'JPEG', 
                        centerX - 55, 
                        5, 
                        imgWidth, 
                        imgHeight
                      );
                    } catch (error) {
                      console.error('Error adding logo to continuation page:', error);
                    }
                  }
                  
                  // Add contact information on continuation pages
                  doc.setFontSize(8);
                  doc.setFont('helvetica', 'normal');
                  let contPageContactY = 20;
                  
                  if (branding.contactInfo?.address) {
                    doc.text(`${branding.contactInfo.address}`, centerX, contPageContactY, { align: 'center' });
                    contPageContactY += 4;
                  }
                  
                  if (branding.contactInfo?.email || branding.contactInfo?.phone) {
                    let contactText = '';
                    if (branding.contactInfo?.email) {
                      contactText += branding.contactInfo.email;
                    }
                    if (branding.contactInfo?.email && branding.contactInfo?.phone) {
                      contactText += ' | ';
                    }
                    if (branding.contactInfo?.phone) {
                      contactText += branding.contactInfo.phone;
                    }
                    doc.text(contactText, centerX, contPageContactY, { align: 'center' });
                    contPageContactY += 4;
                  }
                  
                  doc.setFontSize(10);
                  doc.text('Government of Nepal', centerX, contPageContactY + 2, { align: 'center' });
                  doc.text('Homestay Management System', centerX, contPageContactY + 7, { align: 'center' });
                  
                  doc.setFont('helvetica', 'bold');
                  doc.text(`Infrastructure Report - Continued`, centerX, contPageContactY + 12, { align: 'center' });
                  doc.setDrawColor(0);
                  doc.setLineWidth(0.5);
                  doc.line(20, contPageContactY + 15, pageWidth - 20, contPageContactY + 15);
                }
                
                // Move page numbers to bottom left corner
                doc.setFontSize(8);
                doc.text(`Page ${doc.getNumberOfPages()}`, 20, doc.internal.pageSize.getHeight() - 10);
              }
            });
          } else if (type === 'homestay-services') {
            // For tourism services, normalize the data with one service per row
            const normalizedData: Array<(string | number)[]> = [];
            const normalizedHeaders = ['S.N.', 'Homestay Name', 'DHSR No', 'Type', 'Formatted Address', 'Tourism Service', 'Homes', 'Rooms', 'Beds', 'Remarks'];
            
            dataToExport.forEach((homestay, index) => {
              // Only process homestays with complete essential data
              if (!getValue(homestay, 'homeStayName') || !getValue(homestay, 'address.formattedAddress.en')) {
                return; // Skip this homestay if it's missing essential data
              }
              
              // If no tourism services, add one row with "None"
              if (!homestay.features?.tourismServices || homestay.features.tourismServices.length === 0) {
                normalizedData.push([
                  index + 1,
                  getValue(homestay, 'homeStayName') || 'N/A',
                  getValue(homestay, 'dhsrNo') || 'N/A',
                  getValue(homestay, 'homeStayType') === 'community' ? 'Community' : 'Private',
                  getValue(homestay, 'address.formattedAddress.en') || 'N/A',
                  'None',
                  Number(getValue(homestay, 'homeCount')) || 0,
                  Number(getValue(homestay, 'roomCount')) || 0,
                  Number(getValue(homestay, 'bedCount')) || 0,
                  ''
                ]);
                return;
              }
              
              // For each tourism service, create a separate row
              homestay.features.tourismServices.forEach((service) => {
                const parts = service.split('/');
                const serviceEn = parts[0].trim();
                
                // Skip empty services
                if (!serviceEn || serviceEn.trim() === '') return;
                
                normalizedData.push([
                  index + 1, // Keep the same S.N. for all rows of the same homestay
                  getValue(homestay, 'homeStayName') || 'N/A',
                  getValue(homestay, 'dhsrNo') || 'N/A',
                  getValue(homestay, 'homeStayType') === 'community' ? 'Community' : 'Private',
                  getValue(homestay, 'address.formattedAddress.en') || 'N/A',
                  serviceEn || 'N/A', // Ensure we always have a value
                  Number(getValue(homestay, 'homeCount')) || 0,
                  Number(getValue(homestay, 'roomCount')) || 0,
                  Number(getValue(homestay, 'bedCount')) || 0,
                  ''
                ]);
              });
            });
            
            // Filter data to remove rows with empty values
            const filteredData = normalizedData.filter(row => 
              row[1] !== 'N/A' && 
              row[1] !== '' && 
              row[4] !== 'N/A' && 
              row[4] !== '' && 
              row[5] !== 'N/A' && 
              row[5] !== ''
            );
            
            autoTable(doc, {
              startY: tableStartY,
              head: [normalizedHeaders],
              body: filteredData,
              styles: {
                fontSize: 8,
                cellPadding: 2,
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                halign: 'left',
                valign: 'middle',
                overflow: 'ellipsize',
                cellWidth: 'auto',
                font: 'helvetica'
              },
              columnStyles: {
                0: { cellWidth: 10 },   // S.N.
                1: { cellWidth: 28 },  // Homestay Name
                2: { cellWidth: 20 },  // DHSR No
                3: { cellWidth: 22 },  // Type
                4: { cellWidth: 70, overflow: 'linebreak' }, // Formatted Address
                5: { cellWidth: 55, overflow: 'linebreak' },  // Tourism Service
                6: { cellWidth: 15 },  // Homes
                7: { cellWidth: 15 },  // Rooms
                8: { cellWidth: 12 },   // Beds
                9: { cellWidth: 20 }    // Remarks
              },
              headStyles: {
                fillColor: [220, 220, 220],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center'
              },
              alternateRowStyles: {
                fillColor: [245, 245, 245]
              },
              margin: { top: 60 },
              didDrawPage: function(pageData) {
                // Add header to continuation pages
                if (pageData.pageNumber > 1) {
                  // Add branding first
                  doc.setFontSize(12);
                  doc.setFont('helvetica', 'bold');
                  doc.text(`${branding.brandName || 'Department of Tourism'}`, centerX, 15, { align: 'center' });
                  
                  // Add logo to continuation pages - use a synchronous approach
                  if (branding.logoPath) {
                    try {
                      // Create a temporary image element to get dimensions
                      const tmpImg = document.createElement('img');
                      tmpImg.src = getImageUrl(branding.logoPath);
                      
                      // Default dimensions if image not loaded yet
                      const imgWidth = 20;
                      const imgHeight = 20;
                      
                      // Add the image directly without waiting for onload
                      doc.addImage(
                        getImageUrl(branding.logoPath), 
                        'JPEG', 
                        centerX - 55, 
                        5, 
                        imgWidth, 
                        imgHeight
                      );
                    } catch (error) {
                      console.error('Error adding logo to continuation page:', error);
                    }
                  }
                  
                  // Add contact information on continuation pages
                  doc.setFontSize(8);
                  doc.setFont('helvetica', 'normal');
                  let contPageContactY = 20;
                  
                  if (branding.contactInfo?.address) {
                    doc.text(`${branding.contactInfo.address}`, centerX, contPageContactY, { align: 'center' });
                    contPageContactY += 4;
                  }
                  
                  if (branding.contactInfo?.email || branding.contactInfo?.phone) {
                    let contactText = '';
                    if (branding.contactInfo?.email) {
                      contactText += branding.contactInfo.email;
                    }
                    if (branding.contactInfo?.email && branding.contactInfo?.phone) {
                      contactText += ' | ';
                    }
                    if (branding.contactInfo?.phone) {
                      contactText += branding.contactInfo.phone;
                    }
                    doc.text(contactText, centerX, contPageContactY, { align: 'center' });
                    contPageContactY += 4;
                  }
                  
                  doc.setFontSize(10);
                  doc.text('Government of Nepal', centerX, contPageContactY + 2, { align: 'center' });
                  doc.text('Homestay Management System', centerX, contPageContactY + 7, { align: 'center' });
                  
                  doc.setFont('helvetica', 'bold');
                  doc.text(`Homestay Services Report - Continued`, centerX, contPageContactY + 12, { align: 'center' });
                  doc.setDrawColor(0);
                  doc.setLineWidth(0.5);
                  doc.line(20, contPageContactY + 15, pageWidth - 20, contPageContactY + 15);
                }
                
                // Move page numbers to bottom left corner
                doc.setFontSize(8);
                doc.text(`Page ${doc.getNumberOfPages()}`, 20, doc.internal.pageSize.getHeight() - 10);
              }
            });
          } else {
            // Original geographical-classification table
            // Filter out any data with missing values
            const filteredData = dataToExport.filter(homestay => 
              getValue(homestay, 'homeStayName') && 
              getValue(homestay, 'address.formattedAddress.en')
            );
            
          autoTable(doc, {
            startY: tableStartY,
            head: [['S.N.', 'Homestay Name', 'DHSR No', 'Type', 'Status', 'Province', 'District', 'Municipality', 'Ward', 'Village', 'Homes', 'Rooms', 'Beds', 'Remarks']],
            body: filteredData.map((homestay, index) => [
              index + 1,
              getValue(homestay, 'homeStayName') || 'N/A',
              getValue(homestay, 'dhsrNo') || 'N/A',
              getValue(homestay, 'homeStayType') === 'community' ? 'Community' : 'Private',
              getValue(homestay, 'status').charAt(0).toUpperCase() + getValue(homestay, 'status').slice(1),
              getValue(homestay, 'address.province.en') || 'N/A',
              getValue(homestay, 'address.district.en') || 'N/A',
              getValue(homestay, 'address.municipality.en') || 'N/A',
              getValue(homestay, 'address.ward') || 'N/A',
              getValue(homestay, 'villageName') || 'N/A',
              Number(getValue(homestay, 'homeCount')) || 0,
              Number(getValue(homestay, 'roomCount')) || 0,
              Number(getValue(homestay, 'bedCount')) || 0,
              ''
            ]),
            styles: {
              fontSize: 8,
              cellPadding: 2,
              lineColor: [0, 0, 0],
              lineWidth: 0.1,
                halign: 'left',
                valign: 'middle',
                overflow: 'ellipsize',
                cellWidth: 'auto'
            },
            headStyles: {
              fillColor: [220, 220, 220],
              textColor: [0, 0, 0],
              fontStyle: 'bold',
                halign: 'center'
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245]
            },
            margin: { top: 60 },
            didDrawPage: function(pageData) {
              // Add header to continuation pages
              if (pageData.pageNumber > 1) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`${branding.brandName || 'Department of Tourism'}`, centerX, 15, { align: 'center' });
                
                // Add logo to continuation pages - use a synchronous approach
                if (branding.logoPath) {
                  try {
                    // Create a temporary image element to get dimensions
                    const tmpImg = document.createElement('img');
                    tmpImg.src = getImageUrl(branding.logoPath);
                    
                    // Default dimensions if image not loaded yet
                    const imgWidth = 20;
                    const imgHeight = 20;
                    
                    // Add the image directly without waiting for onload
                    doc.addImage(
                      getImageUrl(branding.logoPath), 
                      'JPEG', 
                      centerX - 55, 
                      5, 
                      imgWidth, 
                      imgHeight
                    );
                  } catch (error) {
                    console.error('Error adding logo to continuation page:', error);
                  }
                }
                
                // Add contact information on continuation pages
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                let contPageContactY = 20;
                
                if (branding.contactInfo?.address) {
                  doc.text(`${branding.contactInfo.address}`, centerX, contPageContactY, { align: 'center' });
                  contPageContactY += 4;
                }
                
                if (branding.contactInfo?.email || branding.contactInfo?.phone) {
                  let contactText = '';
                  if (branding.contactInfo?.email) {
                    contactText += branding.contactInfo.email;
                  }
                  if (branding.contactInfo?.email && branding.contactInfo?.phone) {
                    contactText += ' | ';
                  }
                  if (branding.contactInfo?.phone) {
                    contactText += branding.contactInfo.phone;
                  }
                  doc.text(contactText, centerX, contPageContactY, { align: 'center' });
                  contPageContactY += 4;
                }
                
                doc.setFontSize(10);
                doc.text('Government of Nepal', centerX, contPageContactY + 2, { align: 'center' });
                doc.text('Homestay Management System', centerX, contPageContactY + 7, { align: 'center' });
                
                doc.setFont('helvetica', 'bold');
                doc.text(`Geographical Classification Report - Continued`, centerX, contPageContactY + 12, { align: 'center' });
                doc.setDrawColor(0);
                doc.setLineWidth(0.5);
                doc.line(20, contPageContactY + 15, pageWidth - 20, contPageContactY + 15);
              }
              
              // Move page numbers to bottom left corner
              doc.setFontSize(8);
              doc.text(`Page ${doc.getNumberOfPages()}`, 20, doc.internal.pageSize.getHeight() - 10);
            }
          });
          }
          
          // Add footer with signature
          const lastPage = doc.getNumberOfPages();
          doc.setPage(lastPage);
          
          const pageHeight = doc.internal.pageSize.getHeight();
          // Increase vertical space for signature area - moved up higher on the page
          const footerY = pageHeight - 50;  
          doc.setFontSize(10);
          
          // Center align the signature properly with more space
          doc.text('Authorized Signature', pageWidth - 50, footerY, { align: 'center' });
          doc.line(pageWidth - 90, footerY + 15, pageWidth - 10, footerY + 15);
          doc.text('Tourism Officer', pageWidth - 50, footerY + 25, { align: 'center' });
          
          // Save the PDF with appropriate name based on report type
          const reportTypeName = type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_');
          doc.save(`Homestay_${reportTypeName}_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
        }
      }
      
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      alert(`Failed to export as ${format}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  // Render the appropriate table header with sort indicators
  const renderColumnHeader = (label: string, key: string) => {
    return (
      <th 
        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
        onClick={() => requestSort(key)}
      >
        <div className="flex items-center space-x-1">
          <span>{label}</span>
          {sortConfig && sortConfig.key === key ? (
            <ArrowUpDown className="h-4 w-4" />
          ) : null}
        </div>
      </th>
    );
  };
  
  // Helper function to format infrastructure for display
  const formatInfrastructure = (infrastructure: string[] | undefined) => {
    if (!infrastructure || infrastructure.length === 0) return 'None';
    
    // Get the English parts of each infrastructure item
    const items = infrastructure.map(item => {
      const parts = item.split('/');
      return parts[0].trim(); // Return the English part
    });
    
    if (items.length <= 2) {
      return items.join(', ');
    }
    
    return `${items.length} items (${items[0]}, ${items[1]}, ...)`;
  };
  
  // Helper function to format tourism services for display
  const formatServices = (services: string[] | undefined) => {
    if (!services || services.length === 0) return 'None';
    
    // Get the English parts of each service
    const items = services.map(item => {
      const parts = item.split('/');
      return parts[0].trim(); // Return the English part
    });
    
    if (items.length <= 2) {
      return items.join(', ');
    }
    
    return `${items.length} services (${items[0]}, ${items[1]}, ...)`;
  };
  
  // Helper function to get the most common infrastructure item
  const getMostCommonInfrastructure = (homestays: Homestay[]) => {
    const counts: Record<string, number> = {};
    
    // Count each infrastructure item
    homestays.forEach(homestay => {
      if (homestay.features?.infrastructure) {
        homestay.features.infrastructure.forEach(item => {
          const parts = item.split('/');
          const infraEn = parts[0].trim();
          counts[infraEn] = (counts[infraEn] || 0) + 1;
        });
      }
    });
    
    // Find the item with the highest count
    let maxCount = 0;
    let mostCommon = 'None';
    
    Object.entries(counts).forEach(([item, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    });
    
    return mostCommon === 'None' ? 'None found' : mostCommon;
  };
  
  // Helper function to get the most common tourism service
  const getMostCommonService = (homestays: Homestay[]) => {
    const counts: Record<string, number> = {};
    
    // Count each tourism service
    homestays.forEach(homestay => {
      if (homestay.features?.tourismServices) {
        homestay.features.tourismServices.forEach(service => {
          const parts = service.split('/');
          const serviceEn = parts[0].trim();
          counts[serviceEn] = (counts[serviceEn] || 0) + 1;
        });
      }
    });
    
    // Find the service with the highest count
    let maxCount = 0;
    let mostCommon = 'None';
    
    Object.entries(counts).forEach(([service, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = service;
      }
    });
    
    return mostCommon === 'None' ? 'None found' : mostCommon;
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Navigation and export controls - hidden during print */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button 
          onClick={goBack}
          className="flex items-center text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="ml-1">Back</span>
        </button>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => handleExport('pdf')}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={loading || homestays.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            <span>PDF</span>
          </button>
          <button 
            onClick={() => handleExport('excel')}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            disabled={loading || homestays.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            <span>Excel</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 print:shadow-none print:p-0">
        {/* Official Government-Style Header with Branding */}
        <div className="border-b pb-6 mb-6 print:pb-4">
          {/* Top Header Row - Centered Logo and Organization Name */}
          <div className="flex justify-center items-center mb-4">
            {branding.logoPath ? (
              <div className="relative h-20 w-20 mr-4">
                <Image
                  src={getImageUrl(branding.logoPath)}
                  alt={branding.brandName}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="h-20 w-20 bg-primary rounded-full flex items-center justify-center text-white font-bold text-2xl mr-4">
                {branding.brandName?.charAt(0) || username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">{branding.brandName || 'Department of Tourism'}</h2>
              <p className="text-md text-gray-700">Government of Nepal</p>
              <p className="text-sm text-gray-600">Homestay Management System</p>
            </div>
          </div>
          
          {/* Contact Information Row */}
          <div className="flex justify-center items-center text-sm text-gray-600 mt-2">
            <div className="flex flex-wrap justify-center gap-4">
              {branding.contactInfo?.address && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                  <span>{branding.contactInfo.address}</span>
                </div>
              )}
              {branding.contactInfo?.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1 text-gray-500" />
                  <span>{branding.contactInfo.email}</span>
                </div>
              )}
              {branding.contactInfo?.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1 text-gray-500" />
                  <span>{branding.contactInfo.phone}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Document Identification */}
          <div className="flex justify-between items-center mt-4 text-sm">
            <div>
              <p>Ref. No: HMS/{new Date().getFullYear()}/{Math.floor(Math.random() * 1000)}</p>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-gray-500" />
              <span>Date: {currentDate}</span>
            </div>
          </div>
        </div>
        
        {/* Report Title Section - Government Style */}
        <div className="text-center mb-8 border-b pb-6">
          <div className="inline-block border-2 border-gray-800 px-6 py-2 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 uppercase">{title}</h1>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto">{description}</p>
        </div>
        
        {/* Filters Section - Only show for geographical classification */}
        {type === 'geographical-classification' && (
          <div className="mb-8 border p-4 rounded-lg print:hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Filter Homestays</h2>
              <button 
                onClick={resetFilters}
                className="text-sm text-primary hover:underline flex items-center"
              >
                <Filter className="h-4 w-4 mr-1" />
                Reset Filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Province Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                <select
                  value={filters.province || ''}
                  onChange={(e) => handleFilterChange('province', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                >
                  <option value="">All Provinces</option>
                  {provinces.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>
              
              {/* District Filter - Only show if province is selected */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <select
                  value={filters.district || ''}
                  onChange={(e) => handleFilterChange('district', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                  disabled={!filters.province}
                >
                  <option value="">All Districts</option>
                  {districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              
              {/* Municipality Filter - Only show if district is selected */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
                <select
                  value={filters.municipality || ''}
                  onChange={(e) => handleFilterChange('municipality', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                  disabled={!filters.district}
                >
                  <option value="">All Municipalities</option>
                  {municipalities.map(municipality => (
                    <option key={municipality} value={municipality}>{municipality}</option>
                  ))}
                </select>
              </div>
              
              {/* Homestay Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Homestay Type</label>
                <select
                  value={filters.homestayType || ''}
                  onChange={(e) => handleFilterChange('homestayType', e.target.value as any)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                >
                  <option value="">All Types</option>
                  <option value="community">Community</option>
                  <option value="private">Private</option>
                </select>
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value as any)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                >
                  <option value="">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {type === 'geographical-classification' && (
              <>
                {/* Data Table */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100 text-gray-700 text-xs font-medium border-b">
                      <tr>
                        <th className="px-4 py-3 text-left w-12">S.N.</th>
                        {renderColumnHeader('Homestay Name', 'homeStayName')}
                        {renderColumnHeader('DHSR No', 'dhsrNo')}
                        {renderColumnHeader('Type', 'homeStayType')}
                        {renderColumnHeader('Status', 'status')}
                        {renderColumnHeader('Province', 'address.province.en')}
                        {renderColumnHeader('District', 'address.district.en')}
                        {renderColumnHeader('Municipality', 'address.municipality.en')}
                        {renderColumnHeader('Village', 'villageName')}
                        {renderColumnHeader('Homes', 'homeCount')}
                        {renderColumnHeader('Rooms', 'roomCount')}
                        {renderColumnHeader('Beds', 'bedCount')}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedHomestays.length > 0 ? (
                        sortedHomestays.map((homestay, index) => (
                          <tr 
                            key={homestay._id} 
                            className="text-xs hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 text-gray-900">{getValue(homestay, 'homeStayName') || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-900">{getValue(homestay, 'dhsrNo') || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-900">
                              {getValue(homestay, 'homeStayType') === 'community' ? 'Community' : 'Private'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                getValue(homestay, 'status') === 'approved' ? 'bg-green-100 text-green-800' :
                                getValue(homestay, 'status') === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {getValue(homestay, 'status')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-900">{getValue(homestay, 'address.province.en') || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-900">{getValue(homestay, 'address.district.en') || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-900">{getValue(homestay, 'address.municipality.en') || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-900">{getValue(homestay, 'villageName') || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-900">{Number(getValue(homestay, 'homeCount')) || 0}</td>
                            <td className="px-4 py-3 text-gray-900">{Number(getValue(homestay, 'roomCount')) || 0}</td>
                            <td className="px-4 py-3 text-gray-900">{Number(getValue(homestay, 'bedCount')) || 0}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={12} className="px-4 py-6 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center py-8">
                              <BarChart2 className="h-10 w-10 text-gray-300 mb-3" />
                              <h3 className="text-sm font-semibold text-gray-600 mb-1">No homestays found</h3>
                              <p className="text-xs text-gray-500">Try changing your filters or try again later</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary Section */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">By Province</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {homestays.length} homestays in {homestays.filter((h: Homestay) => h.address?.province?.en).length > 0 ? 
                        new Set(homestays.filter((h: Homestay) => h.address?.province?.en).map((h: Homestay) => h.address?.province?.en)).size : 0} provinces
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">By District</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {homestays.length} homestays in {homestays.filter((h: Homestay) => h.address?.district?.en).length > 0 ? 
                        new Set(homestays.filter((h: Homestay) => h.address?.district?.en).map((h: Homestay) => h.address?.district?.en)).size : 0} districts
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">By Municipality</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {homestays.length} homestays in {homestays.filter((h: Homestay) => h.address?.municipality?.en).length > 0 ?
                        new Set(homestays.filter((h: Homestay) => h.address?.municipality?.en).map((h: Homestay) => h.address?.municipality?.en)).size : 0} municipalities
                    </p>
                  </div>
                </div>
              </>
            )}
            
            {type === 'service-ratings' && (
              <div className="border rounded-lg p-5">
                <h2 className="text-lg font-medium mb-4">Service Ratings & Feedback Analysis</h2>
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">Rating visualization will appear here</p>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Average Ratings</p>
                    <p className="text-sm text-gray-500 mt-2">Average rating across all homestays</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Feedback Themes</p>
                    <p className="text-sm text-gray-500 mt-2">Common themes from customer feedback</p>
                  </div>
                </div>
              </div>
            )}
            
            {type === 'tourism-attractions' && (
              <>
                {/* Filters Section */}
                <div className="mb-8 border p-4 rounded-lg print:hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Filter Homestays</h2>
                    <button 
                      onClick={resetFilters}
                      className="text-sm text-primary hover:underline flex items-center"
                    >
                      <Filter className="h-4 w-4 mr-1" />
                      Reset Filters
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {/* Province Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                      <select
                        value={filters.province || ''}
                        onChange={(e) => handleFilterChange('province', e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                      >
                        <option value="">All Provinces</option>
                        {provinces.map(province => (
                          <option key={province} value={province}>{province}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* District Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                      <select
                        value={filters.district || ''}
                        onChange={(e) => handleFilterChange('district', e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                        disabled={!filters.province}
                      >
                        <option value="">All Districts</option>
                        {districts.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Municipality Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
                      <select
                        value={filters.municipality || ''}
                        onChange={(e) => handleFilterChange('municipality', e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                        disabled={!filters.district}
                      >
                        <option value="">All Municipalities</option>
                        {municipalities.map(municipality => (
                          <option key={municipality} value={municipality}>{municipality}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Homestay Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Homestay Type</label>
                      <select
                        value={filters.homestayType || ''}
                        onChange={(e) => handleFilterChange('homestayType', e.target.value as any)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                      >
                        <option value="">All Types</option>
                        <option value="community">Community</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                    
                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value as any)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                      >
                        <option value="">All Statuses</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Attraction Filters */}
                  <div className="border-t pt-4">
                    <h3 className="text-md font-medium mb-3">Filter by Attractions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                      {attractionsCategories.flatMap((category: { options: any[]; }) => category.options)
                        .map((option: { value?: string | number | readonly string[] }) => {
                          // Ensure option.value is treated as a string, default to empty string if undefined/null
                          const optionValueStr = String(option.value ?? '');
                          const optionLabel = optionValueStr.split('/')[0] || optionValueStr; // Use full value if no slash

                          return (
                            <div key={optionValueStr} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`attraction-filter-${optionValueStr}`}
                                value={optionValueStr}
                                checked={filters.selectedAttractions?.includes(optionValueStr) || false}
                                onChange={(e) => handleFilterChange('selectedAttractions', e.target.value, e)}
                                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                              />
                              <label
                                htmlFor={`attraction-filter-${optionValueStr}`}
                                className="ml-2 text-sm text-gray-600 truncate"
                                title={optionLabel} // Tooltip for English name
                              >
                                {optionLabel} {/* Show only English name */}
                              </label>
                            </div>
                          );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Data Table */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100 text-gray-700 text-xs font-medium border-b">
                      <tr>
                        <th className="px-4 py-3 text-left w-12">S.N.</th>
                        {renderColumnHeader('Homestay Name', 'homeStayName')}
                        {renderColumnHeader('DHSR No', 'dhsrNo')}
                        {renderColumnHeader('Type', 'homeStayType')}
                        {renderColumnHeader('Formatted Address', 'address.formattedAddress.en')}
                        {renderColumnHeader('Local Attractions', 'features.localAttractions')}
                        {renderColumnHeader('Homes', 'homeCount')}
                        {renderColumnHeader('Rooms', 'roomCount')}
                        {renderColumnHeader('Beds', 'bedCount')}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedHomestays.length > 0 ? (
                        sortedHomestays.map((homestay, index) => (
                          <tr 
                            key={homestay._id} 
                            className="text-xs hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 text-gray-900">{getValue(homestay, 'homeStayName') || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-900">{getValue(homestay, 'dhsrNo') || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-900">
                              {getValue(homestay, 'homeStayType') === 'community' ? 'Community' : 'Private'}
                            </td>
                            <td className="px-4 py-3 text-gray-900">{getValue(homestay, 'address.formattedAddress.en') || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-900">
                              {formatAttractions(homestay.features?.localAttractions)}
                            </td>
                            <td className="px-4 py-3 text-gray-900">{Number(getValue(homestay, 'homeCount')) || 0}</td>
                            <td className="px-4 py-3 text-gray-900">{Number(getValue(homestay, 'roomCount')) || 0}</td>
                            <td className="px-4 py-3 text-gray-900">{Number(getValue(homestay, 'bedCount')) || 0}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center py-8">
                              <BarChart2 className="h-10 w-10 text-gray-300 mb-3" />
                              <h3 className="text-sm font-semibold text-gray-600 mb-1">No homestays found</h3>
                              <p className="text-xs text-gray-500">Try changing your filters or try again later</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary Section */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Popular Attractions</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {homestays.reduce((count, h) => count + (h.features?.localAttractions?.length || 0), 0)} attractions across {homestays.length} homestays
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Cultural Sites</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {homestays.reduce((count, h) => {
                        return count + (h.features?.localAttractions?.filter(a => a.startsWith('cultural:') || a.includes('Museum') || a.includes('संग्रहालय')).length || 0);
                      }, 0)} cultural sites listed
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Natural Attractions</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {homestays.reduce((count, h) => {
                        return count + (h.features?.localAttractions?.filter(a => a.startsWith('natural:') || a.includes('Park') || a.includes('River') || a.includes('नदी')).length || 0);
                      }, 0)} natural attractions
                    </p>
                  </div>
                </div>
              </>
            )}
            
            {type === 'infrastructure' && (
              <>
                {/* Filters Section */}
                <div className="mb-8 border p-4 rounded-lg print:hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Filter Homestays</h2>
                    <button 
                      onClick={resetFilters}
                      className="text-sm text-primary hover:underline flex items-center"
                    >
                      <Filter className="h-4 w-4 mr-1" />
                      Reset Filters
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {/* Province Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                      <select
                        value={filters.province || ''}
                        onChange={(e) => handleFilterChange('province', e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                      >
                        <option value="">All Provinces</option>
                        {provinces.map(province => (
                          <option key={province} value={province}>{province}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* District Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                      <select
                        value={filters.district || ''}
                        onChange={(e) => handleFilterChange('district', e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                        disabled={!filters.province}
                      >
                        <option value="">All Districts</option>
                        {districts.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Municipality Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
                      <select
                        value={filters.municipality || ''}
                        onChange={(e) => handleFilterChange('municipality', e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                        disabled={!filters.district}
                      >
                        <option value="">All Municipalities</option>
                        {municipalities.map(municipality => (
                          <option key={municipality} value={municipality}>{municipality}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Homestay Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Homestay Type</label>
                      <select
                        value={filters.homestayType || ''}
                        onChange={(e) => handleFilterChange('homestayType', e.target.value as any)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                      >
                        <option value="">All Types</option>
                        <option value="community">Community</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                    
                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value as any)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                      >
                        <option value="">All Statuses</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Infrastructure Filters */}
                  <div className="border-t pt-4">
                    <h3 className="text-md font-medium mb-3">Filter by Infrastructure</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                      {commonInfrastructure.map((item, index) => {
                        // Get English part for the label
                        const parts = item.value.split('/');
                        const labelEN = parts[0] || item.value;

                        return (
                          <div key={index} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`infrastructure-filter-${index}`}
                              value={item.value}
                              checked={filters.selectedInfrastructure?.includes(item.value) || false}
                              onChange={(e) => handleFilterChange('selectedInfrastructure', e.target.value, e)}
                              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <label
                              htmlFor={`infrastructure-filter-${index}`}
                              className="ml-2 text-sm text-gray-600 truncate"
                              title={labelEN}
                            >
                              {labelEN}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Data Table */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100 text-gray-700 text-xs font-medium border-b">
                      <tr>
                        <th className="px-4 py-3 text-left w-12">S.N.</th>
                        {renderColumnHeader('Homestay Name', 'homeStayName')}
                        {renderColumnHeader('DHSR No', 'dhsrNo')}
                        {renderColumnHeader('Type', 'homeStayType')}
                        {renderColumnHeader('Formatted Address', 'address.formattedAddress.en')}
                        {renderColumnHeader('Infrastructure', 'features.infrastructure')}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedHomestays.length > 0 ? (
                        sortedHomestays.map((homestay, index) => (
                          <tr 
                            key={homestay._id} 
                            className="text-xs hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 text-gray-900">{getValue(homestay, 'homeStayName') || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-900">{getValue(homestay, 'dhsrNo') || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-900">
                              {getValue(homestay, 'homeStayType') === 'community' ? 'Community' : 'Private'}
                            </td>
                            <td className="px-4 py-3 text-gray-900">{getValue(homestay, 'address.formattedAddress.en') || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-900">
                              {formatInfrastructure(homestay.features?.infrastructure)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center py-8">
                              <BarChart2 className="h-10 w-10 text-gray-300 mb-3" />
                              <h3 className="text-sm font-semibold text-gray-600 mb-1">No homestays found</h3>
                              <p className="text-xs text-gray-500">Try changing your filters or try again later</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary Section */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Infrastructure Overview</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {homestays.reduce((count, h) => count + (h.features?.infrastructure?.length || 0), 0)} infrastructure items across {homestays.length} homestays
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Common Infrastructure</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Most common: {getMostCommonInfrastructure(homestays)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Infrastructure Types</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Set(homestays.flatMap(h => h.features?.infrastructure || [])).size} unique types
                    </p>
                  </div>
                </div>
              </>
            )}
            
            {type === 'homestay-services' && (
              <>
                {/* Filters Section */}
                <div className="mb-8 border p-4 rounded-lg print:hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Filter Homestays</h2>
                    <button 
                      onClick={resetFilters}
                      className="text-sm text-primary hover:underline flex items-center"
                    >
                      <Filter className="h-4 w-4 mr-1" />
                      Reset Filters
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {/* Province Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                      <select
                        value={filters.province || ''}
                        onChange={(e) => handleFilterChange('province', e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                      >
                        <option value="">All Provinces</option>
                        {provinces.map(province => (
                          <option key={province} value={province}>{province}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* District Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                      <select
                        value={filters.district || ''}
                        onChange={(e) => handleFilterChange('district', e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                        disabled={!filters.province}
                      >
                        <option value="">All Districts</option>
                        {districts.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Municipality Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
                      <select
                        value={filters.municipality || ''}
                        onChange={(e) => handleFilterChange('municipality', e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                        disabled={!filters.district}
                      >
                        <option value="">All Municipalities</option>
                        {municipalities.map(municipality => (
                          <option key={municipality} value={municipality}>{municipality}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Homestay Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Homestay Type</label>
                      <select
                        value={filters.homestayType || ''}
                        onChange={(e) => handleFilterChange('homestayType', e.target.value as any)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                      >
                        <option value="">All Types</option>
                        <option value="community">Community</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                    
                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value as any)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-colors"
                      >
                        <option value="">All Statuses</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Tourism Services Filters */}
                  <div className="border-t pt-4">
                    <h3 className="text-md font-medium mb-3">Filter by Tourism Services</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                      {commonTourismServices.map((item, index) => {
                        // Get English part for the label
                        const parts = item.value.split('/');
                        const labelEN = parts[0] || item.value;

                        return (
                          <div key={index} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`tourism-services-filter-${index}`}
                              value={item.value}
                              checked={filters.selectedServices?.includes(item.value) || false}
                              onChange={(e) => handleFilterChange('selectedServices', e.target.value, e)}
                              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <label
                              htmlFor={`tourism-services-filter-${index}`}
                              className="ml-2 text-sm text-gray-600 truncate"
                              title={labelEN}
                            >
                              {labelEN}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Data Table */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100 text-gray-700 text-xs font-medium border-b">
                      <tr>
                        <th className="px-4 py-3 text-left w-12">S.N.</th>
                        {renderColumnHeader('Homestay Name', 'homeStayName')}
                        {renderColumnHeader('DHSR No', 'dhsrNo')}
                        {renderColumnHeader('Type', 'homeStayType')}
                        {renderColumnHeader('Formatted Address', 'address.formattedAddress.en')}
                        {renderColumnHeader('Tourism Services', 'features.tourismServices')}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedHomestays.length > 0 ? (
                        sortedHomestays.map((homestay, index) => (
                          <tr 
                            key={homestay._id} 
                            className="text-xs hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 text-gray-900">{getValue(homestay, 'homeStayName') || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-900">{getValue(homestay, 'dhsrNo') || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-900">
                              {getValue(homestay, 'homeStayType') === 'community' ? 'Community' : 'Private'}
                            </td>
                            <td className="px-4 py-3 text-gray-900">{getValue(homestay, 'address.formattedAddress.en') || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-900">
                              {formatServices(homestay.features?.tourismServices)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center py-8">
                              <BarChart2 className="h-10 w-10 text-gray-300 mb-3" />
                              <h3 className="text-sm font-semibold text-gray-600 mb-1">No homestays found</h3>
                              <p className="text-xs text-gray-500">Try changing your filters or try again later</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary Section */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Tourism Services Overview</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {homestays.reduce((count, h) => count + (h.features?.tourismServices?.length || 0), 0)} services available across {homestays.length} homestays
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Common Tourism Services</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Most common: {getMostCommonService(homestays)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Tourism Service Types</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Set(homestays.flatMap(h => h.features?.tourismServices || [])).size} unique types
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Official Report Footer */}
        <div className="mt-12 pt-6 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500">
              <p>© {new Date().getFullYear()} {branding.brandName || 'Department of Tourism'}</p>
              <p className="mt-1">Generated on {currentDate}</p>
            </div>
            
            <div className="mt-4 md:mt-0 text-right">
              <p className="text-sm">Authorized Signature</p>
              <div className="h-12 mt-2"></div>
              <p className="text-sm border-t pt-1 border-gray-400">Tourism Officer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 