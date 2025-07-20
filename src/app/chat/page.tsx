'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Search, ChevronDown, Paperclip, Smile } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PlatformNavbar from '@/components/platform/PlatformNavbar';

// Dummy chat data
const dummyChats = [
  {
    id: "1",
    name: "Alex Johnson",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMessage: "Hey, how's your stay going?",
    time: "5m",
    unread: true,
    online: true,
  },
  {
    id: "2",
    name: "Emma Wilson",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMessage: "The local festival is tomorrow!",
    time: "30m",
    unread: true,
    online: false,
  },
  {
    id: "3",
    name: "Michael Chen",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMessage: "I'll send you directions to the cafe.",
    time: "2h",
    unread: true,
    online: true,
  },
  {
    id: "4",
    name: "Sarah Lopez",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMessage: "Did you enjoy the local food?",
    time: "5h",
    unread: false,
    online: false,
  },
  {
    id: "5",
    name: "David Kim",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMessage: "Checking in about your reservation.",
    time: "1d",
    unread: false,
    online: false,
  },
  {
    id: "6",
    name: "Lisa Wang",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMessage: "I loved the cooking class recommendation!",
    time: "2d",
    unread: false,
    online: false,
  },
  {
    id: "7",
    name: "John Davis",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    lastMessage: "When does the trek start tomorrow?",
    time: "3d",
    unread: false,
    online: true,
  },
];

// Dummy messages data
const dummyMessages = [
  {
    id: "1",
    sender: "Alex Johnson",
    senderAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    content: "Hey, how's your stay going?",
    timestamp: "10:30 AM",
    isSelf: false,
  },
  {
    id: "2",
    sender: "You",
    content: "It's great! I'm enjoying the local cuisine a lot.",
    timestamp: "10:32 AM",
    isSelf: true,
  },
  {
    id: "3",
    sender: "Alex Johnson",
    senderAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    content: "That's awesome! Have you tried the local specialty dish yet?",
    timestamp: "10:33 AM",
    isSelf: false,
  },
  {
    id: "4",
    sender: "You",
    content: "Not yet, but it's on my list. Any specific recommendations?",
    timestamp: "10:35 AM",
    isSelf: true,
  },
  {
    id: "5",
    sender: "Alex Johnson",
    senderAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    content: "You should definitely try 'momos' from the small shop near the market. They're amazing! Also, there's a local festival happening tomorrow if you're interested.",
    timestamp: "10:40 AM",
    isSelf: false,
  },
  {
    id: "6",
    sender: "You",
    content: "That sounds perfect! What time does the festival start?",
    timestamp: "10:42 AM",
    isSelf: true,
  },
  {
    id: "7",
    sender: "Alex Johnson",
    senderAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    content: "It starts around 4 PM and goes until late night. There will be traditional dances and food stalls. I can send you the exact location if you want.",
    timestamp: "10:45 AM",
    isSelf: false,
  },
  {
    id: "8", 
    sender: "You",
    content: "That sounds perfect! I would love to attend. Could you send me the location?",
    timestamp: "10:48 AM",
    isSelf: true,
  },
  {
    id: "9",
    sender: "Alex Johnson",
    senderAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    content: "Sure! Here's the location: Town Square near the central market. It's about a 15-minute walk from your homestay. You can't miss it - there will be decorations and music!",
    timestamp: "10:50 AM",
    isSelf: false,
  },
  {
    id: "10",
    sender: "You",
    content: "Thanks for the information! I'm looking forward to experiencing the local culture.",
    timestamp: "10:52 AM",
    isSelf: true,
  },
  {
    id: "11",
    sender: "Alex Johnson",
    senderAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    content: "You're welcome! Let me know if you need any other recommendations during your stay. I'm happy to help!",
    timestamp: "10:55 AM",
    isSelf: false,
  }
];

const ChatPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const chatId = searchParams.get('id');
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);
  const [message, setMessage] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [navbarHeight, setNavbarHeight] = useState(80); // Default height

  // Find the current chat from the dummy data
  const currentChat = dummyChats.find(chat => chat.id === currentChatId) || dummyChats[0];

  // Scroll to bottom of messages when chat changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentChatId, dummyMessages]);

  // Set initial chat ID if none is selected
  useEffect(() => {
    if (!currentChatId && dummyChats.length > 0) {
      setCurrentChatId(dummyChats[0].id);
    }
  }, [currentChatId]);

  // Update sidebar state and current chat ID based on URL
  useEffect(() => {
    // When URL has chatId parameter, update currentChatId and hide sidebar on mobile
    if (chatId) {
      setCurrentChatId(chatId);
      setIsMobileSidebarOpen(false);
    } else if (window.innerWidth < 768) {
      // Only show sidebar on mobile when no specific chat is selected
      setIsMobileSidebarOpen(true);
    }
  }, [chatId]);
  
  // Ensure we handle route changes correctly when browser navigation occurs
  useEffect(() => {
    if (chatId && currentChatId !== chatId) {
      setCurrentChatId(chatId);
    }
  }, [pathname, chatId, currentChatId]);

  // Measure navbar height for proper spacing
  useEffect(() => {
    const measureNavbar = () => {
      const navbarElement = document.querySelector('nav');
      if (navbarElement) {
        setNavbarHeight(navbarElement.offsetHeight);
      }
    };
    
    // Measure on load and on resize
    measureNavbar();
    window.addEventListener('resize', measureNavbar);
    
    return () => window.removeEventListener('resize', measureNavbar);
  }, []);

  // Filter chats based on search query
  const filteredChats = dummyChats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // In a real application, you'd send this to an API
    console.log('Sending message:', message);
    setMessage('');
    
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle back button click
  const handleBackClick = () => {
    // When in a specific chat on mobile, go back to the chat list view
    if (currentChatId) {
      router.push('/chat');
      // Don't reset currentChatId here as it will be handled by the useEffect when URL changes
    }
  };

  // Handle close button click
  const handleCloseClick = () => {
    // Always go back to home page when clicking Close
    router.push('/');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Fixed navbar at the very top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <PlatformNavbar />
      </div>
      
      {/* Chat container - takes remaining height and accounts for navbar */}
      <div 
        className="flex flex-1 overflow-hidden" 
        style={{ paddingTop: `${navbarHeight}px` }}
      >
        {/* Chat Sidebar */}
        <div className={`w-full md:w-80 border-r border-gray-200 bg-white flex flex-col ${
          isMobileSidebarOpen ? 'fixed inset-0 z-40' : 'hidden md:flex'
        }`} style={{ top: `${navbarHeight}px` }}>
          {/* Sidebar Header - Fixed */}
          <div className="flex-none p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-800 mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search conversations" 
                className="pl-9 py-2 bg-gray-50 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Chat List - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length > 0 ? (
              filteredChats.map(chat => (
                <button 
                  key={chat.id}
                  className={`w-full px-4 py-3 flex items-start hover:bg-gray-50 transition-colors ${
                    currentChatId === chat.id ? 'bg-gray-50' : ''
                  }`}
                  onClick={() => {
                    setCurrentChatId(chat.id);
                    router.push(`/chat?id=${chat.id}`);
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <div className="relative mr-3 flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={chat.avatar} alt={chat.name} />
                      <AvatarFallback className="bg-gray-200 text-gray-600">
                        {chat.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {chat.online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                    {chat.unread && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {chat.unread ? '1' : ''}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
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
            ) : (
              <div className="p-4 text-center text-gray-500">
                No conversations found.
              </div>
            )}
          </div>
          
          {/* Close button for mobile - redirect to home */}
          <div className="flex-none md:hidden p-4 border-t">
            <Button 
              onClick={handleCloseClick}
              variant="ghost" 
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full z-20">
          {/* Chat Header - Fixed */}
          {currentChatId && (
            <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white z-30 sticky top-0">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mr-2 md:hidden"
                  onClick={handleBackClick}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <div className="flex items-center">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={currentChat?.avatar} alt={currentChat?.name} />
                      <AvatarFallback className="bg-gray-200 text-gray-600">
                        {currentChat?.name?.substring(0, 2).toUpperCase() || "CH"}
                      </AvatarFallback>
                    </Avatar>
                    {currentChat?.online && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900">{currentChat?.name}</h3>
                    <p className="text-xs text-gray-500">
                      {currentChat?.online ? 'Online' : 'Last active 2h ago'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Message Content Area - Updated to ensure proper display on mobile */}
          {currentChatId ? (
            <div className="flex flex-col h-full">
              {/* Messages Area - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="max-w-3xl mx-auto">
                  {/* Date separator */}
                  <div className="flex justify-center my-4">
                    <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                      Today
                    </div>
                  </div>
                  
                  {/* Messages */}
                  {dummyMessages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`flex mb-4 ${msg.isSelf ? 'justify-end' : 'justify-start'}`}
                    >
                      {!msg.isSelf && (
                        <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                          <AvatarImage src={msg.senderAvatar} alt={msg.sender} />
                          <AvatarFallback className="bg-gray-200 text-gray-600">
                            {msg.sender.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[75%] ${msg.isSelf ? 'order-2' : 'order-1'}`}>
                        <div 
                          className={`px-4 py-2 rounded-lg ${
                            msg.isSelf 
                              ? 'bg-[#183636] text-white rounded-br-none' 
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <div className={`mt-1 text-xs text-gray-500 ${msg.isSelf ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              {/* Message Input - Fixed */}
              <div className="flex-none p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    className="text-gray-500 flex-shrink-0"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  
                  <div className="relative flex-1">
                    <Input 
                      type="text" 
                      placeholder="Type a message..."
                      className="pr-10 py-5"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={!message.trim()}
                    className="bg-[#183636] hover:bg-[#1c4141] text-white rounded-full h-10 w-10 flex-shrink-0 p-0"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            // Show messages list on mobile (not the empty state)
            <div className="flex-1 md:hidden">
              {!isMobileSidebarOpen && (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center p-6">
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Select a conversation</h3>
                    <p className="text-sm text-gray-500 mb-4">Choose from your conversations list to start chatting</p>
                    <Button 
                      onClick={() => setIsMobileSidebarOpen(true)}
                      className="bg-[#183636] hover:bg-[#1c4141] text-white"
                    >
                      View Conversations
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;