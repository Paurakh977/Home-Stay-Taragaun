"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from "@/components/ui/loading";

export default function SuperAdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if a superadmin is logged in by looking for the token
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/superadmin/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // User is logged in, redirect to dashboard
          router.push('/superadmin/dashboard');
        } else {
          // User is not logged in, redirect to login
          router.push('/superadmin/login');
        }
      } catch (error) {
        console.error('Auth check failed', error);
        // On error, default to login
        router.push('/superadmin/login');
      }
    };

    checkAuth();
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loading />
    </div>
  );
} 