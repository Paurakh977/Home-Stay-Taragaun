import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getUserByUsername } from '@/lib/services/userService';
import { getBrandingByAdminUsername } from '@/lib/services/brandingService';
import { BrandingProvider } from '@/context/BrandingContext';
import AdminLoginForm from '../../components/AdminLoginForm';

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

export default async function AdminLoginPage({
  params,
}: {
  params: { adminUsername: string };
}) {
  // Always await params in server components to avoid React hydration warnings
  const resolvedParams = await Promise.resolve(params);
  const { adminUsername } = resolvedParams;
  
  // Check if admin exists
  try {
    const admin = await getUserByUsername(adminUsername);
    
    if (!admin || admin.role !== 'admin') {
      // If admin doesn't exist or isn't an admin, return 404
      return notFound();
    }
    
    // Fetch branding data for this admin
    const brandingData = await getBrandingByAdminUsername(adminUsername);
    
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<LoadingFallback />}>
          <BrandingProvider brandingData={brandingData}>
            <AdminLoginForm adminUsername={adminUsername} />
          </BrandingProvider>
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error fetching admin:', error);
    return notFound();
  }
} 