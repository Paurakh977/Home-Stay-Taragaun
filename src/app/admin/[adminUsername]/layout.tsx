import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { notFound } from 'next/navigation';
import { getUserByUsername } from '@/lib/services/userService';
import { getBrandingByAdminUsername } from '@/lib/services/brandingService';
import { BrandingProvider } from '@/context/BrandingContext';
import AdminClientWrapper from '@/app/admin/components/AdminClientWrapper';

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full"></div>
    </div>
  );
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { adminUsername: string };
}) {
  // Always await params in server components to avoid React hydration warnings
  const resolvedParams = await Promise.resolve(params);
  const { adminUsername } = resolvedParams;
  
  // Check if this is a login page
  const isLoginPage = adminUsername.includes('login');
  
  // Verify admin exists but don't block rendering here
  // This allows login page to function properly
  try {
    // Check if admin exists
    const admin = await getUserByUsername(adminUsername);
    
    // If the url contains login, allow access even if admin doesn't exist
    // The login page will handle showing 404 
    if ((!admin || admin.role !== 'admin') && !isLoginPage) {
      return notFound();
    }
    
    // Fetch branding data for this admin
    const brandingData = await getBrandingByAdminUsername(adminUsername);
    
    // For login pages, return a simpler layout without sidebar
    if (isLoginPage) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <BrandingProvider brandingData={brandingData}>
            <AdminClientWrapper>
              <main className="min-h-screen bg-gray-50">
                {children}
              </main>
            </AdminClientWrapper>
            <Toaster />
          </BrandingProvider>
        </Suspense>
      );
    }
    
    // For regular admin pages with sidebar
    return (
      <Suspense fallback={<LoadingFallback />}>
        <BrandingProvider brandingData={brandingData}>
          <AdminClientWrapper>
            {/* Don't add a sidebar here - it should be included in the children */}
            {children}
            <Toaster />
          </AdminClientWrapper>
        </BrandingProvider>
      </Suspense>
    );
  } catch (error) {
    console.error('Error loading admin layout:', error);
    // Don't show 404 for login path
    if (!isLoginPage) {
      return notFound();
    }
    
    // Fallback layout for login with error
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AdminClientWrapper>
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </AdminClientWrapper>
        <Toaster />
      </Suspense>
    );
  }
} 