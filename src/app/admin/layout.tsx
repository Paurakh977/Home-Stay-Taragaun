import { Suspense } from 'react';
import { Toaster } from 'sonner';
import AdminClientWrapper from './components/AdminClientWrapper';

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full"></div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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