"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Hotel, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const sidebarNavItems = [
  {
    title: "Homestays",
    href: "/admin",
    icon: Hotel,
  },
  // Add more admin sections here later if needed
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/admin/auth/logout", {
        method: "POST",
      });
      
      if (response.ok) {
        toast.success("Logged out successfully");
        router.push("/admin/login");
      } else {
        throw new Error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  return (
    <aside className="h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <Link href="/admin" className="flex items-center">
           <span className="font-medium text-gray-900">Admin Dashboard</span>
        </Link>
        {/* Logout button for mobile/top position */}
        <button
          onClick={handleLogout}
          className="md:hidden flex items-center justify-center p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
      
      <nav className="p-2 flex-1">
        {sidebarNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm my-1 transition-colors ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Logout button for desktop/bottom position */}
      <div className="p-4 mt-auto border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center space-x-2 px-4 py-3 rounded-md text-sm w-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
} 