"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AdminClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  
  // Extract admin username from the path if it exists
  const pathParts = pathname.split('/').filter(Boolean);
  const isAdminRoute = pathParts[0] === 'admin';
  const potentialAdminUsername = pathParts.length > 1 ? pathParts[1] : null;
  
  // Check if this is a login page (either /admin/login or /admin/{username}/login)
  const isLoginPage = pathname === '/admin/login' || pathname.endsWith('/login');

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
          // If we're in a specific admin route, redirect to that admin's login
          if (isAdminRoute && potentialAdminUsername && !potentialAdminUsername.includes('login')) {
            router.push(`/admin/${potentialAdminUsername}/login`);
          } else {
            router.push('/admin/login');
          }
          return;
        }
        
        // Check for specific permissions
        const userData = await response.json();
        const loggedInUsername = userData.user?.username;
        setAdminUsername(loggedInUsername);
        
        const permissions = userData.user?.permissions || {};
        
        // Check for admin dashboard access permission
        if (!permissions.adminDashboardAccess) {
          toast.error('You do not have permission to access the admin dashboard');
          router.push('/access-denied');
          return;
        }
        
        // Check if trying to access another admin's dashboard (when not a superadmin)
        if (isAdminRoute && potentialAdminUsername && 
            potentialAdminUsername !== loggedInUsername && 
            userData.user?.role !== 'superadmin') {
          toast.error('You do not have permission to access another admin\'s dashboard');
          router.push(`/admin/${loggedInUsername}`);
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
        
        // If we're in a specific admin route, redirect to that admin's login
        if (isAdminRoute && potentialAdminUsername && !potentialAdminUsername.includes('login')) {
          router.push(`/admin/${potentialAdminUsername}/login`);
        } else {
          router.push('/admin/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserPermissions();
  }, [isLoginPage, pathname, router, isAdminRoute, potentialAdminUsername]);

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

  // Render the main content without a sidebar
  return (
    <div className="flex-1">
      {children}
    </div>
  );
} 