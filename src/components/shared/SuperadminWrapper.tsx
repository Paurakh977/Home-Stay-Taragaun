'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SuperadminWrapper({ children }: { children: React.ReactNode }) {
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check superadmin status on mount
  useEffect(() => {
    async function checkSuperadmin() {
      try {
        const response = await fetch('/api/superadmin/auth/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user?.role === 'superadmin') {
            setIsSuperadmin(true);
          }
        }
      } catch (error) {
        console.error('Error checking superadmin status:', error);
      } finally {
        setLoading(false);
      }
    }

    checkSuperadmin();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
    </div>;
  }

  // If superadmin, show the children (original content)
  if (isSuperadmin) {
    return <>{children}</>;
  }

  // If not superadmin, show the "Explore Homestays" button
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
} 