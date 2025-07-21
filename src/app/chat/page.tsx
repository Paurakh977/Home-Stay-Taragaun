"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ChatContainer } from '@/components/chat';

// Loading component for Suspense fallback
function ChatLoader() {
  return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

export default function ChatPage() {
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

  return (
    <div className="min-h-screen max-h-screen overflow-hidden">
      <Suspense fallback={<ChatLoader />}>
        <ChatContainer navbarHeight={80} />
      </Suspense>
    </div>
  );
}