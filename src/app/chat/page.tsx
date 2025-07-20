'use client';

import React, { useState, useEffect } from 'react';
import PlatformNavbar from '@/components/platform/PlatformNavbar';
import { ChatContainer } from '@/components/chat';

const ChatPage = () => {
  const [navbarHeight, setNavbarHeight] = useState(80); // Default height

  // Measure navbar height for proper spacing
  useEffect(() => {
    const measureNavbar = () => {
      const navbarElement = document.querySelector('nav');
      if (navbarElement) {
        setNavbarHeight(navbarElement.offsetHeight);
      }
    };
    
    // Measure on load and on resize
    measureNavbar();
    window.addEventListener('resize', measureNavbar);
    
    return () => window.removeEventListener('resize', measureNavbar);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Fixed navbar at the very top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <PlatformNavbar />
      </div>
      
      {/* Chat container */}
      <ChatContainer navbarHeight={navbarHeight} />
    </div>
  );
};

export default ChatPage;