'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Wrapper component for admin-specific homestay detail page
export default function AdminHomestayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adminUsername = params.adminUsername as string;
  const homestayId = params.homestayId as string;

  useEffect(() => {
    // Check if we have valid parameters
    if (!homestayId || homestayId === 'undefined') {
      console.error('Invalid homestayId parameter:', homestayId);
      // Redirect to the admin's homestays list
      router.push(`/${adminUsername}/homestays`);
      return;
    }

    console.log('AdminHomestayDetailPage - Loading homestay with ID:', homestayId);
    console.log('AdminHomestayDetailPage - Admin context:', adminUsername);
    
    // Direct server-side rendered approach - redirect to the main detail page with query params
    window.location.href = `/homestays/${homestayId}?adminContext=${adminUsername}`;
  }, [homestayId, adminUsername, router]);
  
  // Show loading state while redirecting
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
    </div>
  );
} 