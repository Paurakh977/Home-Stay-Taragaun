'use client';

import { useParams } from 'next/navigation';
import LoginPage from '@/app/login/page';
import SuperadminWrapper from '@/components/shared/SuperadminWrapper';

// Wrapper component for admin-specific login
export default function AdminLoginPage() {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  
  // Use SuperadminWrapper to conditionally show content
  return (
    <SuperadminWrapper>
      <LoginPage adminUsername={adminUsername} />
    </SuperadminWrapper>
  );
} 