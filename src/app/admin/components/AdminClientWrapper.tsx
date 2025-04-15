"use client";

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { toast } from 'sonner';

export default function AdminClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  
  // Don't show sidebar on login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const checkUserPermissions = async () => {
      if (isLoginPage) {
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      try {
        // Check admin authentication and permissions
        const response = await fetch('/api/admin/auth/me');
        
        if (!response.ok) {
          // Not authenticated, redirect to login
          router.push('/admin/login');
          return;
        }
        
        // Check for specific permissions
        const userData = await response.json();
        const permissions = userData.user?.permissions || {};
        
        // Check for admin dashboard access permission
        if (!permissions.adminDashboardAccess) {
          toast.error('You do not have permission to access the admin dashboard');
          router.push('/access-denied');
          return;
        }
        
        // Check for specific page permissions
        if (pathname.includes('/homestays') && pathname.includes('/edit') && !permissions.homestayEdit) {
          toast.error('You do not have permission to edit homestays');
          router.push('/access-denied');
          return;
        }
        
        if (pathname.includes('/homestays') && pathname.includes('/delete') && !permissions.homestayDelete) {
          toast.error('You do not have permission to delete homestays');
          router.push('/access-denied');
          return;
        }
        
        // User is authorized
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error checking user permissions:', error);
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserPermissions();
  }, [isLoginPage, pathname, router]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthorized && !isLoginPage) {
    return null; // Don't render anything while redirecting
  }

  return (
    <>
      {/* Mobile menu button - hidden on login page */}
      {!isLoginPage && (
        <button 
          onClick={toggleSidebar}
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Mobile sidebar overlay - hidden on login page */}
      {!isLoginPage && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar for desktop and mobile - hidden on login page */}
      {!isLoginPage && (
        <aside 
          className={`fixed md:static top-0 left-0 h-full z-40 w-64 flex-shrink-0 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <AdminSidebar />
        </aside>
      )}
      
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </>
  );
} 