'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/app/dashboard/layout';
import { toast } from 'sonner';

// Wrapper component for admin-specific dashboard layout
export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  
  // Verify dashboard access permission
  useEffect(() => {
    const verifyAccess = async () => {
      try {
        // Get user from localStorage
        const userJson = localStorage.getItem("user");
        if (!userJson) {
          router.push(`/${adminUsername}/login`);
          return;
        }
        
        const user = JSON.parse(userJson);
        
        // Check dashboard permission
        const response = await fetch(`/api/homestays/${user.homestayId}?adminUsername=${adminUsername}`);
        if (!response.ok) {
          toast.error("Failed to verify permissions");
          router.push(`/${adminUsername}`);
          return;
        }
        
        const data = await response.json();
        if (!data.homestay?.featureAccess?.dashboard) {
          toast.error("Access to dashboard is not permitted");
          router.push(`/${adminUsername}`);
          return;
        }
        
        setVerified(true);
      } catch (error) {
        console.error("Error verifying access:", error);
        toast.error("An error occurred while verifying access");
        router.push(`/${adminUsername}`);
      }
    };
    
    verifyAccess();
  }, [adminUsername, router]);
  
  // Don't render children until access is verified
  if (!verified) {
    return null;
  }
  
  // Using the same dashboard layout as the main dashboard
  return <DashboardLayout>{children}</DashboardLayout>;
} 