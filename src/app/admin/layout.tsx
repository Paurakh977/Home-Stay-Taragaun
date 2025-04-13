"use client";

import { useState } from 'react';
import { Toaster } from 'sonner';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Menu, X } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const adminUsername = searchParams.get('username');
  
  // Don't show sidebar on login page
  const isLoginPage = pathname === '/admin/login';

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-muted/40 relative">
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
      
      <main className={`flex-1 flex flex-col ${!isLoginPage ? 'md:ml-0' : ''}`}>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
        
        <Toaster position="top-right" />
      </main>
    </div>
  );
} 