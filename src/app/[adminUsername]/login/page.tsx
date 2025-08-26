'use client';

import { useParams } from 'next/navigation';
import LoginPage from '@/app/login/page';
// Wrapper component for admin-specific login - now open to all users
export default function AdminLoginPage() {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  
  // No longer gated by superadmin check - open to all users
  return (
    <LoginPage adminUsername={adminUsername} />
  );
}