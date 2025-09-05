import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import MessageInput from './MessageInput';
import EmptyChat from './EmptyChat';
import { useChat } from '@/context/ChatContext';
import { useAuthToken } from '@/hooks/useAuthToken';
import type { ChatData, MessageData, UserStatusData } from '@/types/chat';
import type { ChatItem } from './ChatSidebar';
import type { Message } from './ChatMessages';

interface ChatContainerProps {
  navbarHeight: number;
}

// Helper function to convert conversations to chat items
const convertConversationsToChats = (conversations: ChatData[], userStatuses: { [userId: string]: UserStatusData }, unreadCountByChatId: { [chatId: string]: number }, currentUserId?: string): ChatItem[] => {
  return conversations.map(conv => {
    // Find the other participant (not the current user)
    const otherParticipant = conv.participants.find(p => p.userId !== currentUserId);
    const unreadCount = unreadCountByChatId[conv.chatId] || 0;

    return {
      id: conv.chatId,
      name: otherParticipant?.name || otherParticipant?.username || 'Unknown User',
      avatar: otherParticipant?.avatar || '',
      lastMessage: conv.lastMessage?.content || 'No messages yet',
      time: formatTime(conv.lastActivity),
      unread: unreadCount > 0,
      unreadCount: unreadCount,
      online: otherParticipant ? userStatuses[otherParticipant.userId]?.isOnline || false : false
    };
  });
};

// Helper function to convert messages to chat messages
const convertMessagesToChatMessages = (messages: MessageData[]): Message[] => {
  return messages.map(msg => ({
    id: msg.messageId,
    sender: msg.isSelf ? 'You' : (msg.senderName || 'Unknown User'),
    senderAvatar: msg.senderAvatar || undefined,
    content: msg.content,
    timestamp: msg.timestamp,
    isSelf: msg.isSelf || false,
    isRead: msg.readBy && msg.readBy.length > 1 // Read by more than just the sender
  }));
};

// Helper function to get typing users for current chat
const getTypingUsersForChat = (chatId: string | null, typingUsers: { [chatId: string]: { userId: string; userName: string }[] }, currentUserId?: string): string[] => {
  if (!chatId || !typingUsers[chatId]) return [];

  return typingUsers[chatId]
    .filter(user => user.userId !== currentUserId) // Filter out current user
    .map(user => user.userName);
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

const ChatContainer: React.FC<ChatContainerProps> = ({ navbarHeight }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const chatId = searchParams?.get('id') ?? null;
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get auth data for current user
  const authData = useAuthToken();
  
  // Use ChatContext
  const {
    conversations,
    currentChatId,
    messages,
    userStatuses,
    typingUsers,
    unreadCountByChatId,
    isConnected,
    isConnecting,
    connectionError,
    setCurrentChat,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead
  } = useChat();

  // Build derived chat list and find current chat item for header
  const chatItems = convertConversationsToChats(conversations, userStatuses, unreadCountByChatId, authData?.userId);
  const currentChat = currentChatId ? chatItems.find(c => c.id === currentChatId) : undefined;

  // Set initial chat ID if none is selected
  useEffect(() => {
    if (!currentChatId && conversations.length > 0) {
      setCurrentChat(conversations[0].chatId);
    }
  }, [currentChatId, conversations, setCurrentChat]);

  // Update sidebar state and current chat ID based on URL
  useEffect(() => {
    // When URL has chatId parameter, update currentChatId and hide sidebar on mobile
    if (chatId && chatId !== currentChatId) {
      setCurrentChat(chatId);
      setIsMobileSidebarOpen(false);
    } else if (typeof window !== 'undefined' && window.innerWidth < 768) {
      // Only show sidebar on mobile when no specific chat is selected
      setIsMobileSidebarOpen(true);
    }
  }, [chatId, currentChatId, setCurrentChat]);
  
  // Ensure we handle route changes correctly when browser navigation occurs
  useEffect(() => {
    if (chatId && currentChatId !== chatId) {
      setCurrentChat(chatId);
    }
  }, [pathname, chatId, currentChatId, setCurrentChat]);

  // Scroll to bottom when chat changes or on mount
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [currentChatId]);

  // Mark messages as read when viewing a chat
  useEffect(() => {
    if (currentChatId && messages[currentChatId]) {
      const unreadMessages = messages[currentChatId].filter(msg =>
        !msg.isSelf && !msg.readBy.some(r => r.userId === authData?.userId)
      );

      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg.messageId);
        markAsRead(currentChatId, messageIds);
      }
    }
  }, [currentChatId, messages, markAsRead]);

  // Handle chat selection
  const handleChatSelect = (chatId: string) => {
    setCurrentChat(chatId);
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
    if (currentChatId && message.trim()) {
      sendMessage(currentChatId, message.trim());
    }
  };
  
  // Handle typing events
  const handleTypingStart = () => {
    if (currentChatId) {
      startTyping(currentChatId);
    }
  };
  
  const handleTypingStop = () => {
    if (currentChatId) {
      stopTyping(currentChatId);
    }
  };

  return (
    <div className="flex flex-1 h-full min-h-0 overflow-hidden">
      {/* Connection Status Banner */}
      {(isConnecting || connectionError) && (
        <div className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm ${
          connectionError ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
        }`}>
          {connectionError ? `Connection Error: ${connectionError}` : 'Connecting to chat...'}
        </div>
      )}

      {/* Chat Sidebar */}
      <ChatSidebar
        chats={chatItems}
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
              <ChatMessages
                messages={convertMessagesToChatMessages(messages[currentChatId] || [])}
                typingUsers={getTypingUsersForChat(currentChatId, typingUsers, authData?.userId)}
              />
            </div>
            {/* Message Input */}
            <div className="flex-none">
              <MessageInput 
              onSendMessage={handleSendMessage}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              disabled={!isConnected}
            />
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