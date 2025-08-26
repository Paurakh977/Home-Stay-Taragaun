"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarIcon, MapPinIcon, UserIcon, ClipboardCheckIcon, BookOpenIcon, Building2Icon } from 'lucide-react';
import BrandedDashboardHeader from '@/components/dashboard/BrandedDashboardHeader';
import { BookingNotificationProvider } from '@/context/BookingNotificationContext';
import BookingNotifications from '@/components/booking/BookingNotifications';
import BookingManagement from '@/components/dashboard/BookingManagement';
import { useAuthToken } from '@/hooks/useAuthToken';



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
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalVisits: 0,
    avgRating: 0,
    pendingInquiries: 0
  });
  const router = useRouter();
  const authData = useAuthToken();

  // Load user data based on authentication
  useEffect(() => {
    const loadUserData = async () => {
      console.log('Dashboard - Auth data:', authData);

      if (!authData) {
        console.log('Dashboard - No auth data, still loading...');
        return;
      }

      if (authData.tokenType === 'jwt') {
        // For homestay users, fetch the homestay data
        try {
          console.log('Dashboard - Fetching homestay data for:', authData.userId);
          const response = await fetch(`/api/homestays/${authData.userId}`);
          if (response.ok) {
            const homestayData = await response.json();
            console.log('Dashboard - Homestay data received:', homestayData);

            if (homestayData.homestay) {
              setUser({
                homestayId: homestayData.homestay.homestayId,
                homeStayName: homestayData.homestay.homeStayName,
                featureAccess: homestayData.homestay.featureAccess
              });
              setLoading(false);
              return;
            }
          }
          console.error('Dashboard - Failed to fetch homestay data');
        } catch (error) {
          console.error('Dashboard - Error fetching homestay data:', error);
        }
      }

      // If we get here, authentication failed or user not found
      console.log('Dashboard - Redirecting to login');
      router.push(adminUsername ? `/${adminUsername}/login` : '/login');
      setLoading(false);
    };

    loadUserData();
  }, [authData, router, adminUsername]);

  // Load stats data
  useEffect(() => {
    // Mock stats for now - in a real app, you'd fetch this from an API
    setStats({
      totalBookings: 24,
      totalVisits: 145,
      avgRating: 4.7,
      pendingInquiries: 3
    });
  }, []);


  // Debug logging
  console.log('Dashboard user data:', user);
  console.log('Dashboard userId for notifications:', user?.homestayId);
  console.log('Dashboard auth data:', authData);
  console.log('Dashboard loading state:', loading);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state if no user data
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Unable to load user data. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  return (
    <BookingNotificationProvider
      userId={user.homestayId}
      userType="homestay"
    >
      <div>
        {/* Branded Header */}
        <BrandedDashboardHeader adminUsername={adminUsername} />

        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ड्यासबोर्ड</h1>
              <p className="text-gray-600">तपाईंको होमस्टे व्यवस्थापन ड्यासबोर्डमा स्वागत छ</p>
            </div>
            <BookingNotifications />
          </div>
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
      
      {/* Booking Management */}
      <div className="mb-8">
        {user?.homestayId && (
          <BookingManagement
            homestayId={user.homestayId}
            adminUsername={adminUsername}
          />
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">द्रुत लिङ्कहरू</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href={adminUsername ? `/${adminUsername}/dashboard/bookings` : "/dashboard/bookings"}>
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-md">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">बुकिङ व्यवस्थापन</p>
                    <p className="text-xs text-gray-500">आफ्ना बुकिङहरू र उपलब्धता व्यवस्थापन गर्नुहोस्</p>
                  </div>
                </div>
              </div>
            </Link>

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
    </BookingNotificationProvider>
  );
}