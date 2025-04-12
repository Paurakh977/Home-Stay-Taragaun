'use client';

import { ReactNode, useEffect, useState } from 'react';
import { SuperAdminSidebar } from '@/components/superadmin/SuperAdminSidebar';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
// Import necessary components for mobile sidebar/header if needed
// import Link from "next/link"
// import {
//   Home,
//   LineChart,
//   Package,
//   Package2,
//   PanelLeft,
//   Search,
//   ShoppingCart,
//   Users2,
// } from "lucide-react"
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb"
// import { Button } from "@/components/ui/button"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import { Input } from "@/components/ui/input"
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/superadmin/auth/me');
        
        if (!response.ok) {
          // Not authenticated, redirect to login
          window.location.href = '/superadmin/login';
          return;
        }
        
        // We're authenticated, continue loading the dashboard
        setIsLoading(false);
      } catch (error) {
        console.error('Authentication check failed:', error);
        // On error, redirect to login
        window.location.href = '/superadmin/login';
      }
    }
    
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <SuperAdminSidebar />
      <div className="flex flex-col">
        {/* Optional: Add a header here for mobile view toggle and user dropdown */}
        {/* Example Header Structure:
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
           Mobile Sidebar Toggle (Sheet)
           Breadcrumbs or Title 
           User Dropdown 
        </header> */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children} {/* Page content will be rendered here */}
        </main>
      </div>
    </div>
  );
} 