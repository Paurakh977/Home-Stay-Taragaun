"use client";

import { useParams } from 'next/navigation';
import { useState } from 'react';
import ReportPage from '@/components/shared/ReportPage';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Menu, X } from 'lucide-react';

export default function HomestayServicesReportPage() {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile menu button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Admin Sidebar */}
      <aside 
        className={`fixed md:static top-0 left-0 h-full z-40 w-64 flex-shrink-0 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <AdminSidebar username={adminUsername} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <ReportPage
          title="Homestay Services Report" 
          description="A comprehensive report of tourism services offered by homestays. Filter and analyze services data to gain insights into available tourism offerings."
          type="homestay-services"
          userType="admin"
          username={adminUsername}
        />
      </div>
    </div>
  );
} 