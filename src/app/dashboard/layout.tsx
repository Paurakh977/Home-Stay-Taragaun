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

// Helper function to generate initials
const getInitials = (name: string): string => {
  if (!name) return "?";
  const words = name.split(' ').filter(Boolean);
  if (words.length === 0) return "?";
  // Use first letter of the first word and first letter of the last word
  const firstInitial = words[0].charAt(0);
  const lastInitial = words.length > 1 ? words[words.length - 1].charAt(0) : '';
  return (firstInitial + lastInitial).toUpperCase();
};

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
        localStorage.removeItem("user");
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
    const savedCollapsedState = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsedState) {
      setIsCollapsed(savedCollapsedState === "true");
    }
  }, [router]);

  // ADDED: useEffect to track profileImage state changes
  useEffect(() => {
    console.log("[Layout State Change] profileImage state is now:", profileImage);
  }, [profileImage]);
  
  // Fetch user's profile image
  const fetchProfileImage = async (homestayId: string) => {
    console.log("[Layout Fetch] Fetching profile image for:", homestayId);
    try {
      const response = await fetch(`/api/homestays/${homestayId}`);
      if (!response.ok) {
        console.error("[Layout Fetch] Response not OK:", response.status);
        throw new Error('Failed to fetch homestay data');
      }
      const data = await response.json();
      // ADDED: Log the exact value received from API
      console.log("[Layout Fetch] Received profileImage from API:", data?.homestay?.profileImage);
      // Set state (should handle null correctly)
      setProfileImage(data?.homestay?.profileImage || null);
      
    } catch (err) {
      console.error('[Layout Fetch] Error fetching profile image:', err);
      setProfileImage(null); // Explicitly set to null on error
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

  // Function to render profile image or initials placeholder
  const renderProfileImage = (size: "small" | "medium") => {
    const baseSizeClasses = size === "small" ? "h-6 w-6" : "h-10 w-10";
    const textSizeClasses = size === "small" ? "text-xs" : "text-base";
    
    // Check if profileImage state is a non-empty string 
    if (profileImage && typeof profileImage === 'string' && profileImage.trim() !== '') {
      // Convert /uploads/[...] path to /api/images/[...] path
      const apiUrl = profileImage.replace('/uploads/', '/api/images/') + `?t=${new Date().getTime()}`;
      console.log("[Layout Render] Attempting to render profile image with src:", apiUrl);
      return (
        <div className={`rounded-full overflow-hidden ${baseSizeClasses}`}>
          <img 
            src={apiUrl} 
            alt={user?.homeStayName || "Profile"}
            className="h-full w-full object-cover"
            onError={(e) => {
              console.warn(`[Layout Render] Failed to load profile image: ${apiUrl}`);
              const target = e.currentTarget;
              const parent = target.parentElement;
              if (parent) {
                const initials = getInitials(user?.homeStayName || "");
                const placeholder = document.createElement('div');
                placeholder.className = `flex items-center justify-center rounded-full bg-primary/20 text-primary font-semibold ${baseSizeClasses} ${textSizeClasses}`;
                placeholder.textContent = initials;
                parent.replaceChild(placeholder, target);
              }
            }}
          />
        </div>
      );
    } else {
      // Render initials placeholder
      console.log("[Layout Render] Rendering initials, profileImage state was:", profileImage);
      const initials = getInitials(user?.homeStayName || "");
      return (
        <div className={`flex items-center justify-center rounded-full bg-primary/20 text-primary font-semibold ${baseSizeClasses} ${textSizeClasses}`}>
          {initials}
        </div>
      );
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
              {getInitials(user?.homeStayName || "")}
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
              {renderProfileImage("medium")}
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