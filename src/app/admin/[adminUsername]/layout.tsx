import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { notFound } from 'next/navigation';
import AdminClientWrapper from '../components/AdminClientWrapper';
import { getUserByUsername } from '@/lib/services/userService';

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
  
  // Verify admin exists but don't block rendering here
  // This allows login page to function properly
  try {
    // Check if admin exists
    const admin = await getUserByUsername(adminUsername);
    
    // If the url contains login, allow access even if admin doesn't exist
    // The login page will handle showing 404 
    if ((!admin || admin.role !== 'admin') && !adminUsername.includes('login')) {
      return notFound();
    }
  } catch (error) {
    console.error('Error verifying admin:', error);
    // Don't show 404 for login path
    if (!adminUsername.includes('login')) {
      return notFound();
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingFallback />}>
        <AdminClientWrapper>
          <main className="flex-1">
            <Suspense fallback={<LoadingFallback />}>
              {children}
            </Suspense>
          </main>
        </AdminClientWrapper>
      </Suspense>
      <Toaster />
    </div>
  );
} 