'use client';

import { useParams } from 'next/navigation';
import PortalPage from '@/app/dashboard/portal/page';

// Wrapper component for admin-specific portal page
export default function AdminPortalPage() {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  
  // Pass the adminUsername to the portal page
  return <PortalPage adminUsername={adminUsername} />;
} 