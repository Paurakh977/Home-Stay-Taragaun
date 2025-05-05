'use client';

import { useParams } from 'next/navigation';
import RegisterPage from '@/app/register/page';

// This is a wrapper component that passes the adminUsername to the main register page
export default function AdminRegisterPage() {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  
  // The adminUsername will be available for the actual registration logic
  return <RegisterPage adminUsername={adminUsername} />;
} 