'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Users, 
  Settings, 
  LogOut, 
  ShieldCheck,
  LineChart,
  Bell,
  FileText,
  HelpCircle,
  UserPlus,
  Shield,
  Key,
  ChevronDown,
  ChevronRight,
  LucideIcon,
  LayoutDashboard,
  CreditCard,
  BookOpen,
  Building,
  Mountain,
  CircleDashed
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Define interfaces for type safety
interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
}

interface MenuSection {
  section: string;
  items: MenuItem[];
}

// Extended menu items with sections
const menuItems: MenuSection[] = [
  { 
    section: "Core",
    items: [
      { href: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      // Manage Users is now a special dropdown item, handled separately
    ]
  },
  {
    section: "Management",
    items: [
      { href: '/superadmin/dashboard/analytics', label: 'Analytics', icon: LineChart },
      { href: '/superadmin/dashboard/reports', label: 'Reports', icon: FileText, badge: '3', badgeColor: 'bg-amber-500' },
      { href: '/superadmin/dashboard/homestays', label: 'Homestays', icon: Mountain, badge: '12', badgeColor: 'bg-blue-500' },
      { href: '/superadmin/dashboard/custom-fields', label: 'Custom Fields', icon: CircleDashed },
      { href: '/superadmin/dashboard/content', label: 'Website Content', icon: FileText, badge: 'New', badgeColor: 'bg-green-500' }
    ]
  },
  {
    section: "System",
    items: [
      { href: '/superadmin/dashboard/settings', label: 'Settings', icon: Settings },
      { href: '/superadmin/dashboard/help', label: 'Help & Support', icon: HelpCircle },
    ]
  }
];

// User management dropdown items
const userManagementItems: MenuItem[] = [
  { href: '/superadmin/dashboard/users', label: 'All Users', icon: Users, badge: 'New', badgeColor: 'bg-primary' },
  { href: '/superadmin/dashboard/users/create', label: 'Create New User', icon: UserPlus },
  { href: '/superadmin/dashboard/users/roles', label: 'Roles', icon: Shield },
  { href: '/superadmin/dashboard/users/permissions', label: 'Permissions', icon: Key },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Initialize based on URL path
  useEffect(() => {
    if (pathname.startsWith('/superadmin/dashboard/users')) {
      setUserMenuOpen(true);
    }
  }, [pathname]);

  // Fetch notification count on load and periodically
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/superadmin/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotificationCount(data.count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    
    // Fetch immediately on load
    fetchNotifications();
    
    // Then fetch every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = async () => {
    try {
      // Call the logout API
      const response = await fetch('/api/superadmin/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      toast.success('Signed out successfully');
      
      // Use a full page redirect to ensure we clear everything
      setTimeout(() => {
        window.location.href = '/superadmin/login';
      }, 1000);
    } catch (error) {
      console.error('Logout failed', error);
      toast.error('Sign out failed. Please try again.');
    }
  };

  const isActive = (href: string) => {
    return pathname === href || 
           (href !== '/superadmin/dashboard' && pathname.startsWith(href));
  };

  return (
    <div className="hidden border-r bg-gradient-to-b from-background to-background/95 backdrop-blur-sm shadow-sm md:block">
      <div className="flex h-full max-h-screen flex-col">
        {/* Sidebar Header with Logo */}
        <div className="sticky top-0 z-10 flex h-16 items-center bg-background shadow-sm border-b px-4 lg:px-6">
          <Link href="/superadmin/dashboard" className="flex items-center gap-2.5 font-semibold text-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold tracking-tight">Admin Hub</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link 
              href="/superadmin/dashboard/notifications" 
              className="relative"
              aria-label={`Notifications: ${notificationCount} unread`}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white font-bold">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Navigation with Sections */}
        <nav className="flex-1 overflow-auto py-4 px-4 lg:px-6">
          {menuItems.map((section, sectionIdx) => (
            <div key={section.section} className={cn("py-2", sectionIdx > 0 && "mt-3")}>
              <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                {section.section}
              </h3>
              
              <div className="grid gap-1">
                {section.items.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent",
                      isActive(item.href) 
                        ? "bg-accent text-accent-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn(
                        "h-4 w-4 transition-colors",
                        isActive(item.href) 
                          ? "text-foreground" 
                          : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <Badge variant="outline" className={cn(
                        "ml-auto text-xs h-5 px-1.5 border-0 text-white",
                        item.badgeColor || "bg-primary"
                      )}>
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>

              {/* User Management Dropdown (Only in Core section) */}
              {sectionIdx === 0 && (
                <div className="grid gap-1">
                  {/* Dropdown Toggle Button */}
                  <button
                    onClick={toggleUserMenu}
                    className={cn(
                      "group flex items-center justify-between w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent",
                      pathname.startsWith('/superadmin/dashboard/users')
                        ? "bg-accent text-accent-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Users className={cn(
                        "h-4 w-4 transition-colors",
                        pathname.startsWith('/superadmin/dashboard/users')
                          ? "text-foreground" 
                          : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      <span>Manage Users</span>
                    </div>
                    {userMenuOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {/* Dropdown Content */}
                  {userMenuOpen && (
                    <div className="ml-4 mt-1 pl-3 border-l-2 border-muted">
                      {userManagementItems.map((item) => (
                        <Link 
                          key={item.href} 
                          href={item.href}
                          className={cn(
                            "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                            isActive(item.href) 
                              ? "bg-accent text-accent-foreground" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={cn(
                              "h-4 w-4 transition-colors",
                              isActive(item.href) 
                                ? "text-foreground" 
                                : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <Badge variant="outline" className={cn(
                              "ml-auto text-xs h-5 px-1.5 border-0 text-white", 
                              item.badgeColor || "bg-primary"
                            )}>
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Separator after each section (except the last) */}
              {sectionIdx < menuItems.length - 1 && (
                <Separator className="my-3 opacity-50" />
              )}
            </div>
          ))}
        </nav>

        {/* User Account Section */}
        <div className="mt-auto border-t bg-card px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Super Admin</span>
              <span className="text-xs text-muted-foreground">System Access</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-red-500 hover:bg-red-100 hover:text-red-600" 
              onClick={handleLogout}
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 