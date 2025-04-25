"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Hotel, LogOut, PlusCircle, ListFilter, KeyRound, BarChart2, ChevronDown, ChevronUp, MapPin, Star, Map, Home, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useBranding } from '@/context/BrandingContext';
import { getImageUrl } from '@/lib/utils';

// Only include the relevant sections for officers (no officer management)
const sidebarNavItems = [
  {
    title: "Homestays",
    href: "/officer",
    icon: Hotel,
  },
  {
    title: "Add Homestay",
    href: "register",
    icon: PlusCircle,
  },
  {
    title: "Homestay Listing",
    href: "/officer/homestay-listing",
    icon: ListFilter,
  },
  {
    title: "Change Password",
    href: "/officer/change-password",
    icon: KeyRound,
  },
];

// Reports dropdown items
const reportItems = [
  {
    title: "Geographical Classification",
    href: "/officer/report/geographical-classification",
    icon: MapPin,
  },
  {
    title: "Service Rating & Feedbacks",
    href: "/officer/report/service-ratings",
    icon: Star,
  },
  {
    title: "Local Tourism Attractions",
    href: "/officer/report/tourism-attractions",
    icon: Map,
  },
  {
    title: "Physical Infrastructure",
    href: "/officer/report/infrastructure",
    icon: Home,
  },
  {
    title: "Homestay Services",
    href: "/officer/report/homestay-services",
    icon: Users,
  }
];

interface OfficerSidebarProps {
  adminUsername?: string;
  officerUsername?: string;
}

export default function OfficerSidebar({ adminUsername, officerUsername }: OfficerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [officerName, setOfficerName] = useState(officerUsername || '');
  const adminUsernameValue = adminUsername || searchParams.get('adminUsername');
  const branding = useBranding();
  const [reportsDropdownOpen, setReportsDropdownOpen] = useState(false);

  // Check if any report-related route is active
  const isReportsActive = reportItems.some(item => {
    const itemHref = adminUsernameValue ? 
      `${item.href.replace('/officer', `/officer/${adminUsernameValue}`)}` : 
      item.href;
    return pathname === itemHref || pathname.startsWith(itemHref);
  });

  // Automatically open dropdowns if related routes are active
  useEffect(() => {
    if (isReportsActive) {
      setReportsDropdownOpen(true);
    }
  }, [isReportsActive]);

  // Fetch officer data if not provided
  useEffect(() => {
    const fetchOfficerData = async () => {
      if (officerUsername) return; // Skip if already provided
      
      try {
        const response = await fetch('/api/officer/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user?.username) {
            setOfficerName(data.user.username);
          }
        }
      } catch (error) {
        console.error('Error fetching officer data:', error);
      }
    };
    
    fetchOfficerData();
  }, [officerUsername]);

  const handleLogout = async () => {
    try {
      // Try the server-side logout first
      try {
        const response = await fetch("/api/officer/auth/logout", {
          method: "POST",
          // Add headers to help with fetch request
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (response.ok) {
          toast.success("Logged out successfully");
        } else {
          console.warn("Server-side logout returned error:", response.status);
          // Continue with client-side fallback
        }
      } catch (fetchError) {
        console.warn("Server-side logout failed, using client-side fallback:", fetchError);
        // Continue with client-side fallback
      }
      
      // Client-side fallback - clear cookies directly
      document.cookie = "officer_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      // Navigate to login page
      router.push(adminUsernameValue ? `/officer/${adminUsernameValue}/login` : "/officer/login");
      
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
      
      // Last resort fallback - just redirect to login
      setTimeout(() => {
        window.location.href = adminUsernameValue ? 
          `/officer/${adminUsernameValue}/login` : 
          "/officer/login";
      }, 1000);
    }
  };

  // Toggle reports dropdown
  const toggleReportsDropdown = () => {
    setReportsDropdownOpen(!reportsDropdownOpen);
  };

  // Determine base path for links
  const officerBasePath = adminUsernameValue ? `/officer/${adminUsernameValue}` : "/officer";

  return (
    <aside className="h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <Link href={officerBasePath} className="flex items-center space-x-3">
          {branding.logoPath ? (
            <div className="relative h-8 w-8 rounded-full overflow-hidden">
              <Image
                src={getImageUrl(branding.logoPath)}
                alt={branding.brandName || 'Officer Logo'}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          ) : (
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              {branding.brandName?.charAt(0) || (adminUsernameValue ? adminUsernameValue.charAt(0).toUpperCase() : 'O')}
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900 text-sm">
              {branding.brandName || 'Officer Dashboard'}
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">
                {officerName && `Officer: ${officerName}`}
              </span>
              {adminUsernameValue && (
                <span className="text-xs text-gray-400">
                  Admin: {adminUsernameValue}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
      
      <nav className="p-2 flex-1">
        {sidebarNavItems.map((item) => {
          // Special case for "Add Homestay" to use the correct path format
          if (item.title === "Add Homestay") {
            const registerHref = adminUsernameValue ? `/${adminUsernameValue}/register` : "/register";
            const isActive = pathname === registerHref || pathname.startsWith(registerHref);
            
            return (
              <Link
                key={item.href}
                href={registerHref}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm my-1 transition-colors ${
                  isActive
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          }

          // Special case for "Homestay Listing"
          if (item.title === "Homestay Listing") {
            const listingHref = adminUsernameValue ? `/officer/${adminUsernameValue}/homestay-listing` : "/officer/homestay-listing";
            const isActive = pathname === listingHref || pathname.startsWith(listingHref);
            
            return (
              <Link
                key={item.href}
                href={listingHref}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm my-1 transition-colors ${
                  isActive
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          }

          // Special case for "Change Password"
          if (item.title === "Change Password") {
            const passwordHref = adminUsernameValue ? `/officer/${adminUsernameValue}/change-password` : "/officer/change-password";
            const isActive = pathname === passwordHref || pathname.startsWith(passwordHref);
            
            return (
              <Link
                key={item.href}
                href={passwordHref}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm my-1 transition-colors ${
                  isActive
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          }
          
          // Regular items use standard format
          const itemHref = adminUsernameValue ? 
            `${item.href}/${adminUsernameValue}` : 
            item.href;
          
          const isActive = pathname === itemHref || pathname.startsWith(itemHref);
          
          return (
            <Link
              key={item.href}
              href={itemHref}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm my-1 transition-colors ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
        
        {/* Reports Dropdown Section */}
        <div className="mt-2">
          <button 
            onClick={toggleReportsDropdown}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm my-1 transition-colors ${
              isReportsActive
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart2 className="h-4 w-4" />
              <span>Reports</span>
            </div>
            {reportsDropdownOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          
          {/* Reports dropdown menu */}
          {reportsDropdownOpen && (
            <div className="ml-2 pl-2 border-l border-gray-200 mt-1 mb-1 space-y-1">
              {reportItems.map((item) => {
                const itemHref = adminUsernameValue ? 
                  `/officer/${adminUsernameValue}${item.href.replace('/officer', '')}` : 
                  item.href;
                
                const isActive = pathname === itemHref || pathname.startsWith(itemHref);
                
                return (
                  <Link
                    key={item.title}
                    href={itemHref}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-gray-100 text-gray-900 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
      
      {/* Logout button */}
      <div className="p-4 mt-auto border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center space-x-2 px-4 py-3 rounded-md text-sm w-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
} 