'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, User, LogOut, ChevronDown, MessageCircle, Bell } from "lucide-react";
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
import { useChat } from "@/context/ChatContext";
import { useAuthToken } from "@/hooks/useAuthToken";

const PlatformNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  // Get chat data from context
  const { conversations } = useChat();
  const authData = useAuthToken();
  const pathname = usePathname();
  const router = useRouter();
  const { content, loading, refreshContent } = useWebContent();
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const chatModalRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside chat modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatModalRef.current && !chatModalRef.current.contains(event.target as Node)) {
        setShowChatModal(false);
      }
    };

    if (showChatModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChatModal]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleChatModal = () => {
    setShowChatModal(!showChatModal);
  };

  // Helper function to format time
  const formatTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

      if (diffInMinutes < 1) return 'now';
      if (diffInMinutes < 60) return `${diffInMinutes}m`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
      return `${Math.floor(diffInMinutes / 1440)}d`;
    } catch {
      return '';
    }
  };

  // Convert conversations to chat items for display
  const chatItems = conversations.map(conv => {
    // Find the other participant (not the current user)
    const otherParticipant = conv.participants.find(p =>
      authData && p.userId !== authData.userId
    );

    return {
      id: conv.chatId,
      name: otherParticipant?.name || otherParticipant?.username || 'Unknown User',
      avatar: otherParticipant?.avatar || '',
      lastMessage: conv.lastMessage?.content || 'No messages yet',
      time: formatTime(conv.lastActivity),
      unread: (conv.unreadCount || 0) > 0
    };
  });

  // Calculate unread message count
  const unreadMessageCount = chatItems.filter(chat => chat.unread).length;

  // Navigate to chat view
  const goToChatView = (chatId?: string) => {
    if (chatId) {
      // When clicking on a specific chat, use router instead of window.location
      router.push(`/chat?id=${chatId}`);
    } else {
      // When clicking "See All in Chat View", just go to the main chat page
      router.push('/chat');
    }
    setShowChatModal(false);
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

  // Don't show chat UI in the chat page itself
  const isInChatPage = pathname?.startsWith('/chat') || false;

  return (
    <nav className={`sticky top-0 z-30 w-full transition-all duration-300 ${
      isScrolled ? "bg-white/95 backdrop-blur-sm shadow-md" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 mr-2 sm:mr-3 overflow-hidden rounded-full bg-white shadow-sm">
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
              <span className="text-lg sm:text-xl font-bold text-gray-800">{siteInfo.siteName}</span>
              <span className="text-xs text-gray-500 hidden xs:block">{siteInfo.tagline}</span>
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
                  <Button variant="ghost" className="flex items-center space-x-2 pl-2 pr-3 relative">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
                        <AvatarFallback className="bg-[#183636] text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Notification badge */}
                      {!isInChatPage && unreadMessageCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadMessageCount}
                        </span>
                      )}
                    </div>
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
                  <DropdownMenuItem onClick={toggleChatModal} className="cursor-pointer flex items-center relative">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                    {!isInChatPage && unreadMessageCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadMessageCount}
                      </span>
                    )}
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
          
          {/* Mobile menu button - IMPROVED SPACING */}
          <div className="md:hidden flex items-center">
            {/* Translate Button (Mobile) - Better spacing */}
            <div className="mr-2">
              <TranslateButton 
                variant="ghost" 
                size="sm" 
                className="h-9 w-9 p-2 rounded-full hover:bg-gray-100"
              />
            </div>
            
            {/* User Profile for Mobile - Better spacing */}
            {isLoaded && isSignedIn && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mr-2 h-9 w-9 p-1.5 rounded-full hover:bg-gray-100 relative"
                  >
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
                      <AvatarFallback className="bg-[#183636] text-white text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Mobile notification badge */}
                    {!isInChatPage && unreadMessageCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                        {unreadMessageCount}
                      </span>
                    )}
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
                  <DropdownMenuItem onClick={toggleChatModal} className="cursor-pointer flex items-center relative">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                    {!isInChatPage && unreadMessageCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadMessageCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600 flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                asChild 
                className="mr-2 px-3 py-1.5 hover:bg-gray-100"
              >
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
            
            {/* Hamburger menu button - Better spacing */}
            <Button
              variant="ghost"
              size="sm"
              aria-label="Toggle menu"
              onClick={toggleMenu}
              className="text-gray-700 h-9 w-9 p-1.5 rounded-full hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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

      {/* Chat Modal - Now showing ALL chats, scrollable */}
      {showChatModal && isSignedIn && (
        <div className="fixed top-20 right-4 md:right-8 z-50 w-[calc(100%-32px)] sm:max-w-[360px] bg-white rounded-xl shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200" ref={chatModalRef}>
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-medium text-lg text-gray-800">Messages</h3>
            <button 
              onClick={toggleChatModal}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-auto max-h-[60vh] sm:max-h-[400px]">
            {chatItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Start chatting with homestays to see them here</p>
              </div>
            ) : (
              chatItems.map(chat => (
              <button 
                key={chat.id}
                className="w-full px-4 py-3 flex items-start hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                onClick={() => goToChatView(chat.id)}
              >
                <div className="relative mr-3 flex-shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={chat.avatar} alt={chat.name} />
                    <AvatarFallback className="bg-gray-200 text-gray-600">
                      {chat.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {chat.unread && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-medium text-gray-900 truncate">{chat.name}</h4>
                    <span className="text-xs text-gray-500 ml-1 flex-shrink-0">{chat.time}</span>
                  </div>
                  <p className={`text-sm ${chat.unread ? 'text-gray-800 font-medium' : 'text-gray-500'} truncate`}>
                    {chat.lastMessage}
                  </p>
                </div>
              </button>
              ))
            )}
          </div>

          <div className="p-3 border-t">
            <Button
              onClick={() => goToChatView()}
              className="w-full bg-[#183636] hover:bg-[#1c4141] text-white py-2 px-4 rounded-lg text-sm font-medium flex justify-center items-center"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              <span>See All in Chat View</span>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default PlatformNavbar; 