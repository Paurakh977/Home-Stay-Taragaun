"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Toaster } from "sonner";
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
  ChevronRight,
  FileText,
  Layout
} from "lucide-react";

interface UserInfo {
  homestayId: string;
  homeStayName: string;
  featureAccess?: {
    dashboard?: boolean;
    profile?: boolean;
    portal?: boolean;
    documents?: boolean;
    imageUpload?: boolean;
    settings?: boolean;
    chat?: boolean;
    updateInfo?: boolean;
  };
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
        
        // Verify user exists in the database
        verifyUserExists(userData.homestayId);
        
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

  // Verify that the user exists in the database
  const verifyUserExists = async (homestayId: string) => {
    try {
      // Add adminUsername to API call if we're in an admin route
      const adminParam = isAdminRoute ? `adminUsername=${pathname.split('/')[1]}` : '';
      const url = `/api/homestays/${homestayId}${adminParam ? `?${adminParam}` : ''}`;
      console.log("Making API request to:", url);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error("User verification failed: User does not exist in database");
        // User doesn't exist in the database anymore
        localStorage.removeItem("user");
        // Redirect to appropriate login path
        router.push(isAdminRoute ? `/${pathname.split('/')[1]}/login` : '/login');
        return;
      }
      
      // User exists, fetch profile image and feature access
      const data = await response.json();
      console.log("[Layout Fetch] Received profileImage from API:", data?.homestay?.profileImage);
      setProfileImage(data?.homestay?.profileImage || null);
      
      // Update user with feature access data
      if (data?.homestay?.featureAccess && user) {
        const updatedUser: UserInfo = {
          homestayId: user.homestayId,
          homeStayName: user.homeStayName,
          featureAccess: data.homestay.featureAccess
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      
      // Check if current path is allowed by feature access
      checkFeatureAccess(data?.homestay?.featureAccess);
      
    } catch (err) {
      console.error("Error verifying user:", err);
      // On error, log out the user
      localStorage.removeItem("user");
      // Redirect to appropriate login path
      router.push(isAdminRoute ? `/${pathname.split('/')[1]}/login` : '/login');
    }
  };
  
  // ADDED: useEffect to track profileImage state changes
  useEffect(() => {
    console.log("[Layout State Change] profileImage state is now:", profileImage);
  }, [profileImage]);
  
  // Fetch user's profile image - Removed, now part of verifyUserExists

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

      // Extract adminUsername from path if this is an admin route
      const pathParts = pathname.split('/');
      const isAdminRoute = pathParts.length > 2 && pathParts[1] !== 'dashboard';
      const adminUsername = isAdminRoute ? pathParts[1] : null;
      
      // Call logout API to clear the cookie
      const adminParam = adminUsername ? `adminUsername=${adminUsername}` : '';
      const logoutUrl = `/api/auth/logout${adminParam ? `?${adminParam}` : ''}`;
      
      console.log("Making logout request to:", logoutUrl);
      await fetch(logoutUrl, {
        method: "POST",
      });

      // Redirect to the appropriate path
      if (adminUsername) {
        // Redirect to admin home page
        router.push(`/${adminUsername}`);
      } else {
        // Redirect to main home page
        router.push("/");
      }
    } catch (err) {
      console.error("Error during logout:", err);
      // Still redirect even if there's an error
      const pathParts = pathname.split('/');
      const isAdminRoute = pathParts.length > 2 && pathParts[1] !== 'dashboard';
      const adminUsername = isAdminRoute ? pathParts[1] : null;
      
      if (adminUsername) {
        router.push(`/${adminUsername}`);
      } else {
        router.push("/");
      }
    }
  };

  const isActive = (path: string) => {
    // Check if we're in an admin route (pathname contains a segment between first and second slash)
    const isAdminRoute = /^\/[^/]+\/dashboard/.test(pathname);
    
    if (isAdminRoute) {
      // For admin routes, check if the path matches after the admin username
      return pathname.endsWith(`/dashboard${path}`) ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100";
    } else {
      // For regular routes, direct match
      return pathname === `/dashboard${path}` ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100";
    }
  };

  // Function to render profile image or initials placeholder
  const renderProfileImage = (size: "small" | "medium") => {
    const baseSizeClasses = size === "small" ? "h-6 w-6" : "h-10 w-10";
    const textSizeClasses = size === "small" ? "text-xs" : "text-base";
    
    // Check if profileImage state is a non-empty string 
    if (profileImage && typeof profileImage === 'string' && profileImage.trim() !== '') {
      // Convert /uploads/[...] path to /api/images/[...] path
      // Make sure to use the exact same path structure as stored in the database
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

  const isAdminRoute = /^\/[^/]+\/dashboard/.test(pathname);
  const basePath = isAdminRoute 
    ? `/${pathname.split('/')[1]}/dashboard` // Extract adminUsername and create path
    : '/dashboard';

  // Add feature access check function
  const checkFeatureAccess = (featureAccess: UserInfo['featureAccess']) => {
    if (!featureAccess) return; // No feature access info
    
    const pathSegments = pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    const secondLastSegment = pathSegments.length > 2 ? pathSegments[pathSegments.length - 2] : null;
    
    // Default dashboard access
    if (pathname.endsWith('/dashboard') && !featureAccess.dashboard) {
      router.push('/access-denied');
      return;
    }
    
    // Check specific features
    if (lastSegment === 'profile' && !featureAccess.profile) {
      router.push('/access-denied');
      return;
    }
    
    if (lastSegment === 'portal' && !featureAccess.portal) {
      router.push('/access-denied');
      return;
    }
    
    if (lastSegment === 'documents' && !featureAccess.documents) {
      router.push('/access-denied');
      return;
    }
    
    if (lastSegment === 'settings' && !featureAccess.settings) {
      router.push('/access-denied');
      return;
    }
    
    if (lastSegment === 'update-info' && !featureAccess.updateInfo) {
      router.push('/access-denied');
      return;
    }
  };

  // Update useEffect to check current path whenever user data changes
  useEffect(() => {
    if (user?.featureAccess) {
      checkFeatureAccess(user.featureAccess);
    }
  }, [pathname, user?.featureAccess]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
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
            href={`${basePath}`}
            className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 rounded-md transition-colors ${isActive("")}`}
            title={isCollapsed ? "Dashboard" : ""}
          >
            <Home className="h-5 w-5 min-w-5" />
            {!isCollapsed && <span className="ml-3">Dashboard</span>}
          </Link>
          <Link
            href={`${basePath}/profile`}
            className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 rounded-md transition-colors ${isActive("/profile")}`}
            title={isCollapsed ? "Profile" : ""}
          >
            <User className="h-5 w-5 min-w-5" />
            {!isCollapsed && <span className="ml-3">Profile</span>}
          </Link>
          <Link
            href={`${basePath}/chats`}
            className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 rounded-md transition-colors ${isActive("/chats")}`}
            title={isCollapsed ? "Chats" : ""}
          >
            <MessageSquare className="h-5 w-5 min-w-5" />
            {!isCollapsed && <span className="ml-3">Chats</span>}
          </Link>
          <Link
            href={`${basePath}/portal`}
            className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 rounded-md transition-colors ${isActive("/portal")}`}
            title={isCollapsed ? "Portal" : ""}
          >
            <Layout className="h-5 w-5 min-w-5" />
            {!isCollapsed && <span className="ml-3">Portal</span>}
          </Link>
          <Link
            href={`${basePath}/documents`}
            className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 rounded-md transition-colors ${isActive("/documents")}`}
            title={isCollapsed ? "Upload Documents" : ""}
          >
            <FileText className="h-5 w-5 min-w-5" />
            {!isCollapsed && <span className="ml-3">Upload Documents</span>}
          </Link>
          <Link
            href={`${basePath}/update-info`}
            className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 rounded-md transition-colors ${isActive("/update-info")}`}
            title={isCollapsed ? "Update Information" : ""}
          >
            <PencilLine className="h-5 w-5 min-w-5" />
            {!isCollapsed && <span className="ml-3">Update Information</span>}
          </Link>
          <Link
            href={`${basePath}/settings`}
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
                href={`${basePath}`}
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${isActive("")}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </Link>
              <Link
                href={`${basePath}/profile`}
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${isActive("/profile")}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="h-5 w-5 mr-3" />
                Profile
              </Link>
              <Link
                href={`${basePath}/chats`}
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${isActive("/chats")}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <MessageSquare className="h-5 w-5 mr-3" />
                Chats
              </Link>
              <Link
                href={`${basePath}/portal`}
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${isActive("/portal")}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Layout className="h-5 w-5 mr-3" />
                Portal
              </Link>
              <Link
                href={`${basePath}/documents`}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${isActive("/documents")}`}
              >
                <FileText className="h-5 w-5 mr-3" />
                Upload Documents
              </Link>
              <Link
                href={`${basePath}/update-info`}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${isActive("/update-info")}`}
              >
                <PencilLine className="h-5 w-5 mr-3" />
                Update Information
              </Link>
              <Link
                href={`${basePath}/settings`}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${isActive("/settings")}`}
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