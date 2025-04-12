'use client';

import { useParams } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/layout';

// Wrapper component for admin-specific dashboard layout
export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // We don't need to extract and pass adminUsername as it's
  // already available in the URL context and will be handled 
  // by the route configuration.
  
  // Using the same dashboard layout as the main dashboard
  return <DashboardLayout>{children}</DashboardLayout>;
} 