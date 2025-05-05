'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Loading from '@/components/ui/loading';
import dynamic from 'next/dynamic';

// Dynamically import the main homestay detail page to avoid SSR issues
const AdminHomestayDetailPage = dynamic(
  () => import('@/app/admin/homestays/[homestayId]/page'),
  { 
    loading: () => <Loading />,
    ssr: false 
  }
);

export default function AdminHomestayByUsernameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adminUsername = params.adminUsername as string;
  const homestayId = params.homestayId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  
  // Verify permissions on component mount
  useEffect(() => {
    console.log(`Checking permissions for admin: ${adminUsername}, homestay: ${homestayId}`);
    
    const verifyAccess = async () => {
      try {
        setLoading(true);
        
        // First, check if the current user is authenticated as the correct admin
        console.log("Fetching admin auth data...");
        const authResponse = await fetch('/api/admin/auth/me');
        if (!authResponse.ok) {
          console.error("Auth response not OK:", authResponse.status);
          toast.error("Authentication failed. Please log in again.");
          router.push('/admin/login');
          return;
        }
        
        const authData = await authResponse.json();
        console.log("Auth data received:", authData);
        
        if (!authData.success || !authData.user) {
          console.error("Invalid auth data:", authData);
          toast.error("Failed to fetch user data");
          router.push('/admin/login');
          return;
        }
        
        // Check if the current user is the same as the URL admin
        const currentAdminUsername = authData.user.username;
        console.log(`Current admin: ${currentAdminUsername}, URL admin: ${adminUsername}`);
        
        if (currentAdminUsername !== adminUsername) {
          console.log("Username mismatch, checking if superadmin...");
          // Check if superadmin (who can access any admin's homestays)
          const superadminResponse = await fetch('/api/superadmin/auth/me');
          if (!superadminResponse.ok) {
            console.error("Not a superadmin, access denied");
            toast.error("You don't have permission to access another admin's dashboard");
            router.push('/admin');
            return;
          }
          console.log("Superadmin access confirmed");
          // If superadmin continues without returning
        }
        
        // Check permissions
        const hasEditPermission = authData.user.permissions?.homestayEdit === true;
        console.log("Has edit permission:", hasEditPermission);
        
        if (!hasEditPermission) {
          console.error("Missing homestayEdit permission");
          toast.error("You don't have permission to edit homestay details");
          router.push('/admin');
          return;
        }
        
        // Now fetch the homestay to verify it belongs to the admin in the URL
        try {
          console.log(`Fetching homestay data for ID: ${homestayId}`);
          const homestayResponse = await fetch(`/api/admin/homestays/${homestayId}`);
          if (!homestayResponse.ok) {
            console.error("Homestay response not OK:", homestayResponse.status);
            toast.error("Failed to load homestay details");
            router.push('/admin');
            return;
          }
          
          const homestayData = await homestayResponse.json();
          console.log("Homestay data received:", homestayData);
          
          if (!homestayData.success || !homestayData.data) {
            console.error("Invalid homestay data:", homestayData);
            toast.error("Failed to load homestay data");
            router.push('/admin');
            return;
          }
          
          // Check if this homestay belongs to the admin in the URL
          const homestayAdmin = homestayData.data.adminUsername;
          console.log(`Homestay belongs to: ${homestayAdmin}, URL admin: ${adminUsername}`);
          
          if (homestayAdmin && homestayAdmin !== adminUsername) {
            // Only enforce this check if we're not a superadmin (checked above)
            if (currentAdminUsername !== adminUsername && authData.user.role !== 'superadmin') {
              console.error("Homestay doesn't belong to the specified admin");
              toast.error("This homestay doesn't belong to the specified admin");
              router.push('/admin');
              return;
            }
          }
          
          console.log("All permission checks passed, granting access");
          // All checks passed - set authorized to show content
          setAuthorized(true);
          
        } catch (error) {
          console.error("Error fetching homestay:", error);
          toast.error("Failed to verify homestay data");
          router.push('/admin');
        }
      } catch (error) {
        console.error("Error verifying access:", error);
        setError("Failed to verify permissions");
      } finally {
        setLoading(false);
      }
    };
    
    verifyAccess();
  }, [adminUsername, homestayId, router]);
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 p-4 rounded-lg max-w-md w-full text-center">
          <h2 className="text-red-800 text-lg font-semibold mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => router.push('/admin')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loading />
        <p className="mt-4 text-gray-600">Verifying access...</p>
      </div>
    );
  }
  
  // Directly render the main homestay detail component
  return <AdminHomestayDetailPage />;
} 