"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Hotel, LogOut, PlusCircle, ListFilter, KeyRound, Users, ChevronDown, ChevronUp, UserPlus, UserCog, BarChart2, MapPin, Star, Map, Home } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useBranding } from '@/context/BrandingContext';
import { getImageUrl } from '@/lib/utils';

const sidebarNavItems = [
  {
    title: "Homestays",
    href: "/admin",
    icon: Hotel,
  },
  {
    title: "Add Homestay",
    href: "register",
    icon: PlusCircle,
  },
  {
    title: "Homestay Listing",
    href: "/admin/homestay-listing",
    icon: ListFilter,
  },
  {
    title: "Change Password",
    href: "/admin/change-password",
    icon: KeyRound,
    hideForSuperadmin: true,
  },
  // Add more admin sections here later if needed
];

// New Officers dropdown items
const officerItems = [
  {
    title: "Create Officer",
    href: "/admin/officer/create",
    icon: UserPlus,
  },
  {
    title: "Manage Officers",
    href: "/admin/officer/list",
    icon: UserCog,
  }
];

// New Reports dropdown items
const reportItems = [
  {
    title: "Geographical Classification",
    href: "/admin/report/geographical-classification",
    icon: MapPin,
  },
  {
    title: "Service Rating & Feedbacks",
    href: "/admin/report/service-ratings",
    icon: Star,
  },
  {
    title: "Local Tourism Attractions",
    href: "/admin/report/tourism-attractions",
    icon: Map,
  },
  {
    title: "Physical Infrastructure",
    href: "/admin/report/infrastructure",
    icon: Home,
  }
];

interface AdminSidebarProps {
  username?: string;
}

export default function AdminSidebar({ username }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const adminUsername = username || searchParams.get('username');
  const branding = useBranding();
  const [officersDropdownOpen, setOfficersDropdownOpen] = useState(false);
  const [reportsDropdownOpen, setReportsDropdownOpen] = useState(false);

  // Check if any officer-related route is active
  const isOfficersActive = officerItems.some(item => {
    const itemHref = adminUsername ? 
      `${item.href}/${adminUsername}` : 
      item.href;
    return pathname === itemHref || pathname.startsWith(itemHref);
  });

  // Check if any report-related route is active
  const isReportsActive = reportItems.some(item => {
    const itemHref = adminUsername ? 
      `${item.href.replace('/admin', `/admin/${adminUsername}`)}` : 
      item.href;
    return pathname === itemHref || pathname.startsWith(itemHref);
  });

  // Automatically open dropdowns if related routes are active
  useEffect(() => {
    if (isOfficersActive) {
      setOfficersDropdownOpen(true);
    }
    
    if (isReportsActive) {
      setReportsDropdownOpen(true);
    }
  }, [isOfficersActive, isReportsActive]);

  // Check if user is a superadmin
  useEffect(() => {
    const checkSuperadmin = async () => {
      try {
        const response = await fetch('/api/superadmin/auth/me');
        setIsSuperadmin(response.ok);
      } catch (error) {
        console.error('Error checking superadmin status:', error);
      }
    };
    
    checkSuperadmin();
  }, []);

  const handleLogout = async () => {
    try {
      // For superadmins, just go back to superadmin dashboard
      if (isSuperadmin) {
        router.push('/superadmin/dashboard');
        return;
      }
      
      // Regular admin logout
      const response = await fetch("/api/admin/auth/logout", {
        method: "POST",
      });
      
      if (response.ok) {
        toast.success("Logged out successfully");
        router.push(adminUsername ? `/admin/${adminUsername}/login` : "/admin/login");
      } else {
        throw new Error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  // Determine base path for links
  const adminBasePath = adminUsername ? `/admin/${adminUsername}` : "/admin";

  // Toggle officers dropdown
  const toggleOfficersDropdown = () => {
    setOfficersDropdownOpen(!officersDropdownOpen);
  };
  
  // Toggle reports dropdown
  const toggleReportsDropdown = () => {
    setReportsDropdownOpen(!reportsDropdownOpen);
  };

  return (
    <aside className="h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <Link href={adminBasePath} className="flex items-center space-x-3">
          {branding.logoPath ? (
            <div className="relative h-8 w-8 rounded-full overflow-hidden">
              <Image
                src={getImageUrl(branding.logoPath)}
                alt={branding.brandName || 'Admin Logo'}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          ) : (
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              {branding.brandName?.charAt(0) || (adminUsername ? adminUsername.charAt(0).toUpperCase() : 'A')}
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900 text-sm">
              {branding.brandName || 'Admin Dashboard'}
            </div>
            {adminUsername && (
              <span className="text-xs text-gray-500">
                {adminUsername}
              </span>
            )}
          </div>
        </Link>
      </div>
      
      <nav className="p-2 flex-1">
        {sidebarNavItems
          .filter(item => !item.hideForSuperadmin || !isSuperadmin)
          .map((item) => {
          // Special case for "Add Homestay" to use the correct path format
          if (item.title === "Add Homestay") {
            const registerHref = adminUsername ? `/${adminUsername}/register` : "/register";
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
            const listingHref = adminUsername ? `/admin/${adminUsername}/homestay-listing` : "/admin/homestay-listing";
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
            const passwordHref = adminUsername ? `/admin/${adminUsername}/change-password` : "/admin/change-password";
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
          const itemHref = adminUsername ? 
            `${item.href}/${adminUsername}` : 
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
                const itemHref = adminUsername ? 
                  `/admin/${adminUsername}${item.href.replace('/admin', '')}` : 
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

        {/* Officers Dropdown Section */}
        <div className="mt-2">
          <button 
            onClick={toggleOfficersDropdown}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm my-1 transition-colors ${
              isOfficersActive
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Officers</span>
            </div>
            {officersDropdownOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          
          {/* Officers dropdown menu */}
          {officersDropdownOpen && (
            <div className="ml-2 pl-2 border-l border-gray-200 mt-1 mb-1 space-y-1">
              {officerItems.map((item) => {
                const itemHref = adminUsername ? 
                  `/admin/${adminUsername}${item.href.replace('/admin', '')}` : 
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
          <span className="font-medium">{isSuperadmin ? "Back to Superadmin" : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
} 