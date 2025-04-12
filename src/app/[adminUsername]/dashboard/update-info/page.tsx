'use client';

import { useParams } from 'next/navigation';
import UpdateInfoPage from '@/app/dashboard/update-info/page';

// Wrapper component for admin-specific update info page
export default function AdminUpdateInfoPage() {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  
  // Pass the adminUsername to the update info page
  return <UpdateInfoPage adminUsername={adminUsername} />;
} 