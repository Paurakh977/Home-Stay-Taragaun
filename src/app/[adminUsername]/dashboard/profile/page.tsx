'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProfilePage from '@/app/dashboard/profile/page';
import { toast } from 'sonner';

// Wrapper component for admin-specific profile page
export default function AdminProfilePage() {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  
  // Verify profile access permission
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
        
        // Check profile permission
        const response = await fetch(`/api/homestays/${user.homestayId}?adminUsername=${adminUsername}`);
        if (!response.ok) {
          toast.error("Failed to verify permissions");
          router.push(`/${adminUsername}/dashboard`);
          return;
        }
        
        const data = await response.json();
        if (!data.homestay?.featureAccess?.profile) {
          toast.error("Access to profile is not permitted");
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
  
  // Don't render the profile page until access is verified
  if (!verified) {
    return null;
  }
  
  // Pass the adminUsername to the profile page
  return <ProfilePage adminUsername={adminUsername} />;
} 