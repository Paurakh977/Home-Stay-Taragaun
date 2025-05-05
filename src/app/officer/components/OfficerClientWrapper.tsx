"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function OfficerClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [officerData, setOfficerData] = useState<{
    username: string;
    parentAdmin: string;
  } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  
  // Extract admin username from the path if it exists
  const pathParts = pathname.split('/').filter(Boolean);
  const isOfficerRoute = pathParts[0] === 'officer';
  const potentialAdminUsername = pathParts.length > 1 ? pathParts[1] : null;
  
  // Check if this is a login page (either /officer/login or /officer/{adminUsername}/login)
  const isLoginPage = pathname === '/officer/login' || pathname.endsWith('/login');

  useEffect(() => {
    const checkUserPermissions = async () => {
      if (isLoginPage) {
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      try {
        // Check officer authentication and permissions
        const response = await fetch('/api/officer/auth/me');
        
        if (!response.ok) {
          // Not authenticated, redirect to login
          // If we're in a specific admin's officer route, redirect to that admin's officer login
          if (isOfficerRoute && potentialAdminUsername && !potentialAdminUsername.includes('login')) {
            router.push(`/officer/${potentialAdminUsername}/login`);
          } else {
            router.push('/officer/login');
          }
          return;
        }
        
        // Check for specific permissions
        const userData = await response.json();
        const officerUsername = userData.user?.username;
        const parentAdmin = userData.user?.parentAdmin;
        
        setOfficerData({
          username: officerUsername,
          parentAdmin: parentAdmin
        });
        
        const permissions = userData.user?.permissions || {};
        
        // Check for admin dashboard access permission
        if (!permissions.adminDashboardAccess) {
          toast.error('You do not have permission to access the dashboard');
          router.push('/access-denied');
          return;
        }
        
        // Check if trying to access another admin's officer dashboard
        if (isOfficerRoute && potentialAdminUsername && 
            potentialAdminUsername !== parentAdmin) {
          toast.error('You do not have permission to access this admin\'s dashboard');
          router.push(`/officer/${parentAdmin}`);
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
        console.error('Error checking officer permissions:', error);
        
        // If we're in a specific admin's officer route, redirect to that admin's officer login
        if (isOfficerRoute && potentialAdminUsername && !potentialAdminUsername.includes('login')) {
          router.push(`/officer/${potentialAdminUsername}/login`);
        } else {
          router.push('/officer/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserPermissions();
  }, [isLoginPage, pathname, router, isOfficerRoute, potentialAdminUsername]);

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