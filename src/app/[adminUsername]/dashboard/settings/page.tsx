'use client';

import { useParams } from 'next/navigation';
import SettingsPage from '@/app/dashboard/settings/page';

// Wrapper component for admin-specific settings page
export default function AdminSettingsPage() {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  
  // Pass the adminUsername to the settings page
  return <SettingsPage adminUsername={adminUsername} />;
} 