"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AdminHomestayClient from '../../admin/components/AdminHomestayClient';

interface OfficerHomestayClientProps {
  adminUsername?: string;
  noSidebar?: boolean;
}

export default function OfficerHomestayClient({ 
  adminUsername,
  noSidebar = true
}: OfficerHomestayClientProps) {
  const [loading, setLoading] = useState(true);
  const [officerData, setOfficerData] = useState<{
    username: string;
    parentAdmin: string;
    permissions: Record<string, boolean>;
  } | null>(null);
  const router = useRouter();

  // Verify officer permissions and get their data
  useEffect(() => {
    const verifyOfficer = async () => {
      try {
        const response = await fetch('/api/officer/auth/me');
        
        if (!response.ok) {
          if (adminUsername) {
            router.push(`/officer/${adminUsername}/login`);
          } else {
            router.push('/officer/login');
          }
          return;
        }
        
        const data = await response.json();
        
        if (!data.success || !data.user) {
          toast.error("Authentication failed");
          if (adminUsername) {
            router.push(`/officer/${adminUsername}/login`);
          } else {
            router.push('/officer/login');
          }
          return;
        }
        
        // Get officer data
        const { username, parentAdmin, permissions } = data.user;
        
        // Verify the officer belongs to the specified admin
        if (adminUsername && parentAdmin !== adminUsername) {
          toast.error("You do not have access to this admin's panel");
          router.push(`/officer/${parentAdmin}`);
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
        router.push('/officer/login');
      }
    };
    
    verifyOfficer();
  }, [adminUsername, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If verification passed, reuse the AdminHomestayClient but with the parent admin's username
  // and specify that this is being used by an officer
  return (
    <AdminHomestayClient 
      username={officerData?.parentAdmin} 
      noSidebar={noSidebar}
      isOfficer={true}
      officerData={officerData}
    />
  );
}