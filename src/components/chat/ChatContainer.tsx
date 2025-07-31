import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import MessageInput from './MessageInput';
import EmptyChat from './EmptyChat';
import { dummyChats, dummyMessages } from './ChatData';

interface ChatContainerProps {
  navbarHeight: number;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ navbarHeight }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const chatId = searchParams.get('id');
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Find the current chat from the dummy data
  const currentChat = dummyChats.find(chat => chat.id === currentChatId);

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

  // Scroll to bottom when chat changes or on mount
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [currentChatId]);

  // Handle chat selection
  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    setIsMobileSidebarOpen(false);
  };

  // Handle search change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Handle back button click
  const handleBackClick = () => {
    // When in a specific chat on mobile, go back to the chat list view
    if (currentChatId) {
      router.push('/chat');
    }
  };

  // Handle close button click
  const handleCloseClick = () => {
    // Go back to home page
    router.push('/');
  };

  // Handle send message
  const handleSendMessage = (message: string) => {
    // In a real application, you'd send this to an API
    console.log('Sending message:', message);
  };

  return (
    <div className="flex flex-1 h-full min-h-0 overflow-hidden">
      {/* Chat Sidebar */}
      <ChatSidebar 
        chats={dummyChats}
        currentChatId={currentChatId}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onChatSelect={handleChatSelect}
        onClose={handleCloseClick}
        isMobileSidebarOpen={isMobileSidebarOpen}
        navbarHeight={navbarHeight}
      />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full z-20">
        {/* Chat Header */}
        {currentChatId && currentChat && (
          <ChatHeader 
            currentChat={currentChat} 
            onBackClick={handleBackClick} 
          />
        )}
        
        {/* Chat Content Area */}
        {currentChatId && currentChat ? (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto min-h-0" ref={messagesContainerRef}>
              <ChatMessages messages={dummyMessages} />
            </div>
            {/* Message Input */}
            <div className="flex-none">
              <MessageInput onSendMessage={handleSendMessage} />
            </div>
          </div>
        ) : (
          // Empty state when no chat is selected (mobile only)
          <div className="flex-1 md:hidden">
            {!isMobileSidebarOpen && (
              <EmptyChat onViewConversations={() => setIsMobileSidebarOpen(true)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatContainer; 