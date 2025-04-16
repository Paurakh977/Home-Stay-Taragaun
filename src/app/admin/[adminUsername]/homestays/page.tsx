'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AdminHomestayClient from '../../components/AdminHomestayClient';
import Loading from '@/components/ui/loading';

export default function AdminHomestaysPage() {
  const params = useParams();
  const router = useRouter();
  const adminUsername = params.adminUsername as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  
  // Verify permissions on component mount
  useEffect(() => {
    const verifyAccess = async () => {
      try {
        setLoading(true);
        
        // First, check if the current user is authenticated as the correct admin
        const authResponse = await fetch('/api/admin/auth/me');
        if (!authResponse.ok) {
          toast.error("Authentication failed. Please log in again.");
          router.push('/admin/login');
          return;
        }
        
        const authData = await authResponse.json();
        if (!authData.success || !authData.user) {
          toast.error("Failed to fetch user data");
          router.push('/admin/login');
          return;
        }
        
        // Check if the current user is the same as the URL admin
        const currentAdminUsername = authData.user.username;
        if (currentAdminUsername !== adminUsername) {
          // Check if superadmin (who can access any admin's homestays)
          const superadminResponse = await fetch('/api/superadmin/auth/me');
          if (!superadminResponse.ok) {
            toast.error("You don't have permission to access another admin's dashboard");
            router.push('/admin');
            return;
          }
          // If superadmin continues without returning
        }
        
        // All checks passed
        setAuthorized(true);
      } catch (error) {
        console.error("Error verifying access:", error);
        setError("Failed to verify permissions");
      } finally {
        setLoading(false);
      }
    };
    
    verifyAccess();
  }, [adminUsername, router]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loading />
        <p className="mt-4 text-gray-600">Verifying access...</p>
      </div>
    );
  }
  
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
  
  if (!authorized) {
    return null; // Will redirect in the useEffect
  }
  
  return (
    <div className="max-w-full">
      <AdminHomestayClient username={adminUsername} noSidebar={true} />
    </div>
  );
} 