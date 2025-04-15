import { Suspense } from 'react';
import AdminHomestayClient from './components/AdminHomestayClient';

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

export default async function AdminHomestayListPage({
  searchParams,
}: {
  searchParams: { username?: string };
}) {
  // Properly await the entire searchParams object before accessing properties
  const params = await Promise.resolve(searchParams);
  const username = params.username;
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminHomestayClient username={username} />
    </Suspense>
  );
}