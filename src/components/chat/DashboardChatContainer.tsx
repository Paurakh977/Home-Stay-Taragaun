import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardChatSidebar from './DashboardChatSidebar';
import ChatMessages from './ChatMessages';
import MessageInput from './MessageInput';
import DashboardEmptyChat from './DashboardEmptyChat';
import { dummyChats, dummyMessages } from './ChatData';
import { X } from 'lucide-react';

interface DashboardChatContainerProps {
  navbarHeight: number;
  adminUsername?: string;
}

// Client component to safely use searchParams
function ClientChatContainer({ 
  navbarHeight, 
  adminUsername 
}: DashboardChatContainerProps) {
  "use client";
  
  // This will only run on the client side
  const { useSearchParams } = require('next/navigation');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const chatId = searchParams.get('id');

  return (
    <DashboardChatContainerInner
      navbarHeight={navbarHeight}
      adminUsername={adminUsername}
      chatId={chatId}
      router={router}
      pathname={pathname}
    />
  );
}

interface DashboardChatContainerInnerProps extends DashboardChatContainerProps {
  chatId: string | null;
  router: ReturnType<typeof useRouter>;
  pathname: string;
}

function DashboardChatContainerInner({ 
  navbarHeight, 
  adminUsername,
  chatId,
  router,
  pathname
}: DashboardChatContainerInnerProps) {
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const initialRenderDone = useRef(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);

  // Calculate base path for routing
  const basePath = adminUsername ? `/${adminUsername}/dashboard/chat` : '/dashboard/chat';
  const dashboardPath = adminUsername ? `/${adminUsername}/dashboard` : '/dashboard';

  // Find the current chat from the dummy data
  const currentChat = dummyChats.find(chat => chat.id === currentChatId);

  // Set up mobile detection
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Only show sidebar on mobile if no chat is selected
      setIsMobileSidebarOpen(mobile && !currentChatId);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [currentChatId]);

  // Set initial chat ID if none is selected for desktop view
  useEffect(() => {
    if (!initialRenderDone.current) {
      initialRenderDone.current = true;
      
      // Only set default chat on desktop and when there's no chatId in URL
      if (!currentChatId && dummyChats.length > 0 && !isMobile) {
        setCurrentChatId(dummyChats[0].id);
        
        // Update URL without page navigation
        const url = new URL(window.location.href);
        url.searchParams.set('id', dummyChats[0].id);
        window.history.replaceState({}, '', url);
      }
    }
  }, [currentChatId, isMobile]);

  // Update sidebar state and current chat ID based on URL
  useEffect(() => {
    // When URL has chatId parameter, update currentChatId and hide sidebar on mobile
    if (chatId) {
      setCurrentChatId(chatId);
      setIsMobileSidebarOpen(false);
      // Flag to scroll to bottom when chat changes
      setShouldScrollToBottom(true);
    } else if (isMobile) {
      // Only show sidebar on mobile when no specific chat is selected
      setIsMobileSidebarOpen(true);
    }
  }, [chatId, isMobile]);
  
  // Ensure we handle route changes correctly when browser navigation occurs
  useEffect(() => {
    if (chatId && currentChatId !== chatId) {
      setCurrentChatId(chatId);
      setShouldScrollToBottom(true);
    }
  }, [pathname, chatId, currentChatId]);

  // Handle scrolling of messages
  useEffect(() => {
    if (messagesContainerRef.current && shouldScrollToBottom) {
      // Scroll to bottom only for new messages or chat change
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      setShouldScrollToBottom(false);
    }
  }, [shouldScrollToBottom, currentChatId]);

  // Prevent scroll propagation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // If the wheel event is within the messages container
      if (messagesContainerRef.current && messagesContainerRef.current.contains(e.target as Node)) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight;
        const isScrolledToTop = scrollTop <= 0;
        
        // If trying to scroll down and already at bottom, or trying to scroll up and already at top
        if ((e.deltaY > 0 && isScrolledToBottom) || (e.deltaY < 0 && isScrolledToTop)) {
          e.preventDefault();
        }
      }
    };
    
    // Add wheel event listener with passive: false to allow preventDefault
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Handle chat selection
  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    setIsMobileSidebarOpen(false);
    setShouldScrollToBottom(true);
    
    // Update URL with chat ID using the basePath to stay in dashboard context
    router.push(`${basePath}?id=${chatId}`);
  };

  // Handle search change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Handle back button click
  const handleBackClick = () => {
    // When in a specific chat on mobile, go back to the chat list view
    // Stay in dashboard context
    router.push(basePath);
  };

  // Handle close button click
  const handleCloseClick = () => {
    // Go back to dashboard instead of home page
    router.push(dashboardPath);
  };

  // Handle send message
  const handleSendMessage = (message: string) => {
    // In a real application, you'd send this to an API
    console.log('Sending message:', message);
    // Scroll to bottom after sending a message
    setShouldScrollToBottom(true);
  };

  // Determine if we need to show the empty state or a default chat header
  const showEmptyState = !currentChatId && isMobile;
  const showDefaultHeader = !currentChatId && !isMobile;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Chat Sidebar - using Dashboard specific version */}
      <DashboardChatSidebar
        chats={dummyChats}
        currentChatId={currentChatId}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onChatSelect={handleChatSelect}
        onClose={handleCloseClick}
        isMobileSidebarOpen={isMobileSidebarOpen}
        basePath={basePath}
      />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Header with Custom Close Button for Dashboard */}
        {currentChat ? (
          <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-gray-200 bg-white z-10">
            <div className="flex items-center">
              <button
                onClick={handleBackClick}
                className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 mr-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center">
                {currentChat.avatar ? (
                  <div className="h-9 w-9 rounded-full overflow-hidden mr-3">
                    <img 
                      src={currentChat.avatar} 
                      alt={currentChat.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center mr-3">
                    {currentChat.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-sm font-medium text-gray-900">{currentChat.name}</h2>
                  <p className="text-xs text-gray-500">
                    {currentChat.online ? 'Online' : 'Last active 2h ago'}
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={handleCloseClick} 
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
              title="Return to dashboard"
            >
              <X size={20} />
            </button>
          </div>
        ) : showDefaultHeader ? (
          // Default header when no chat is selected (desktop view)
          <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-gray-200 bg-white z-10">
            <div className="flex items-center">
              <h2 className="text-sm font-medium text-gray-900">कुनै कुराकानी छनौट गर्नुहोस्</h2>
            </div>
            <button 
              onClick={handleCloseClick} 
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
              title="Return to dashboard"
            >
              <X size={20} />
            </button>
          </div>
        ) : null}
        
        {/* Chat Content Area */}
        {currentChat ? (
          <div className="flex-1 flex flex-col relative h-full">
            {/* Messages - Make only this area scrollable */}
            <div 
              ref={messagesContainerRef} 
              className="chat-messages absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-[60px]"
              onWheel={(e) => e.stopPropagation()}
            >
              <ChatMessages messages={dummyMessages} />
            </div>
            
            {/* Message Input - fixed at bottom */}
            <div className="mt-auto bg-white border-t border-gray-200 absolute bottom-0 left-0 right-0 z-10">
              <MessageInput onSendMessage={handleSendMessage} />
            </div>
          </div>
        ) : showEmptyState ? (
          // Empty state when no chat is selected (mobile only)
          <div className="flex-1 md:hidden flex items-center justify-center">
            {!isMobileSidebarOpen && (
              <DashboardEmptyChat onViewConversations={() => setIsMobileSidebarOpen(true)} />
            )}
          </div>
        ) : (
          // Default empty state for desktop
          <div className="flex-1 hidden md:flex items-center justify-center">
            <div className="text-center p-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">बायाँ सूचीबाट कुराकानी छान्नुहोस्</h3>
              <p className="text-sm text-gray-500">कुराकानी शुरु गर्न छनौट गर्नुहोस्</p>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .chat-messages {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: thin;     /* Firefox */
        }
        .chat-messages::-webkit-scrollbar {
          width: 5px;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background-color: rgba(203, 213, 225, 0.8);
          border-radius: 10px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}

// Export the client component as the default
const DashboardChatContainer: React.FC<DashboardChatContainerProps> = (props) => {
  return <ClientChatContainer {...props} />;
};

export default DashboardChatContainer; 