'use client';

import { useParams } from 'next/navigation';
import ProfilePage from '@/app/dashboard/profile/page';

// Wrapper component for admin-specific profile page
export default function AdminProfilePage() {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  
  // Pass the adminUsername to the profile page
  return <ProfilePage adminUsername={adminUsername} />;
} 