"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, BarChart2, Mail, Phone, MapPin, Calendar, Download, FileText, FileSpreadsheet } from 'lucide-react';
import Image from 'next/image';
import { useBranding } from '@/context/BrandingContext';
import { getImageUrl } from '@/lib/utils';

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
  const branding = useBranding();
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const goBack = () => {
    const basePath = userType === 'admin' ? `/admin/${username}` : `/officer/${username}`;
    router.push(basePath);
  };

  // For future implementation - will need to convert the report to various formats
  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // This function will be implemented to export the report with all branding elements
    // For PDF - use html-to-pdf conversion that preserves all styling
    // For Excel/CSV - embed logo as image in the file and maintain header structure
    alert(`Export to ${format} functionality will be implemented in the future`);
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
          >
            <FileText className="h-4 w-4 mr-2" />
            <span>PDF</span>
          </button>
          <button 
            onClick={() => handleExport('excel')}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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
        
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {type === 'geographical-classification' && (
              <div className="border rounded-lg p-5">
                <h2 className="text-lg font-medium mb-4">Regional Distribution of Homestays</h2>
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">Geographic visualization will appear here</p>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">By Province</p>
                    <p className="text-sm text-gray-500 mt-2">Distribution of homestays by province</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">By District</p>
                    <p className="text-sm text-gray-500 mt-2">Distribution of homestays by district</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">By Municipality</p>
                    <p className="text-sm text-gray-500 mt-2">Distribution of homestays by municipality</p>
                  </div>
                </div>
              </div>
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