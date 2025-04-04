"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
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
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                HH
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Hamro Home Stay</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`group font-medium px-3 py-5 transition-all duration-300 ease-in-out ${
                isActive('/') ? 'text-primary' : 'text-gray-700'
              }`}
            >
              <div className="relative">
                <span className="group-hover:text-primary">Home</span>
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-primary transform transition-transform duration-300 ease-in-out ${
                  isActive('/') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}></span>
              </div>
            </Link>
            <Link 
              href="/news" 
              className={`group font-medium px-3 py-5 transition-all duration-300 ease-in-out ${
                isActive('/news') ? 'text-primary' : 'text-gray-700'
              }`}
            >
              <div className="relative">
                <span className="group-hover:text-primary">News</span>
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-primary transform transition-transform duration-300 ease-in-out ${
                  isActive('/news') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}></span>
              </div>
            </Link>
            <Link 
              href="/about" 
              className={`group font-medium px-3 py-5 transition-all duration-300 ease-in-out ${
                isActive('/about') ? 'text-primary' : 'text-gray-700'
              }`}
            >
              <div className="relative">
                <span className="group-hover:text-primary">About Us</span>
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-primary transform transition-transform duration-300 ease-in-out ${
                  isActive('/about') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}></span>
              </div>
            </Link>
            <Link 
              href="/contact" 
              className={`group font-medium px-3 py-5 transition-all duration-300 ease-in-out ${
                isActive('/contact') ? 'text-primary' : 'text-gray-700'
              }`}
            >
              <div className="relative">
                <span className="group-hover:text-primary">Contact Us</span>
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-primary transform transition-transform duration-300 ease-in-out ${
                  isActive('/contact') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}></span>
              </div>
            </Link>
            
            {/* Register Home Stay Button */}
            <Link href="/register" className="ml-6">
              <button 
                className={`bg-primary text-white px-4 py-2 rounded-md text-sm font-medium transition-all hover:bg-primary/90 whitespace-nowrap shadow-md hover:shadow-lg cursor-pointer ${
                  !hasEntered ? 'animate-entrance' : isVibrating ? 'animate-vibrate' : ''
                }`}
              >
                Register Home Stay
              </button>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Register Home Stay Button (Mobile) */}
            <Link href="/register">
              <button 
                className={`bg-primary text-white px-2 py-1 rounded-md text-xs font-medium transition-all hover:bg-primary/90 whitespace-nowrap shadow-sm hover:shadow-md cursor-pointer ${
                  !hasEntered ? 'animate-entrance' : isVibrating ? 'animate-vibrate' : ''
                }`}
              >
                Register
              </button>
            </Link>
            
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle menu"
              onClick={toggleMenu}
              className="text-gray-900 ml-1"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                isActive('/') 
                  ? 'text-primary border-l-4 border-primary bg-orange-50 pl-2' 
                  : 'text-gray-700 hover:bg-orange-50 hover:text-primary'
              }`}
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link 
              href="/news" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                isActive('/news') 
                  ? 'text-primary border-l-4 border-primary bg-orange-50 pl-2' 
                  : 'text-gray-700 hover:bg-orange-50 hover:text-primary'
              }`}
              onClick={toggleMenu}
            >
              News
            </Link>
            <Link 
              href="/about" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                isActive('/about') 
                  ? 'text-primary border-l-4 border-primary bg-orange-50 pl-2' 
                  : 'text-gray-700 hover:bg-orange-50 hover:text-primary'
              }`}
              onClick={toggleMenu}
            >
              About Us
            </Link>
            <Link 
              href="/contact" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                isActive('/contact') 
                  ? 'text-primary border-l-4 border-primary bg-orange-50 pl-2' 
                  : 'text-gray-700 hover:bg-orange-50 hover:text-primary'
              }`}
              onClick={toggleMenu}
            >
              Contact Us
            </Link>
            
            {/* Register Home Stay Button in Mobile Menu */}
            <div className="mt-4 px-3">
              <Link 
                href="/register" 
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
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 