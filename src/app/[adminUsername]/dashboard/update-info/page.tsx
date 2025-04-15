'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import UpdateInfoPage from '@/app/dashboard/update-info/page';
import { toast } from 'sonner';

// Wrapper component for admin-specific update info page
export default function AdminUpdateInfoPage() {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  
  // Verify updateInfo access permission
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
        
        // Check updateInfo permission
        const response = await fetch(`/api/homestays/${user.homestayId}?adminUsername=${adminUsername}`);
        if (!response.ok) {
          toast.error("Failed to verify permissions");
          router.push(`/${adminUsername}/dashboard`);
          return;
        }
        
        const data = await response.json();
        if (!data.homestay?.featureAccess?.updateInfo) {
          toast.error("Access to update information is not permitted");
          router.push(`/${adminUsername}/dashboard`);
          return;
        }
        
        setVerified(true);
      } catch (error) {
        console.error("Error verifying access:", error);
        toast.error("An error occurred while verifying access");
        router.push(`/${adminUsername}/dashboard`);
      }
    };
    
    verifyAccess();
  }, [adminUsername, router]);
  
  // Don't render the update info page until access is verified
  if (!verified) {
    return null;
  }
  
  // Pass the adminUsername to the update info page
  return <UpdateInfoPage adminUsername={adminUsername} />;
} 