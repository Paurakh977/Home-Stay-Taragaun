'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWebContent } from "@/context/WebContentContext";

const PlatformNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { content, loading } = useWebContent();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Use fallback navigation links if content is still loading
  const defaultNavLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Explore Homestays', path: '/homestays' },
    { name: 'Contact', path: '/contact' },
  ];

  // Get navigation links from content or use default
  const navLinks = loading || !content?.navigation?.links 
    ? defaultNavLinks 
    : content.navigation.links.sort((a: any, b: any) => a.order - b.order);

  // Get site info
  const siteInfo = loading || !content?.siteInfo
    ? {
        siteName: "Nepal StayLink",
        tagline: "Your Gateway to Authentic Homestays",
        logoPath: "/Logo.png"
      }
    : content.siteInfo;

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      isScrolled ? "bg-white/95 backdrop-blur-sm shadow-md" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <div className="relative h-12 w-12 mr-3 overflow-hidden rounded-full bg-white shadow-sm">
              <Image 
                src={siteInfo.logoPath} 
                alt={siteInfo.siteName} 
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-800">{siteInfo.siteName}</span>
              <span className="text-xs text-gray-500">{siteInfo.tagline}</span>
            </div>
          </Link>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link: any) => (
              <Link
                key={link.path}
                href={link.path}
                className={`group font-medium px-3 py-5 transition-all duration-300 ease-in-out ${
                  pathname === link.path 
                    ? 'text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="relative">
                  <span>{link.name}</span>
                  <span className={`absolute -bottom-1 left-0 w-full h-[2px] bg-gray-900 transform transition-transform duration-300 ease-in-out ${
                    pathname === link.path ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}></span>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle menu"
              onClick={toggleMenu}
              className="text-gray-700"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white absolute top-20 left-0 right-0 shadow-lg z-50">
          <div className="px-4 pt-2 pb-4 space-y-3">
            {navLinks.map((link: any) => (
              <Link
                key={link.path}
                href={link.path}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-all ${
                  pathname === link.path 
                    ? 'text-gray-900 border-l-2 border-gray-900 bg-gray-50 pl-2' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default PlatformNavbar; 