"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserInfo {
  homestayId: string;
  homeStayName: string;
}

interface NavbarProps {
  adminUsername?: string;
}

const Navbar = ({ adminUsername }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Prevent Navbar rendering on superadmin pages
  if (pathname.startsWith('/superadmin')) {
    return null;
  }

  // Check authentication status when component mounts and pathname changes
  useEffect(() => {
    const checkAuth = () => {
      const userJson = localStorage.getItem("user");
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          setUser(userData);
        } catch (err) {
          console.error("Error parsing user data:", err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkAuth();

    // Start vibration after entrance animation completes
    const entranceTimer = setTimeout(() => {
      setHasEntered(true);
      
      const interval = setInterval(() => {
        setIsVibrating(true);
        setTimeout(() => setIsVibrating(false), 600);
      }, 3000);
      
      return () => clearInterval(interval);
    }, 3500); // Wait until entrance animation completes
    
    return () => clearTimeout(entranceTimer);
  }, [pathname]); // Re-check auth when pathname changes

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleDashboardClick = () => {
    if (!user) {
      router.push("/login");
    }
  };

  const handleLogout = async () => {
    try {
      // Clear user from localStorage
      localStorage.removeItem("user");

      // Call logout API to clear the cookie
      // If we're in an admin route, use the adminUsername parameter
      const logoutUrl = adminUsername 
        ? `/api/auth/logout?adminUsername=${adminUsername}`
        : "/api/auth/logout";
        
      await fetch(logoutUrl, {
        method: "POST",
      });

      // Update state
      setUser(null);

      // Close menu if open
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }

      // Redirect to the appropriate home page
      if (adminUsername) {
        router.push(`/${adminUsername}`);
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Error during logout:", err);
      // Still redirect on error
      if (adminUsername) {
        router.push(`/${adminUsername}`);
      } else {
        router.push("/");
      }
    }
  };

  const baseHref = adminUsername ? `/${adminUsername}` : '';
  
  const routes = [
    { name: 'Home', path: baseHref || '/' },
    { name: 'Homestays', path: `${baseHref}/homestays` },
    { name: 'About', path: `${baseHref}/about` },
    { name: 'Contact', path: `${baseHref}/contact` },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={baseHref || '/'} className="flex-shrink-0 flex items-center">
              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                HH
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 truncate max-w-[140px] sm:max-w-none">Hamro Home Stay</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            {routes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className={`group font-medium px-3 py-5 transition-all duration-300 ease-in-out ${
                  pathname === route.path 
                    ? 'text-primary' 
                    : 'text-gray-700'
                }`}
              >
                <div className="relative">
                  <span className="group-hover:text-primary">{route.name}</span>
                  <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-primary transform transition-transform duration-300 ease-in-out ${
                    pathname === route.path ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}></span>
                </div>
              </Link>
            ))}
            
            {/* Dashboard Link */}
            <Link 
              href={user ? `${adminUsername ? `/${adminUsername}` : ""}/dashboard` : `${adminUsername ? `/${adminUsername}` : ""}/login`}
              onClick={handleDashboardClick}
              className={`group font-medium px-3 py-5 transition-all duration-300 ease-in-out ${
                pathname.includes('/dashboard') ? 'text-primary' : 'text-gray-700'
              }`}
            >
              <div className="relative">
                <span className="group-hover:text-primary">Dashboard</span>
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-primary transform transition-transform duration-300 ease-in-out ${
                  pathname.includes('/dashboard') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}></span>
              </div>
            </Link>
            
            {/* Register Home Stay Button */}
            <Link href={`${adminUsername ? `/${adminUsername}` : ""}/register`} className="ml-3">
              <button 
                className={`bg-primary text-white px-4 py-2 rounded-md text-sm font-medium transition-all hover:bg-primary/90 whitespace-nowrap shadow-md hover:shadow-lg cursor-pointer ${
                  !hasEntered ? 'animate-entrance' : isVibrating ? 'animate-vibrate' : ''
                }`}
              >
                Register Home Stay
              </button>
            </Link>
            
            {/* Login/Logout Button */}
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-700 hover:text-red-600 text-sm font-medium transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            ) : (
              <Link href={`${adminUsername ? `/${adminUsername}` : ""}/login`}>
                <span className="flex items-center text-primary hover:text-primary-dark text-sm font-medium transition-colors cursor-pointer">
                  <LogIn className="h-4 w-4 mr-1" />
                  Login
                </span>
              </Link>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <div className="flex space-x-1 mr-1">
              {/* Login/Logout Button (Mobile) */}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="text-red-600 px-2 py-1 rounded-md text-xs font-medium hover:bg-red-50 whitespace-nowrap"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              ) : (
                <Link href={`${adminUsername ? `/${adminUsername}` : ""}/login`}>
                  <button
                    className="text-primary px-2 py-1 rounded-md text-xs font-medium hover:bg-primary/10 whitespace-nowrap"
                  >
                    <LogIn className="h-4 w-4" />
                  </button>
                </Link>
              )}
              
              {/* Register Home Stay Button (Mobile) */}
              <Link href={`${adminUsername ? `/${adminUsername}` : ""}/register`}>
                <button 
                  className={`bg-primary text-white px-2 py-1 rounded-md text-xs font-medium transition-all hover:bg-primary/90 whitespace-nowrap shadow-sm hover:shadow-md cursor-pointer ${
                    !hasEntered ? 'animate-entrance' : isVibrating ? 'animate-vibrate' : ''
                  }`}
                >
                  Register
                </button>
              </Link>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle menu"
              onClick={toggleMenu}
              className="text-gray-900"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white absolute top-16 left-0 right-0 shadow-lg z-50">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {routes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                  pathname === route.path 
                    ? 'text-primary border-l-4 border-primary bg-orange-50 pl-2' 
                    : 'text-gray-700 hover:bg-orange-50 hover:text-primary'
                }`}
                onClick={() => {
                  toggleMenu();
                  if (route.path === "/login" && !user) {
                    router.push("/login");
                  }
                }}
              >
                {route.name}
              </Link>
            ))}
            
            {/* Dashboard Link in Mobile Menu */}
            <Link 
              href={user ? `${adminUsername ? `/${adminUsername}` : ""}/dashboard` : `${adminUsername ? `/${adminUsername}` : ""}/login`}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                pathname.includes('/dashboard') 
                  ? 'text-primary border-l-4 border-primary bg-orange-50 pl-2' 
                  : 'text-gray-700 hover:bg-orange-50 hover:text-primary'
              }`}
              onClick={() => {
                toggleMenu();
                if (!user) {
                  router.push(`${adminUsername ? `/${adminUsername}` : ""}/login`);
                }
              }}
            >
              Dashboard
            </Link>
            
            {/* Register Home Stay Button in Mobile Menu */}
            <div className="mt-4 px-3">
              <Link 
                href={`${adminUsername ? `/${adminUsername}` : ""}/register`} 
                className="block"
                onClick={toggleMenu}
              >
                <button 
                  className={`w-full bg-primary text-white py-2 px-4 rounded-md text-base font-medium transition-all hover:bg-primary/90 shadow-sm hover:shadow-md cursor-pointer ${
                    !hasEntered ? 'animate-entrance' : isVibrating ? 'animate-vibrate' : ''
                  }`}
                >
                  Register Home Stay
                </button>
              </Link>
            </div>
            
            {/* Login/Logout Button in Mobile Menu */}
            <div className="mt-2 px-3">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full justify-center py-2 px-4 border border-red-300 text-red-600 rounded-md text-base font-medium hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </button>
              ) : (
                <Link
                  href={`${adminUsername ? `/${adminUsername}` : ""}/login`}
                  className="block"
                  onClick={toggleMenu}
                >
                  <button className="flex items-center w-full justify-center py-2 px-4 border border-primary text-primary rounded-md text-base font-medium hover:bg-primary/10">
                    <LogIn className="h-5 w-5 mr-2" />
                    Login
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 