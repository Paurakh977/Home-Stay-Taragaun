'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDetailCard } from '@/components/superadmin/AdminDetailCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/superadmin/users/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch admin data');
      }
      
      const data = await response.json();
      setAdmin(data.user);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError('Failed to load admin data. Please try again.');
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [params.id]);

  const handleBackClick = () => {
    router.push('/superadmin/dashboard/users');
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
        
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-gray-500">Loading admin data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !admin) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
        
        <div className="bg-red-50 rounded-md p-6 text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Admin</h3>
          <p className="text-red-600">{error || 'Admin data not found'}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={fetchAdminData}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        
        <h1 className="text-2xl font-bold">Admin: {admin.username}</h1>
      </div>
      
      <AdminDetailCard 
        admin={admin} 
        onRefresh={fetchAdminData}
      />
    </div>
  );
} 