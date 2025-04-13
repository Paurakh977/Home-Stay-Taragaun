"use client";

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  
  // Don't show sidebar on login page
  const isLoginPage = pathname === '/admin/login';

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      {/* Mobile menu button - hidden on login page */}
      {!isLoginPage && (
        <button 
          onClick={toggleSidebar}
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Mobile sidebar overlay - hidden on login page */}
      {!isLoginPage && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar for desktop and mobile - hidden on login page */}
      {!isLoginPage && (
        <aside 
          className={`fixed md:static top-0 left-0 h-full z-40 w-64 flex-shrink-0 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <AdminSidebar />
        </aside>
      )}
      
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </>
  );
} 