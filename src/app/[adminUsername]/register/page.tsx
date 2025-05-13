'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import RegisterPage from '@/app/register/page';

// This is a wrapper component that passes the adminUsername to the main register page
export default function AdminRegisterPage() {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  
  // Use useEffect to add CSS to hide navbar and footer
  useEffect(() => {
    // Add a style tag to hide navbar and footer
    const style = document.createElement('style');
    style.textContent = `
      nav, footer {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // The adminUsername will be available for the actual registration logic
  return <RegisterPage adminUsername={adminUsername} />;
} 