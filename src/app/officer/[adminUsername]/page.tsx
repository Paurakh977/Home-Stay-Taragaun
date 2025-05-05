import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getUserByUsername } from '@/lib/services/userService';
import ClientOfficerDashboard from './ClientOfficerDashboard';

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default async function OfficerDashboardPage({
  params,
}: {
  params: { adminUsername: string };
}) {
  const { adminUsername } = params;
  
  // Check if admin exists and has admin role
  try {
    const admin = await getUserByUsername(adminUsername);
    
    if (!admin || admin.role !== 'admin') {
      // If admin doesn't exist or isn't an admin, return 404
      return notFound();
    }
  } catch (error) {
    console.error('Error fetching admin:', error);
    return notFound();
  }
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ClientOfficerDashboard adminUsername={adminUsername} />
    </Suspense>
  );
} 