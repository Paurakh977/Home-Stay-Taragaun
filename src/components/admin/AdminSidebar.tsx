"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Hotel, LogOut, PlusCircle } from 'lucide-react';
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
  // Add more admin sections here later if needed
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
        {sidebarNavItems.map((item) => {
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