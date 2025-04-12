'use client';

import { useParams } from 'next/navigation';
import LoginPage from '@/app/login/page';

// Wrapper component for admin-specific login
export default function AdminLoginPage() {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  
  // Pass the adminUsername to the login page
  return <LoginPage adminUsername={adminUsername} />;
} 