"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  User,
  LogOut,
  Home,
  Settings,
  MessageSquare,
  Upload,
  PencilLine,
  MenuIcon,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface UserInfo {
  homestayId: string;
  homeStayName: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get user from localStorage
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        setUser(userData);
        
        // Fetch the user's profile image
        fetchProfileImage(userData.homestayId);
        
      } catch (err) {
        console.error("Error parsing user data:", err);
        // If we can't parse the user data, clear it and redirect
        localStorage.removeItem("user");
        router.push("/login");
      }
    } else {
      // No user data, redirect to login
      router.push("/login");
    }

    // Load sidebar collapsed state from localStorage
    const savedCollapsedState = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsedState) {
      setIsCollapsed(savedCollapsedState === "true");
    }
  }, [router]);
  
  // Fetch user's profile image
  const fetchProfileImage = async (homestayId: string) => {
    try {
      const response = await fetch(`/api/homestays/${homestayId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch homestay data');
      }
      
      const data = await response.json();
      setProfileImage(data.homestay.profileImage);
      
    } catch (err) {
      console.error('Error fetching profile image:', err);
    }
  };

  // Handle sidebar collapse toggle
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState.toString());
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Clear user from localStorage
      localStorage.removeItem("user");

      // Call logout API to clear the cookie
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Redirect to home page
      router.push("/");
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  const isActive = (path: string) => {
    return pathname === `/dashboard${path}` ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100";
  };

  // Function to render profile image or default user icon
  const renderProfileImage = (size: "small" | "medium") => {
    const sizeClasses = size === "small" ? "h-6 w-6" : "h-10 w-10";
    
    if (profileImage) {
      return (
        <div className={`rounded-full overflow-hidden ${sizeClasses}`}>
          <img 
            src={`${profileImage}?t=${new Date().getTime()}`} 
            alt="Profile" 
            className="h-full w-full object-cover"
          />
        </div>
      );
    } else {
      return <User className={`${sizeClasses} text-primary`} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar - positioned below the main navbar */}
      <div className="lg:hidden fixed top-16 left-0 z-30 w-full bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="font-bold text-lg text-gray-800 truncate">
          {user?.homeStayName || "Dashboard"}
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
        >
          {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <div 
        className={`hidden lg:flex h-screen fixed flex-col bg-white border-r border-gray-200 z-40 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className={`p-6 flex ${isCollapsed ? "justify-center" : "justify-between"} items-center`}>
          {!isCollapsed && <h1 className="text-xl font-bold text-primary">Hamro Home Stay</h1>}
          {isCollapsed && (
            <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
              HH
            </div>
          )}
          <button 
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-primary transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {user && !isCollapsed && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-full">
                {renderProfileImage("small")}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.homeStayName}</p>
                <p className="text-xs text-gray-500">{user.homestayId}</p>
              </div>
            </div>
          </div>
        )}

        {user && isCollapsed && (
          <div className="py-4 border-b border-gray-200 flex justify-center">
            <div className="bg-primary/10 p-2 rounded-full">
              {renderProfileImage("small")}
            </div>
          </div>
        )}

        <nav className={`mt-6 flex-1 ${isCollapsed ? "px-2" : "px-4"} space-y-2`}>
          <Link
            href="/dashboard"
            className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 rounded-md transition-colors ${isActive("")}`}
            title={isCollapsed ? "Dashboard" : ""}
          >
            <Home className="h-5 w-5 min-w-5" />
            {!isCollapsed && <span className="ml-3">Dashboard</span>}
          </Link>
          <Link
            href="/dashboard/profile"
            className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 rounded-md transition-colors ${isActive("/profile")}`}
            title={isCollapsed ? "Profile" : ""}
          >
            <User className="h-5 w-5 min-w-5" />
            {!isCollapsed && <span className="ml-3">Profile</span>}
          </Link>
          <Link
            href="/dashboard/chats"
            className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 rounded-md transition-colors ${isActive("/chats")}`}
            title={isCollapsed ? "Chats" : ""}
          >
            <MessageSquare className="h-5 w-5 min-w-5" />
            {!isCollapsed && <span className="ml-3">Chats</span>}
          </Link>
          <Link
            href="/dashboard/portal"
            className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 rounded-md transition-colors ${isActive("/portal")}`}
            title={isCollapsed ? "Portal" : ""}
          >
            <Upload className="h-5 w-5 min-w-5" />
            {!isCollapsed && <span className="ml-3">Portal</span>}
          </Link>
          <Link
            href="/dashboard/update-info"
            className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 rounded-md transition-colors ${isActive("/update-info")}`}
            title={isCollapsed ? "Update Information" : ""}
          >
            <PencilLine className="h-5 w-5 min-w-5" />
            {!isCollapsed && <span className="ml-3">Update Information</span>}
          </Link>
          <Link
            href="/dashboard/settings"
            className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 rounded-md transition-colors ${isActive("/settings")}`}
            title={isCollapsed ? "Settings" : ""}
          >
            <Settings className="h-5 w-5 min-w-5" />
            {!isCollapsed && <span className="ml-3">Settings</span>}
          </Link>
        </nav>

        <div className={`${isCollapsed ? "p-2" : "p-4"} border-t border-gray-200`}>
          <button
            onClick={handleLogout}
            className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 w-full text-left rounded-md text-red-600 hover:bg-red-50 transition-colors`}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut className="h-5 w-5 min-w-5" />
            {!isCollapsed && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-35 bg-black bg-opacity-50" style={{ top: "9rem" }}>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out" style={{ top: "9rem" }}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h1 className="text-xl font-bold text-primary">Hamro Home Stay</h1>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {user && (
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    {renderProfileImage("small")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.homeStayName}</p>
                    <p className="text-xs text-gray-500">{user.homestayId}</p>
                  </div>
                </div>
              </div>
            )}

            <nav className="mt-6 px-4 space-y-2">
              <Link
                href="/dashboard"
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${isActive("")}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/profile"
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${isActive("/profile")}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="h-5 w-5 mr-3" />
                Profile
              </Link>
              <Link
                href="/dashboard/chats"
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${isActive("/chats")}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <MessageSquare className="h-5 w-5 mr-3" />
                Chats
              </Link>
              <Link
                href="/dashboard/portal"
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${isActive("/portal")}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Upload className="h-5 w-5 mr-3" />
                Portal
              </Link>
              <Link
                href="/dashboard/update-info"
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${isActive("/update-info")}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <PencilLine className="h-5 w-5 mr-3" />
                Update Information
              </Link>
              <Link
                href="/dashboard/settings"
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${isActive("/settings")}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-3 w-full text-left rounded-md text-red-600 hover:bg-red-50 transition-colors mt-4"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={isCollapsed ? "lg:ml-20" : "lg:ml-64"} style={{ paddingTop: "9rem", paddingBottom: "2rem" }}>
        <div className="p-6 lg:pt-6">{children}</div>
      </div>
    </div>
  );
} 