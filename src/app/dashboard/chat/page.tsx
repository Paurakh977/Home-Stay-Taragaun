"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardChatContainer } from '@/components/chat';
import { toast } from 'sonner';

interface UserInfo {
  homestayId: string;
  homeStayName: string;
  featureAccess?: {
    dashboard?: boolean;
    profile?: boolean;
    portal?: boolean;
    documents?: boolean;
    imageUpload?: boolean;
    settings?: boolean;
    chat?: boolean;
    updateInfo?: boolean;
  };
}

interface ChatPageProps {
  adminUsername?: string;
}

// Loading component for Suspense fallback
function ChatLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

export default function DashboardChatPage({ adminUsername }: ChatPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication and feature access on component mount
  useEffect(() => {
    // Check if user is logged in
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        setUser(userData);
        setLoading(false);
        
        // If chat access is explicitly set to false, redirect to dashboard
        if (userData.featureAccess && userData.featureAccess.chat === false) {
          toast.error("Access to chat feature is not permitted");
          router.push(adminUsername ? `/${adminUsername}/dashboard` : '/dashboard');
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
        localStorage.removeItem("user");
        router.push(adminUsername ? `/${adminUsername}/login` : '/login');
      }
    } else {
      router.push(adminUsername ? `/${adminUsername}/login` : '/login');
    }
  }, [router, adminUsername]);

  // Prevent page scrolling when in chat page
  useEffect(() => {
    // Save original body style
    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    // Disable scrolling on the body
    document.body.style.overflow = 'hidden';
    
    // Restore original style when component unmounts
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Display loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] max-h-[calc(100vh-9rem)] overflow-hidden fixed-chat">
      <div className="dashboard-header flex-shrink-0 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">सन्देशहरू</h1>
        <p className="text-gray-600">आफ्नो पाहुनाहरूसँग कुराकानी गर्नुहोस्</p>
      </div>
      
      <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        <Suspense fallback={<ChatLoader />}>
          <DashboardChatContainer 
            navbarHeight={0} 
            adminUsername={adminUsername} 
          />
        </Suspense>
      </div>

      <style jsx global>{`
        .fixed-chat {
          position: relative;
          width: 100%;
        }
        
        @media (max-width: 768px) {
          .dashboard-header {
            padding-bottom: 0.5rem;
            margin-bottom: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
} 