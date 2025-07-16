"use client";

import { useParams } from 'next/navigation';
import { useState } from 'react';
import ReportPage from '@/components/shared/ReportPage';
import OfficerSidebar from '@/components/officer/OfficerSidebar';
import { Menu, X } from 'lucide-react';

export default function OfficerDistrictTypePage() {
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

      {/* Officer Sidebar */}
      <aside 
        className={`fixed md:static top-0 left-0 h-full z-40 w-64 flex-shrink-0 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <OfficerSidebar adminUsername={adminUsername} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <ReportPage
          title="District-wise Classification"
          description="View homestay details organized by districts within a selected province, including contact information and registration details."
          type="district-type"
          userType="officer"
          username={adminUsername}
        />
      </div>
    </div>
  );
} 