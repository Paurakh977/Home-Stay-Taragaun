'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWebContent } from "@/context/WebContentContext";
import { getImageUrl, shouldUseUnoptimizedImage } from "@/lib/imageUtils";
import TranslateButton from "@/components/ui/translate-button";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PlatformNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { content, loading, refreshContent } = useWebContent();
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

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
  
  // Force refresh of content after load to ensure we have the latest data
  useEffect(() => {
    if (!loading && content) {
      // If content is loaded but we want to make sure we have fresh data
      const refreshTimer = setTimeout(() => {
        refreshContent();
      }, 1000);
      
      return () => clearTimeout(refreshTimer);
    }
  }, [loading, content, refreshContent]);

  // Get the logo URL with cache busting
  const logoUrl = getImageUrl(siteInfo.logoPath);
  const useUnoptimized = shouldUseUnoptimizedImage(siteInfo.logoPath);

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    // Redirect to home page after sign out
    window.location.href = '/';
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!isLoaded || !isSignedIn || !user) return "U";
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`;
    } else if (firstName) {
      return firstName[0];
    } else if (user.emailAddresses && user.emailAddresses.length > 0) {
      return user.emailAddresses[0].emailAddress[0].toUpperCase();
    }
    
    return "U";
  };

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
                src={logoUrl}
                alt={siteInfo.siteName} 
                width={48}
                height={48}
                className="object-contain"
                unoptimized={useUnoptimized}
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
            
            {/* Translate Button */}
            <TranslateButton variant="ghost" />
            
            {/* User Profile / Auth Buttons */}
            {isLoaded && isSignedIn && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 pl-2 pr-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
                      <AvatarFallback className="bg-[#183636] text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:inline-block">
                      {user.firstName || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || "User"}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium text-gray-900">
                    {user.fullName || user.emailAddresses?.[0]?.emailAddress || "User"}
                  </div>
                  <div className="px-2 py-1 text-xs text-gray-500 truncate">
                    {user.emailAddresses?.[0]?.emailAddress}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600 flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button className="bg-[#183636] hover:bg-[#1c4141]" asChild>
                  <Link href="/sign-up">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {/* Translate Button (Mobile) */}
            <TranslateButton variant="ghost" size="sm" className="mr-2" />
            
            {/* User Profile for Mobile */}
            {isLoaded && isSignedIn && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="mr-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
                      <AvatarFallback className="bg-[#183636] text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium text-gray-900">
                    {user.fullName || user.emailAddresses?.[0]?.emailAddress || "User"}
                  </div>
                  <div className="px-2 py-1 text-xs text-gray-500 truncate">
                    {user.emailAddresses?.[0]?.emailAddress}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600 flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" asChild className="mr-2">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
            
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
            
            {/* Auth buttons for mobile menu */}
            {isLoaded && !isSignedIn && (
              <>
                <Link
                  href="/sign-in"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="block px-3 py-2 rounded-md text-base font-medium bg-[#183636] text-white hover:bg-[#1c4141]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default PlatformNavbar; 