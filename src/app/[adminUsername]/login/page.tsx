'use client';

import { useParams } from 'next/navigation';
import LoginPage from '@/app/login/page';
import Link from 'next/link';

// Wrapper component for admin-specific login
export default function AdminLoginPage() {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  
  // TEMPORARY: Show PAGE UNAVAILABLE message instead of login form
  // When you want to restore the login page:
  // 1. Delete everything between "TEMPORARY START" and "TEMPORARY END"
  // 2. Uncomment the line that returns the LoginPage component below
  
  // TEMPORARY START
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        zIndex: 9999, // Very high z-index to cover everything
      }}
    >
      <Link 
        href="/homestays" 
        style={{
          padding: '12px 24px',
          backgroundColor: '#4F46E5', // Indigo color
          color: 'white',
          borderRadius: '8px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          fontSize: '16px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Explore Homestays
      </Link>
    </div>
  );
  // TEMPORARY END
  
  // Original login page (commented out temporarily)
  // return <LoginPage adminUsername={adminUsername} />;
} 