'use client';

import { useParams } from 'next/navigation';
import DashboardPage from '@/app/dashboard/page';

// Wrapper component for admin-specific dashboard
export default function AdminDashboardPage() {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  
  // Pass the adminUsername to the dashboard page
  return <DashboardPage adminUsername={adminUsername} />;
} 