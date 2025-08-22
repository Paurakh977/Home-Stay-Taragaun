'use client';

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import {
  initSocket,
  getSocket,
  disconnectSocket,
  onNewMessage,
  onUserStatus,
  onTypingStatus,
  onErrorMessage,
  onMessagesMarkedRead,
  onChatJoined,
  onChatLeft,
  offNewMessage,
  offUserStatus,
  offTypingStatus,
  offErrorMessage,
  offMessagesMarkedRead,
  offChatJoined,
  offChatLeft,
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
  typingUsers: { [chatId: string]: { userId: string; userName: string }[] };

  // Unread counts
  totalUnreadCount: number;
  unreadCountByChatId: { [chatId: string]: number };

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

  console.log('ChatProvider initialized with authData:', authData);

  // Add effect to track auth data changes
  useEffect(() => {
    console.log('ChatProvider - authData changed:', authData);
  }, [authData]);
  
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
  const [typingUsers, setTypingUsers] = useState<{ [chatId: string]: { userId: string; userName: string }[] }>({});

  // Unread counts
  const [unreadCountByChatId, setUnreadCountByChatId] = useState<{ [chatId: string]: number }>({});

  // Calculate total unread count
  const totalUnreadCount = Object.values(unreadCountByChatId).reduce((sum, count) => sum + count, 0);

  // Socket connection
  const connectSocket = useCallback(async () => {
    if (!authData || isConnecting || typeof window === 'undefined') return;

    console.log('🔌 ChatContext - Attempting to connect socket for:', authData);
    setIsConnecting(true);
    setConnectionError(null);

    try {
      await initSocket({
        tokenType: authData.tokenType,
        token: authData.token
      });

      const socket = getSocket();
      if (socket) {
        console.log('✅ ChatContext - Socket connected successfully for:', authData.tokenType, authData.userId);
        setIsConnected(true);

        // Set up event listeners
        onNewMessage(handleNewMessage);
        onUserStatus(handleUserStatus);
        onTypingStatus(handleTypingStatus);
        onErrorMessage(handleErrorMessage);
        onMessagesMarkedRead(handleMessagesMarkedRead);
        onChatJoined(handleChatJoined);
        onChatLeft(handleChatLeft);

        socket.on('connect', () => {
          console.log('✅ ChatContext - Socket connect event fired for:', authData.tokenType, authData.userId);
          setIsConnected(true);

          // Fetch conversations when socket connects
          fetchConversations().catch(error => {
            console.error('❌ ChatContext - Error fetching conversations on connect:', error);
          });
        });
        socket.on('disconnect', () => {
          console.log('🔌 ChatContext - Socket disconnect event fired for:', authData.tokenType, authData.userId);
          setIsConnected(false);
        });
      } else {
        console.error('❌ ChatContext - Failed to get socket instance');
      }
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      console.error('❌ ChatContext - Socket connection error for:', authData.tokenType, authData.userId, error);
    } finally {
      setIsConnecting(false);
    }
  }, [authData]);

  const disconnectSocketHandler = useCallback(() => {
    // Clean up event listeners
    offNewMessage();
    offUserStatus();
    offTypingStatus();
    offErrorMessage();
    offMessagesMarkedRead();
    offChatJoined();
    offChatLeft();

    disconnectSocket();
    setIsConnected(false);
  }, []);

  // Event handlers
  const handleNewMessage = (data: any) => {
    console.log('📨 ChatContext - Received new message:', data, 'for user:', authData?.userId);
    const message: MessageData = {
      _id: data.messageId,
      messageId: data.messageId,
      chatId: data.chatId,
      senderId: data.senderId,
      senderType: data.senderType,
      senderName: data.senderName,
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

    setMessages(prev => {
      const currentMessages = prev[data.chatId] || [];
      
      // Check if message already exists to prevent duplicates
      const messageExists = currentMessages.some(msg => msg.messageId === data.messageId);
      if (messageExists) {
        return prev;
      }
      
      // Remove optimistic message if this is from the same sender and content matches
      const filteredMessages = message.isSelf 
        ? currentMessages.filter(msg => 
            !(msg.messageId.startsWith('temp-') && 
              msg.content === message.content && 
              msg.messageType === message.messageType)
          )
        : currentMessages;
      
      return {
        ...prev,
        [data.chatId]: [...filteredMessages, message]
      };
    });

    // Update conversation last message and unread count
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

    // Update unread count if message is not from current user and not in current chat
    if (!message.isSelf && data.chatId !== currentChatId) {
      setUnreadCountByChatId(prev => ({
        ...prev,
        [data.chatId]: (prev[data.chatId] || 0) + 1
      }));
    }
  };

  const handleUserStatus = (data: any) => {
    setUserStatuses(prev => ({
      ...prev,
      [data.userId]: data
    }));
  };

  const handleTypingStatus = (data: any) => {
    console.log('⌨️ ChatContext - Received typing status:', data, 'for user:', authData?.userId);
    // Don't show typing indicator for current user
    if (data.userId === authData?.userId) {
      console.log('⌨️ ChatContext - Ignoring typing status for self');
      return;
    }

    setTypingUsers(prev => {
      const currentTyping = prev[data.chatId] || [];

      if (data.isTyping) {
        // Add user to typing list if not already there
        const existingUser = currentTyping.find(user => user.userId === data.userId);
        if (!existingUser) {
          console.log('⌨️ ChatContext - Adding user to typing list:', data.userId, data.userName);
          return {
            ...prev,
            [data.chatId]: [...currentTyping, { userId: data.userId, userName: data.userName || 'Someone' }]
          };
        }
      } else {
        // Remove user from typing list
        console.log('⌨️ ChatContext - Removing user from typing list:', data.userId);
        return {
          ...prev,
          [data.chatId]: currentTyping.filter(user => user.userId !== data.userId)
        };
      }

      return prev;
    });
  };

  const handleErrorMessage = (data: any) => {
    console.error('Socket error:', data.message);
    setConnectionError(data.message);
  };

  const handleMessagesMarkedRead = (_data: any) => {
    // Optional: update local message read state or conversation unread counts if needed
    // Currently, unread counting is derived on server; we keep client minimal
  };

  const handleChatJoined = (data: any) => {
    console.log('Successfully joined chat:', data.chatId);
  };

  const handleChatLeft = (data: any) => {
    console.log('Successfully left chat:', data.chatId);
  };

  // Actions
  const setCurrentChat = (chatId: string | null) => {
    if (currentChatId && currentChatId !== chatId) {
      leaveChat(currentChatId);
      // Clear typing indicators for the previous chat
      setTypingUsers(prev => ({
        ...prev,
        [currentChatId]: []
      }));
    }

    setCurrentChatId(chatId);

    if (chatId) {
      // Reset unread count for this chat when opening it
      setUnreadCountByChatId(prev => ({
        ...prev,
        [chatId]: 0
      }));

      joinChat(chatId);
      fetchMessages(chatId);
    }
  };

  const sendMessage = (chatId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text') => {
    if (!isConnected || !authData) {
      console.error('Cannot send message: not connected or not authenticated');
      return;
    }

    // Create optimistic message
    const optimisticMessage: MessageData = {
      _id: `temp-${Date.now()}`,
      messageId: `temp-${Date.now()}`,
      chatId,
      senderId: authData.userId,
      senderType: authData.tokenType === 'clerk' ? 'clerk' : 'homestay',
      content,
      messageType,
      timestamp: new Date().toISOString(),
      readBy: [],
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSelf: true
    };

    // Add optimistic message to local state
    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), optimisticMessage]
    }));

    // Send via socket
    socketSendMessage(chatId, content, messageType);
  };

  // Typing debounce refs
  const typingTimeoutRef = useRef<{ [chatId: string]: NodeJS.Timeout }>({});
  const isTypingRef = useRef<{ [chatId: string]: boolean }>({});

  const startTyping = (chatId: string) => {
    if (!isConnected) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current[chatId]) {
      clearTimeout(typingTimeoutRef.current[chatId]);
    }
    
    // Send typing start if not already typing
    if (!isTypingRef.current[chatId]) {
      sendTyping(chatId, true);
      isTypingRef.current[chatId] = true;
    }
    
    // Set timeout to stop typing
    typingTimeoutRef.current[chatId] = setTimeout(() => {
      stopTyping(chatId);
    }, 3000); // Stop typing after 3 seconds of inactivity
  };

  const stopTyping = (chatId: string) => {
    if (!isConnected) return;
    
    // Clear timeout
    if (typingTimeoutRef.current[chatId]) {
      clearTimeout(typingTimeoutRef.current[chatId]);
      delete typingTimeoutRef.current[chatId];
    }
    
    // Send typing stop if currently typing
    if (isTypingRef.current[chatId]) {
      sendTyping(chatId, false);
      isTypingRef.current[chatId] = false;
    }
  };

  const markAsRead = async (chatId: string, messageIds: string[]) => {
    if (!authData) {
      console.error('Cannot mark as read: not authenticated');
      return;
    }

    // Reset unread count for this chat
    setUnreadCountByChatId(prev => ({
      ...prev,
      [chatId]: 0
    }));

    // 1) Realtime read receipts via socket
    markMessagesAsRead(chatId, messageIds);

    // 2) Persist participant lastReadAt for ordering/unread logic
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authData.tokenType === 'clerk') {
        headers['Authorization'] = `Bearer ${authData.token}`;
      }

      await fetch('/api/chat/conversations', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ chatId, action: 'mark_read', timestamp: new Date().toISOString() })
      });
    } catch (err) {
      console.error('Failed to PATCH conversation mark_read:', err);
    }
  };

  const fetchConversations = async () => {
    if (!authData) {
      console.error('Cannot fetch conversations: not authenticated');
      return;
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authData.tokenType === 'clerk') {
        headers['Authorization'] = `Bearer ${authData.token}`;
      } else {
        // JWT token is already in cookies, no need to add to headers
      }

      const response = await fetch('/api/chat/conversations', {
        headers,
        credentials: 'include' // Include cookies for JWT authentication
      });
      const data = await response.json();

      if (response.ok) {
        console.log('Fetched conversations:', data.conversations?.length || 0, 'conversations');
        setConversations(data.conversations || []);

        // Initialize unread counts from API response
        const unreadCounts: { [chatId: string]: number } = {};
        (data.conversations || []).forEach((conv: any) => {
          unreadCounts[conv.chatId] = conv.unreadCount || 0;
        });
        setUnreadCountByChatId(unreadCounts);
      } else {
        console.error('Error fetching conversations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (chatId: string) => {
    if (!authData) {
      console.error('Cannot fetch messages: not authenticated');
      return;
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authData.tokenType === 'clerk') {
        headers['Authorization'] = `Bearer ${authData.token}`;
      }

      const response = await fetch(`/api/chat/messages?chatId=${chatId}&limit=50`, {
        headers,
        credentials: 'include' // Include cookies for JWT authentication
      });
      const data = await response.json();
      
      if (response.ok) {
        const messagesWithSelfFlag = data.messages.map((msg: any) => ({
          ...msg,
          isSelf: msg.senderId === authData.userId
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
    if (!authData) {
      console.error('Cannot create conversation: not authenticated');
      return null;
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authData.tokenType === 'clerk') {
        headers['Authorization'] = `Bearer ${authData.token}`;
      }

      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies for JWT authentication
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
    console.log('🔄 ChatContext - Auto-connect useEffect triggered:', {
      authData: !!authData,
      authDataType: authData?.tokenType,
      authDataUserId: authData?.userId,
      isConnected,
      isConnecting,
      isBrowser: typeof window !== 'undefined'
    });

    if (authData && !isConnected && !isConnecting) {
      console.log('🚀 ChatContext - Triggering socket connection for:', authData.tokenType, authData.userId);
      connectSocket();
    }

    // Disconnect when auth data is lost
    if (!authData && (isConnected || isConnecting)) {
      console.log('🔌 ChatContext - Disconnecting socket due to lost auth data');
      disconnectSocketHandler();
    }
  }, [authData, isConnected, isConnecting, connectSocket, disconnectSocketHandler]);

  // Fetch conversations on connect
  useEffect(() => {
    if (isConnected) {
      fetchConversations();
    }
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all typing timeouts
      Object.values(typingTimeoutRef.current).forEach((timeout: NodeJS.Timeout) => {
        clearTimeout(timeout);
      });

      disconnectSocketHandler();
    };
  }, [disconnectSocketHandler]);

  const contextValue: ChatContextType = {
    isConnected,
    isConnecting,
    connectionError,
    conversations,
    currentChatId,
    messages,
    userStatuses,
    typingUsers,
    totalUnreadCount,
    unreadCountByChatId,
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
