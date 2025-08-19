'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  initSocket, 
  getSocket, 
  disconnectSocket,
  onNewMessage,
  onUserStatus,
  onTypingStatus,
  onErrorMessage,
  onMessagesMarkedRead,
  offNewMessage,
  offUserStatus,
  offTypingStatus,
  offErrorMessage,
  offMessagesMarkedRead,
  joinChat,
  leaveChat,
  sendMessage as socketSendMessage,
  sendTyping,
  markMessagesAsRead
} from '@/lib/socket-client';
import { useAuthToken } from '@/hooks/useAuthToken';
import type { ChatData, MessageData, UserStatusData } from '@/types/chat';

interface ChatContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Chat data
  conversations: ChatData[];
  currentChatId: string | null;
  messages: { [chatId: string]: MessageData[] };
  
  // User statuses
  userStatuses: { [userId: string]: UserStatusData };
  
  // Typing indicators
  typingUsers: { [chatId: string]: string[] };
  
  // Actions
  connectSocket: () => Promise<void>;
  disconnectSocket: () => void;
  setCurrentChat: (chatId: string | null) => void;
  sendMessage: (chatId: string, content: string, messageType?: 'text' | 'image' | 'file') => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  markAsRead: (chatId: string, messageIds: string[]) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  createConversation: (participantId: string, participantType: 'clerk' | 'homestay') => Promise<string | null>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const authData = useAuthToken();
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Chat data
  const [conversations, setConversations] = useState<ChatData[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ [chatId: string]: MessageData[] }>({});
  
  // User statuses
  const [userStatuses, setUserStatuses] = useState<{ [userId: string]: UserStatusData }>({});
  
  // Typing indicators
  const [typingUsers, setTypingUsers] = useState<{ [chatId: string]: string[] }>({});

  // Socket connection
  const connectSocket = async () => {
    if (!authData || isConnecting) return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      await initSocket({
        tokenType: authData.tokenType,
        token: authData.token
      });

      const socket = getSocket();
      if (socket) {
        setIsConnected(true);
        
        // Set up event listeners
        onNewMessage(handleNewMessage);
        onUserStatus(handleUserStatus);
        onTypingStatus(handleTypingStatus);
        onErrorMessage(handleErrorMessage);
        onMessagesMarkedRead(handleMessagesMarkedRead);

        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));
      }
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      console.error('Socket connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectSocketHandler = () => {
    // Clean up event listeners
    offNewMessage();
    offUserStatus();
    offTypingStatus();
    offErrorMessage();
    offMessagesMarkedRead();
    
    disconnectSocket();
    setIsConnected(false);
  };

  // Event handlers
  const handleNewMessage = (data: any) => {
    const message: MessageData = {
      _id: data.messageId,
      messageId: data.messageId,
      chatId: data.chatId,
      senderId: data.senderId,
      senderType: data.senderType,
      content: data.content,
      messageType: data.messageType,
      timestamp: data.timestamp,
      readBy: [],
      isEdited: false,
      isDeleted: false,
      createdAt: data.timestamp,
      updatedAt: data.timestamp,
      isSelf: data.senderId === authData?.userId
    };

    setMessages(prev => ({
      ...prev,
      [data.chatId]: [...(prev[data.chatId] || []), message]
    }));

    // Update conversation last message
    setConversations(prev => 
      prev.map(conv => 
        conv.chatId === data.chatId 
          ? {
              ...conv,
              lastMessage: {
                content: data.content,
                senderId: data.senderId,
                senderType: data.senderType,
                timestamp: data.timestamp,
                messageType: data.messageType
              },
              lastActivity: data.timestamp
            }
          : conv
      )
    );
  };

  const handleUserStatus = (data: any) => {
    setUserStatuses(prev => ({
      ...prev,
      [data.userId]: data
    }));
  };

  const handleTypingStatus = (data: any) => {
    setTypingUsers(prev => {
      const currentTyping = prev[data.chatId] || [];
      
      if (data.isTyping) {
        // Add user to typing list if not already there
        if (!currentTyping.includes(data.userId)) {
          return {
            ...prev,
            [data.chatId]: [...currentTyping, data.userId]
          };
        }
      } else {
        // Remove user from typing list
        return {
          ...prev,
          [data.chatId]: currentTyping.filter(userId => userId !== data.userId)
        };
      }
      
      return prev;
    });
  };

  const handleErrorMessage = (data: any) => {
    console.error('Socket error:', data.message);
    setConnectionError(data.message);
  };

  const handleMessagesMarkedRead = (data: any) => {
    // Optional: update local message read state or conversation unread counts if needed
    // Currently, unread counting is derived on server; we keep client minimal
  };

  // Actions
  const setCurrentChat = (chatId: string | null) => {
    if (currentChatId) {
      leaveChat(currentChatId);
    }
    
    setCurrentChatId(chatId);
    
    if (chatId) {
      joinChat(chatId);
      fetchMessages(chatId);
    }
  };

  const sendMessage = (chatId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text') => {
    socketSendMessage(chatId, content, messageType);
  };

  const startTyping = (chatId: string) => {
    sendTyping(chatId, true);
  };

  const stopTyping = (chatId: string) => {
    sendTyping(chatId, false);
  };

  const markAsRead = async (chatId: string, messageIds: string[]) => {
    // 1) Realtime read receipts via socket
    markMessagesAsRead(chatId, messageIds);

    // 2) Persist participant lastReadAt for ordering/unread logic
    try {
      await fetch('/api/chat/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, action: 'mark_read', timestamp: new Date().toISOString() })
      });
    } catch (err) {
      console.error('Failed to PATCH conversation mark_read:', err);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations');
      const data = await response.json();
      
      if (response.ok) {
        setConversations(data.conversations || []);
      } else {
        console.error('Error fetching conversations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?chatId=${chatId}&limit=50`);
      const data = await response.json();
      
      if (response.ok) {
        const messagesWithSelfFlag = data.messages.map((msg: any) => ({
          ...msg,
          isSelf: msg.senderId === authData?.userId
        }));
        
        setMessages(prev => ({
          ...prev,
          [chatId]: messagesWithSelfFlag
        }));
      } else {
        console.error('Error fetching messages:', data.error);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const createConversation = async (participantId: string, participantType: 'clerk' | 'homestay'): Promise<string | null> => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          participantType
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.isNew) {
          setConversations(prev => [data.conversation, ...prev]);
        }
        return data.conversation.chatId;
      } else {
        console.error('Error creating conversation:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  // Auto-connect when auth data is available
  useEffect(() => {
    if (authData && !isConnected && !isConnecting) {
      connectSocket();
    }
  }, [authData]);

  // Fetch conversations on connect
  useEffect(() => {
    if (isConnected) {
      fetchConversations();
    }
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocketHandler();
    };
  }, []);

  const contextValue: ChatContextType = {
    isConnected,
    isConnecting,
    connectionError,
    conversations,
    currentChatId,
    messages,
    userStatuses,
    typingUsers,
    connectSocket,
    disconnectSocket: disconnectSocketHandler,
    setCurrentChat,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    fetchConversations,
    fetchMessages,
    createConversation
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
