"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HomeIcon, Building2Icon, CalendarIcon, MapPinIcon, UserIcon, ClipboardCheckIcon } from 'lucide-react';
import BrandedDashboardHeader from '@/components/dashboard/BrandedDashboardHeader';

interface HomeStay {
  _id: string;
  homeStayName: string;
  villageName: string;
  province: string;
  district: string;
  municipality: string;
  homeStayType: string;
  status: string;
  createdAt: string;
  featureAccess?: {
    dashboard?: boolean;
    profile?: boolean;
    portal?: boolean;
    documents?: boolean;
    imageUpload?: boolean;
    settings?: boolean;
    chat?: boolean;
    updateInfo?: boolean;
  };
}

interface UserInfo {
  homestayId: string;
  homeStayName: string;
  featureAccess?: {
    dashboard?: boolean;
    profile?: boolean;
    portal?: boolean;
    documents?: boolean;
    imageUpload?: boolean;
    settings?: boolean;
    chat?: boolean;
    updateInfo?: boolean;
  };
}

interface DashboardPageProps {
  adminUsername?: string;
}

export default function DashboardPage({ adminUsername }: DashboardPageProps) {
  const [homestays, setHomestays] = useState<HomeStay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalVisits: 0,
    avgRating: 0,
    pendingInquiries: 0
  });
  const router = useRouter();

  // Load user data from localStorage
  useEffect(() => {
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        setUser(userData);
      } else {
        router.push(adminUsername ? `/${adminUsername}/login` : '/login');
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      router.push(adminUsername ? `/${adminUsername}/login` : '/login');
    }
  }, [router, adminUsername]);

  // Fetch homestay data
  useEffect(() => {
    const fetchHomestays = async () => {
      try {
        // Check if user is logged in first
        const userJson = localStorage.getItem('user');
        if (!userJson) {
          router.push(adminUsername ? `/${adminUsername}/login` : '/login');
          return;
        }

        setLoading(true);
        setError(null);
        
        const user = JSON.parse(userJson);
        // Build API URL with adminUsername if available
        const apiUrl = adminUsername 
          ? `/api/homestays?limit=5&adminUsername=${adminUsername}`
          : `/api/homestays?limit=5`;
          
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('user');
            router.push(adminUsername ? `/${adminUsername}/login` : '/login');
            return;
          }
          throw new Error('Failed to fetch homestays');
        }
        
        const data = await response.json();
        setHomestays(data.data?.slice(0, 5) || []); // Only take first 5
        
        // If we have the first homestay data, update the user's feature access from it
        if (data.data && data.data.length > 0 && data.data[0].featureAccess) {
          // Get the first homestay to extract featureAccess
          const firstHomestay = data.data[0];
          // Update the user data with feature access
          const updatedUser = {
            ...user,
            featureAccess: firstHomestay.featureAccess
          };
          setUser(updatedUser);
          // Update in localStorage too
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        // Set mock stats (would come from real API in production)
        setStats({
          totalBookings: 24,
          totalVisits: 145,
          avgRating: 4.7,
          pendingInquiries: 3
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching homestays:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHomestays();
  }, [router, adminUsername]);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      {/* Branded Header */}
      <BrandedDashboardHeader adminUsername={adminUsername} />
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ड्यासबोर्ड</h1>
        <p className="text-gray-600">तपाईंको होमस्टे व्यवस्थापन ड्यासबोर्डमा स्वागत छ</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">कुल बुकिङहरू</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ClipboardCheckIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">कुल भ्रमणहरू</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVisits}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <UserIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">औसत रेटिंग</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgRating}/5</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">पेन्डिङ सोधपुछहरू</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingInquiries}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Homestays */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">हालैका होमस्टेहरू</h2>
        </div>
        <div className="px-6 py-4">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div>
                <p className="text-red-700 font-medium">त्रुटि</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
          {/* Loading state */}
        {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : homestays.length === 0 ? (
            <div className="text-center py-8">
              <Building2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">कुनै होमस्टे फेला परेन</h3>
            <p className="text-gray-600 mb-4">अहिलेसम्म कुनै होमस्टे दर्ता गरिएको छैन।</p>
            <Link href={adminUsername ? `/${adminUsername}/register` : "/register"}>
              <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition">
                होमस्टे दर्ता गर्नुहोस्
              </button>
            </Link>
          </div>
        ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      होमस्टे
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      स्थान
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      स्थिति
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      मिति
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">हेर्नुहोस्</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {homestays.map((homestay) => (
                    <tr key={homestay._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-primary/10 rounded-full">
                            <HomeIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{homestay.homeStayName}</div>
                            <div className="text-sm text-gray-500">{homestay.villageName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{homestay.municipality}</div>
                        <div className="text-sm text-gray-500">{homestay.district}, {homestay.province}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(homestay.status)}`}>
                          {homestay.status && typeof homestay.status === 'string' 
                            ? homestay.status.charAt(0).toUpperCase() + homestay.status.slice(1)
                            : '-' /* Display '-' if status is null/undefined */}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(homestay.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={adminUsername ? `/${adminUsername}/dashboard/homestays/${homestay._id}` : `/dashboard/homestays/${homestay._id}`}>
                          <span className="text-primary hover:text-primary-dark">हेर्नुहोस्</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {homestays.length > 0 && (
            <div className="mt-4 text-right">
              <Link href={adminUsername ? `/${adminUsername}/dashboard/homestays` : "/dashboard/homestays"}>
                <span className="text-primary hover:text-primary-dark text-sm font-medium">
                  सबै होमस्टेहरू हेर्नुहोस् →
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">द्रुत लिङ्कहरू</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href={adminUsername ? `/${adminUsername}/dashboard/profile` : "/dashboard/profile"}>
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <UserIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">प्रोफाइल अपडेट</p>
                    <p className="text-xs text-gray-500">आफ्नो होमस्टे प्रोफाइल व्यवस्थापन गर्नुहोस्</p>
                  </div>
                </div>
              </div>
            </Link>
            
            {user?.featureAccess?.updateInfo && (
              <Link href={adminUsername ? `/${adminUsername}/dashboard/update-info` : "/dashboard/update-info"}>
                <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-md">
                      <Building2Icon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">होमस्टे अपडेट</p>
                      <p className="text-xs text-gray-500">आफ्नो होमस्टेको जानकारी सम्पादन गर्नुहोस्</p>
                    </div>
                  </div>
                </div>
              </Link>
            )}
            
            <Link href={adminUsername ? `/${adminUsername}/dashboard/settings` : "/dashboard/settings"}>
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">खाता सेटिङहरू</p>
                    <p className="text-xs text-gray-500">आफ्नो खाता प्राथमिकताहरू व्यवस्थापन गर्नुहोस्</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}