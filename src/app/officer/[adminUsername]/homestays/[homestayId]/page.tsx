"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AdminHomestayDetailPage from '@/app/admin/homestays/[homestayId]/page';
import { AdminOfficerProvider } from '@/context/AdminOfficerContext';

export default function OfficerHomestayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const homestayId = params.homestayId as string;
  const adminUsername = params.adminUsername as string;

  const [loading, setLoading] = useState(true);
  const [officerData, setOfficerData] = useState<{
    username: string;
    parentAdmin: string;
    permissions: Record<string, boolean>;
  } | null>(null);
  
  // Verify officer authentication and permissions
  useEffect(() => {
    const verifyOfficer = async () => {
      try {
        const response = await fetch('/api/officer/auth/me');
        
        if (!response.ok) {
          toast.error("Authentication failed");
          router.push(`/officer/${adminUsername}/login`);
          return;
        }
        
        const data = await response.json();
        
        if (!data.success || !data.user) {
          toast.error("Unable to verify officer");
          router.push(`/officer/${adminUsername}/login`);
          return;
        }
        
        const { username, parentAdmin, permissions } = data.user;
        
        // Verify the officer belongs to the specified admin
        if (parentAdmin !== adminUsername) {
          toast.error("You do not have permission to access this admin's homestays");
          router.push(`/officer/${parentAdmin}`);
          return;
        }
        
        // Make sure officer has permission to view/edit homestays
        if (!permissions.adminDashboardAccess) {
          toast.error("You don't have permission to access the dashboard");
          router.push('/access-denied');
          return;
        }
        
        // Store officer data
        setOfficerData({
          username,
          parentAdmin,
          permissions
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error verifying officer:", error);
        toast.error("Authentication error");
        router.push(`/officer/${adminUsername}/login`);
      }
    };
    
    verifyOfficer();
  }, [adminUsername, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If verification is successful, render the admin homestay detail page with officer context
  return (
    <AdminOfficerProvider 
      isOfficer={true} 
      officerData={officerData}
      adminUsername={adminUsername}
    >
      <AdminHomestayDetailPage />
    </AdminOfficerProvider>
  );
} 