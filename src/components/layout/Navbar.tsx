"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
            <Link href="/" className="text-gray-900 hover:text-primary font-medium">
              Home
            </Link>
            <Link href="/news" className="text-gray-900 hover:text-primary font-medium">
              News
            </Link>
            <Link href="/about" className="text-gray-900 hover:text-primary font-medium">
              About Us
            </Link>
            <Link href="/contact" className="text-gray-900 hover:text-primary font-medium">
              Contact Us
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle menu"
              onClick={toggleMenu}
              className="text-gray-900"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50"
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link 
              href="/news" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50"
              onClick={toggleMenu}
            >
              News
            </Link>
            <Link 
              href="/about" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50"
              onClick={toggleMenu}
            >
              About Us
            </Link>
            <Link 
              href="/contact" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50"
              onClick={toggleMenu}
            >
              Contact Us
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 