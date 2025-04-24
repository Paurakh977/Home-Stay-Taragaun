"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, BarChart2, Mail, Phone, MapPin, Calendar, Download, FileText, FileSpreadsheet, Search, Filter, ArrowUpDown } from 'lucide-react';
import Image from 'next/image';
import { useBranding } from '@/context/BrandingContext';
import { getImageUrl } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FilterOptions {
  province?: string;
  district?: string;
  municipality?: string;
  homestayType?: 'community' | 'private' | '';
  status?: 'approved' | 'pending' | 'rejected' | '';
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
}

interface ReportPageProps {
  title: string;
  description: string;
  type: 'geographical-classification' | 'service-ratings' | 'tourism-attractions' | 'infrastructure';
  userType: 'admin' | 'officer';
  username: string;
}

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
      if (type !== 'geographical-classification') return;
      
      try {
        setLoading(true);
        
        // Build query string from filters
        const queryParams = new URLSearchParams();
        
        // Add filtering parameters using correct field names
        if (filters.province) {
          queryParams.append('province', filters.province);
        }
        if (filters.district) {
          queryParams.append('district', filters.district);
        }
        if (filters.municipality) {
          queryParams.append('municipality', filters.municipality);
        }
        if (filters.homestayType) {
          queryParams.append('homestayType', filters.homestayType);
        }
        if (filters.status) {
          queryParams.append('status', filters.status);
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
      filters.homestayType, filters.status, username, userType]);
  
  const goBack = () => {
    const basePath = userType === 'admin' ? `/admin/${username}` : `/officer/${username}`;
    router.push(basePath);
  };
  
  const handleFilterChange = (name: keyof FilterOptions, value: string) => {
    // Reset dependent filters when parent filter changes
    if (name === 'province') {
      setFilters({
        ...filters,
        province: value,
        district: '',
        municipality: ''
      });
      // Clear dependent dropdowns
      setDistricts([]);
      setMunicipalities([]);
    } else if (name === 'district') {
      setFilters({
        ...filters,
        district: value,
        municipality: ''
      });
      // Clear dependent dropdown
      setMunicipalities([]);
    } else {
      setFilters({
        ...filters,
        [name]: value
      });
    }
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
        
        // Create data worksheet from json data
        const worksheet = XLSX.utils.json_to_sheet(
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
            'Beds': parseInt(getValue(homestay, 'bedCount')) || 0
          }))
        );
        
        // Set column widths
        const colWidths = [
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
          { wch: 10 }  // Beds
        ];
        worksheet['!cols'] = colWidths;
        
        // Create workbook and add the worksheets
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, brandingWorksheet, 'Report Info');
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Homestays');
        
        // Generate filename with date
        const today = new Date().toISOString().slice(0, 10);
        const filename = `Homestay_Geographical_Report_${today}.xlsx`;
        
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
          
          doc.setFontSize(12);
          doc.text('Government of Nepal', centerX, 46, { align: 'center' });
          doc.text('Homestay Management System', centerX, 52, { align: 'center' });
          
          // Add report title and description
          doc.setFontSize(14);
          doc.text(`Report: ${title}`, centerX, 62, { align: 'center' });
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(description, centerX, 68, { align: 'center' });
          
          // Add date and reference number
          doc.text(`Date: ${currentDate}`, pageWidth - 20, 15, { align: 'right' });
          // Ensure type is treated as string before using substring
          const reportType: string = type.substring(0, 3).toUpperCase();
          const timestamp = Date.now().toString().slice(-6);
          doc.text(`Ref. No: HMS/${reportType}/${new Date().getFullYear()}/${timestamp}`, 20, 15);
          
          // Generate table with data
          autoTable(doc, {
            startY: 80,
            head: [['S.N.', 'Homestay Name', 'DHSR No', 'Type', 'Status', 'Province', 'District', 'Municipality', 'Ward', 'Village', 'Homes', 'Rooms', 'Beds']],
            body: dataToExport.map((homestay, index) => [
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
              Number(getValue(homestay, 'bedCount')) || 0
            ]),
            styles: {
              fontSize: 8,
              cellPadding: 2,
              lineColor: [0, 0, 0],
              lineWidth: 0.1,
              halign: 'left', // Left-align text
              valign: 'middle', // Center vertically
              overflow: 'ellipsize', // Prevent text from wrapping
              cellWidth: 'auto' // Auto cell width
            },
            headStyles: {
              fillColor: [220, 220, 220],
              textColor: [0, 0, 0],
              fontStyle: 'bold',
              halign: 'center' // Center align headers
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245]
            },
            margin: { top: 60 },
            didDrawPage: function(pageData) {
              // Add header to continuation pages
              if (pageData.pageNumber > 1) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`${branding.brandName || 'Department of Tourism'}`, centerX, 15, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.text('Homestay Management System', centerX, 22, { align: 'center' });
                doc.text(`Geographical Classification Report - Continued`, centerX, 27, { align: 'center' });
                doc.setDrawColor(0);
                doc.setLineWidth(0.5);
                doc.line(20, 30, pageWidth - 20, 30);
              }
              
              // Move page numbers to bottom left corner
              doc.setFontSize(8);
              doc.text(`Page ${doc.getNumberOfPages()}`, 20, doc.internal.pageSize.getHeight() - 10);
            }
          });
          
          // Add footer with signature
          const lastPage = doc.getNumberOfPages();
          doc.setPage(lastPage);
          
          const pageHeight = doc.internal.pageSize.getHeight();
          const footerY = pageHeight - 30;
          doc.setFontSize(10);
          
          // Center align the signature properly
          doc.text('Authorized Signature', pageWidth - 50, footerY, { align: 'center' });
          doc.line(pageWidth - 90, footerY + 10, pageWidth - 10, footerY + 10);
          doc.text('Tourism Officer', pageWidth - 50, footerY + 18, { align: 'center' });
          
          // Save the PDF
          doc.save(`Homestay_Geographical_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
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
              <div className="border rounded-lg p-5">
                <h2 className="text-lg font-medium mb-4">Local Tourism Attractions</h2>
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">Tourism attraction map will appear here</p>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Popular Attractions</p>
                    <p className="text-sm text-gray-500 mt-2">Most visited local attractions</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Cultural Sites</p>
                    <p className="text-sm text-gray-500 mt-2">Cultural and historical sites near homestays</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Natural Attractions</p>
                    <p className="text-sm text-gray-500 mt-2">Natural attractions and scenic spots</p>
                  </div>
                </div>
              </div>
            )}
            
            {type === 'infrastructure' && (
              <div className="border rounded-lg p-5">
                <h2 className="text-lg font-medium mb-4">Physical Infrastructure and Amenities</h2>
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">Infrastructure data visualization will appear here</p>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Room Facilities</p>
                    <p className="text-sm text-gray-500 mt-2">Common room facilities across homestays</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Accessibility</p>
                    <p className="text-sm text-gray-500 mt-2">Accessibility features and transportation</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">Amenities</p>
                    <p className="text-sm text-gray-500 mt-2">Available amenities by homestay type</p>
                  </div>
                </div>
              </div>
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