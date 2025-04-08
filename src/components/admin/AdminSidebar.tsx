"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Hotel } from 'lucide-react';

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

  return (
    <aside className="h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <Link href="/admin" className="flex items-center">
           <span className="font-medium text-gray-900">Admin</span>
        </Link>
      </div>
      
      <nav className="p-2">
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
    </aside>
  );
} 