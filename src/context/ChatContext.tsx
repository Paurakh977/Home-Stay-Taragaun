'use client';

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback, useReducer } from 'react';
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
  markMessagesAsRead,
  getConnectionState,
  updateAuth
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

// State management with reducer to avoid race conditions
interface ChatState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  conversations: ChatData[];
  currentChatId: string | null;
  messages: { [chatId: string]: MessageData[] };
  userStatuses: { [userId: string]: UserStatusData };
  typingUsers: { [chatId: string]: { userId: string; userName: string }[] };
  unreadCountByChatId: { [chatId: string]: number };
}

type ChatAction = 
  | { type: 'SET_CONNECTION_STATE'; payload: { isConnected: boolean; isConnecting: boolean; error?: string | null } }
  | { type: 'SET_CONVERSATIONS'; payload: ChatData[] }
  | { type: 'SET_CURRENT_CHAT'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: { chatId: string; message: MessageData } }
  | { type: 'SET_MESSAGES'; payload: { chatId: string; messages: MessageData[] } }
  | { type: 'REMOVE_OPTIMISTIC_MESSAGE'; payload: { chatId: string; content: string; messageType: string } }
  | { type: 'UPDATE_USER_STATUS'; payload: { userId: string; status: UserStatusData } }
  | { type: 'SET_TYPING_USERS'; payload: { chatId: string; users: { userId: string; userName: string }[] } }
  | { type: 'UPDATE_UNREAD_COUNT'; payload: { chatId: string; count: number } }
  | { type: 'CLEAR_UNREAD_COUNT'; payload: string }
  | { type: 'UPDATE_CONVERSATION_LAST_MESSAGE'; payload: { chatId: string; lastMessage: any; lastActivity: string } }
  | { type: 'RESET_STATE' };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONNECTION_STATE':
      return {
        ...state,
        isConnected: action.payload.isConnected,
        isConnecting: action.payload.isConnecting,
        connectionError: action.payload.error ?? null
      };
    
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    
    case 'SET_CURRENT_CHAT':
      return { ...state, currentChatId: action.payload };
    
    case 'ADD_MESSAGE': {
      const { chatId, message } = action.payload;
      const currentMessages = state.messages[chatId] || [];
      
      // Check for duplicates
      const messageExists = currentMessages.some(msg => msg.messageId === message.messageId);
      if (messageExists) {
        return state;
      }
      
      return {
        ...state,
        messages: {
          ...state.messages,
          [chatId]: [...currentMessages, message]
        }
      };
    }
    
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: action.payload.messages
        }
      };
    
    case 'REMOVE_OPTIMISTIC_MESSAGE': {
      const { chatId, content, messageType } = action.payload;
      const currentMessages = state.messages[chatId] || [];
      
      // More precise matching for optimistic message removal
      const filteredMessages = currentMessages.filter(msg => {
        const isOptimistic = msg.messageId.startsWith('temp-');
        const contentMatch = msg.content.trim() === content.trim();
        const typeMatch = msg.messageType === messageType;
        
        // Keep the message if it's not an optimistic message with matching content and type
        const shouldRemove = isOptimistic && contentMatch && typeMatch;
        
        if (shouldRemove) {
          console.log('🗑️ Removing optimistic message:', { 
            messageId: msg.messageId, 
            content: msg.content,
            messageType: msg.messageType 
          });
        }
        
        return !shouldRemove;
      });
      
      return {
        ...state,
        messages: {
          ...state.messages,
          [chatId]: filteredMessages
        }
      };
    }
    
    case 'UPDATE_USER_STATUS':
      return {
        ...state,
        userStatuses: {
          ...state.userStatuses,
          [action.payload.userId]: action.payload.status
        }
      };
    
    case 'SET_TYPING_USERS':
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.chatId]: action.payload.users
        }
      };
    
    case 'UPDATE_UNREAD_COUNT':
      return {
        ...state,
        unreadCountByChatId: {
          ...state.unreadCountByChatId,
          [action.payload.chatId]: action.payload.count
        }
      };
    
    case 'CLEAR_UNREAD_COUNT':
      return {
        ...state,
        unreadCountByChatId: {
          ...state.unreadCountByChatId,
          [action.payload]: 0
        }
      };
    
    case 'UPDATE_CONVERSATION_LAST_MESSAGE': {
      const { chatId, lastMessage, lastActivity } = action.payload;
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.chatId === chatId
            ? { ...conv, lastMessage, lastActivity }
            : conv
        )
      };
    }
    
    case 'RESET_STATE':
      return {
        isConnected: false,
        isConnecting: false,
        connectionError: null,
        conversations: [],
        currentChatId: null,
        messages: {},
        userStatuses: {},
        typingUsers: {},
        unreadCountByChatId: {}
      };
    
    default:
      return state;
  }
}

const initialState: ChatState = {
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  conversations: [],
  currentChatId: null,
  messages: {},
  userStatuses: {},
  typingUsers: {},
  unreadCountByChatId: {}
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const authData = useAuthToken();
  const [isMounted, setIsMounted] = useState(false);
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Track mounting state to prevent SSR issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Message queue for when auth data is not yet available
  const messageQueueRef = useRef<any[]>([]);


  // Calculate total unread count from state
  const totalUnreadCount = Object.values(state.unreadCountByChatId).reduce((sum, count) => sum + count, 0);

  // Refs for debouncing and preventing memory leaks
  const connectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAuthDataRef = useRef<typeof authData>(null);

  // Enhanced socket connection with error recovery
  const connectSocket = useCallback(async () => {
    if (!authData || state.isConnecting || typeof window === 'undefined' || !isMounted) {
      if (!isMounted) {
        console.log('ChatProvider - Not mounted yet, skipping initialization');
      }
      return;
    }

    // Clear any existing connection timeout
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
    }

    console.log('🔌 ChatContext - Attempting to connect socket for:', authData);
    dispatch({ type: 'SET_CONNECTION_STATE', payload: { isConnected: false, isConnecting: true, error: null } });

    try {
      // Check if auth data has changed and update socket auth if needed
      if (lastAuthDataRef.current && getSocket()) {
        const authChanged = lastAuthDataRef.current.tokenType !== authData.tokenType || 
                           lastAuthDataRef.current.token !== authData.token;
        if (authChanged) {
          console.log('🔌 ChatContext - Auth data changed, updating socket');
          await updateAuth({ tokenType: authData.tokenType, token: authData.token });
        }
      }

      await initSocket({
        tokenType: authData.tokenType,
        token: authData.token
      });

      const socket = getSocket();
      if (socket) {
        console.log('✅ ChatContext - Socket connected successfully for:', authData.tokenType, authData.userId);
        dispatch({ type: 'SET_CONNECTION_STATE', payload: { isConnected: true, isConnecting: false } });

        // Set up event listeners with error handling
        setupSocketEventListeners();

        socket.on('connect', () => {
          console.log('✅ ChatContext - Socket connect event fired for:', authData.tokenType, authData.userId);
          dispatch({ type: 'SET_CONNECTION_STATE', payload: { isConnected: true, isConnecting: false } });

          // Debounced conversation fetch
          if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
          }
          fetchTimeoutRef.current = setTimeout(() => {
            fetchConversations().catch(error => {
              console.error('❌ ChatContext - Error fetching conversations on connect:', error);
            });
          }, 500);
        });

        socket.on('disconnect', (reason) => {
          console.log('🔌 ChatContext - Socket disconnect event fired for:', authData.tokenType, authData.userId, 'reason:', reason);
          dispatch({ type: 'SET_CONNECTION_STATE', payload: { isConnected: false, isConnecting: false } });
        });

        socket.on('connect_error', (error) => {
          console.error('❌ ChatContext - Socket connection error:', error);
          dispatch({ type: 'SET_CONNECTION_STATE', payload: { 
            isConnected: false, 
            isConnecting: false, 
            error: error.message || 'Connection failed' 
          }});
        });

      } else {
        console.error('❌ ChatContext - Failed to get socket instance');
        throw new Error('Failed to get socket instance');
      }

      // Store auth data for change detection
      lastAuthDataRef.current = authData;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      console.error('❌ ChatContext - Socket connection error for:', authData.tokenType, authData.userId, error);
      dispatch({ type: 'SET_CONNECTION_STATE', payload: { 
        isConnected: false, 
        isConnecting: false, 
        error: errorMessage 
      }});

      // Schedule retry for auth errors or network issues
      if (errorMessage.includes('authentication') || errorMessage.includes('network')) {
        console.log('🔄 ChatContext - Scheduling connection retry in 5 seconds');
        connectTimeoutRef.current = setTimeout(() => {
          if (authData && isMounted) {
            connectSocket();
          }
        }, 5000);
      }
    }
  }, [authData, state.isConnecting, isMounted]);

  // Setup socket event listeners with better error handling
  const setupSocketEventListeners = useCallback(() => {
    // Clear existing listeners first
    offNewMessage();
    offUserStatus();
    offTypingStatus();
    offErrorMessage();
    offMessagesMarkedRead();
    offChatJoined();
    offChatLeft();

    // Set up new listeners
    onNewMessage(handleNewMessage);
    onUserStatus(handleUserStatus);
    onTypingStatus(handleTypingStatus);
    onErrorMessage(handleErrorMessage);
    onMessagesMarkedRead(handleMessagesMarkedRead);
    onChatJoined(handleChatJoined);
    onChatLeft(handleChatLeft);
  }, []);

  const disconnectSocketHandler = useCallback(() => {
    // Clear timeouts
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    // Clean up event listeners
    offNewMessage();
    offUserStatus();
    offTypingStatus();
    offErrorMessage();
    offMessagesMarkedRead();
    offChatJoined();
    offChatLeft();

    disconnectSocket();
    dispatch({ type: 'SET_CONNECTION_STATE', payload: { isConnected: false, isConnecting: false } });
  }, []);

  // Enhanced event handlers with better error handling
  const handleNewMessage = useCallback((data: any) => {
    try {
      // Get current auth data from ref to avoid stale closures
      const currentAuthData = authDataRef.current;
      console.log('📨 ChatContext - Received new message:', data, 'for user:', currentAuthData?.userId);
      console.log('📨 ChatContext - Current auth state:', { 
        userId: currentAuthData?.userId, 
        tokenType: currentAuthData?.tokenType,
        hasAuthData: !!currentAuthData 
      });
      
      if (!data || !data.messageId || !data.chatId) {
        console.error('❌ ChatContext - Invalid message data received:', data);
        return;
      }

      // If auth data is not available, queue the message for later processing
      if (!currentAuthData) {
        console.log('📨 ChatContext - Auth data not available, queuing message');
        messageQueueRef.current.push(data);
        return;
      }

      // More robust isSelf detection with detailed logging
      let isSelf = false;
      if (currentAuthData && currentAuthData.userId) {
        // Direct userId match with same userType
        const userTypeMatch = (data.senderType === 'clerk' && currentAuthData.tokenType === 'clerk') ||
                             (data.senderType === 'homestay' && currentAuthData.tokenType === 'jwt');
        
        isSelf = data.senderId === currentAuthData.userId && userTypeMatch;
        
        console.log('📨 ChatContext - isSelf calculation:', {
          dataSenderId: data.senderId,
          currentUserId: currentAuthData.userId,
          dataSenderType: data.senderType,
          currentTokenType: currentAuthData.tokenType,
          userTypeMatch,
          isSelf
        });
      } else {
        console.warn('📨 ChatContext - No auth data available for isSelf detection');
      }

      const message: MessageData = {
        _id: data.messageId,
        messageId: data.messageId,
        chatId: data.chatId,
        senderId: data.senderId,
        senderType: data.senderType,
        senderName: data.senderName,
        senderAvatar: data.senderAvatar || null,
        content: data.content,
        messageType: data.messageType,
        timestamp: data.timestamp,
        readBy: [],
        isEdited: false,
        isDeleted: false,
        createdAt: data.timestamp,
        updatedAt: data.timestamp,
        isSelf: isSelf
      };

      // For messages from current user, first remove any optimistic messages
      if (isSelf) {
        console.log('📨 ChatContext - Processing self message, removing optimistic:', data.content);
        dispatch({ 
          type: 'REMOVE_OPTIMISTIC_MESSAGE', 
          payload: { 
            chatId: data.chatId, 
            content: data.content.trim(), 
            messageType: data.messageType 
          } 
        });
        
        // Small delay to ensure optimistic message is removed before adding real one
        setTimeout(() => {
          dispatch({ type: 'ADD_MESSAGE', payload: { chatId: data.chatId, message } });
        }, 10);
      } else {
        // For messages from others, add immediately
        console.log('📨 ChatContext - Processing message from other user, adding immediately');
        dispatch({ type: 'ADD_MESSAGE', payload: { chatId: data.chatId, message } });
      }

      // Update conversation last message
      dispatch({ 
        type: 'UPDATE_CONVERSATION_LAST_MESSAGE', 
        payload: { 
          chatId: data.chatId, 
          lastMessage: {
            content: data.content,
            senderId: data.senderId,
            senderType: data.senderType,
            timestamp: data.timestamp,
            messageType: data.messageType
          },
          lastActivity: data.timestamp
        } 
      });

      // Update unread count if message is not from current user and not in current chat
      if (!isSelf && data.chatId !== state.currentChatId) {
        const currentCount = state.unreadCountByChatId[data.chatId] || 0;
        dispatch({ 
          type: 'UPDATE_UNREAD_COUNT', 
          payload: { chatId: data.chatId, count: currentCount + 1 } 
        });
      }
    } catch (error) {
      console.error('❌ ChatContext - Error handling new message:', error);
    }
  }, [state.currentChatId, state.unreadCountByChatId]);

  // Add effect to track auth data changes and process queued messages
  useEffect(() => {
    if (isMounted) {
      console.log('ChatProvider - authData changed:', authData);
      
      // Process any queued messages when auth data becomes available
      if (authData && messageQueueRef.current.length > 0) {
        console.log('📨 ChatContext - Auth data now available, processing queued messages');
        // Process directly here to avoid dependency issues
        const queuedMessages = [...messageQueueRef.current];
        messageQueueRef.current = [];
        
        queuedMessages.forEach(data => {
          handleNewMessage(data);
        });
      }
    }
  }, [authData, isMounted, handleNewMessage]);

  const handleUserStatus = useCallback((data: any) => {
    try {
      if (!data || !data.userId) {
        console.error('❌ ChatContext - Invalid user status data:', data);
        return;
      }
      dispatch({ type: 'UPDATE_USER_STATUS', payload: { userId: data.userId, status: data } });
    } catch (error) {
      console.error('❌ ChatContext - Error handling user status:', error);
    }
  }, []);

  const handleTypingStatus = useCallback((data: any) => {
    try {
      console.log('⌨️ ChatContext - Received typing status:', data, 'for user:', authData?.userId);
      
      if (!data || !data.chatId || !data.userId) {
        console.error('❌ ChatContext - Invalid typing status data:', data);
        return;
      }

      // Don't show typing indicator for current user
      if (data.userId === authData?.userId) {
        console.log('⌨️ ChatContext - Ignoring typing status for self');
        return;
      }

      const currentTyping = state.typingUsers[data.chatId] || [];

      if (data.isTyping) {
        // Add user to typing list if not already there
        const existingUser = currentTyping.find(user => user.userId === data.userId);
        if (!existingUser) {
          console.log('⌨️ ChatContext - Adding user to typing list:', data.userId, data.userName);
          const newTypingUsers = [...currentTyping, { userId: data.userId, userName: data.userName || 'Someone' }];
          dispatch({ type: 'SET_TYPING_USERS', payload: { chatId: data.chatId, users: newTypingUsers } });
        }
      } else {
        // Remove user from typing list
        console.log('⌨️ ChatContext - Removing user from typing list:', data.userId);
        const filteredUsers = currentTyping.filter(user => user.userId !== data.userId);
        dispatch({ type: 'SET_TYPING_USERS', payload: { chatId: data.chatId, users: filteredUsers } });
      }
    } catch (error) {
      console.error('❌ ChatContext - Error handling typing status:', error);
    }
  }, [authData?.userId, state.typingUsers]);

  const handleErrorMessage = useCallback((data: any) => {
    try {
      console.error('Socket error:', data.message);
      dispatch({ type: 'SET_CONNECTION_STATE', payload: { 
        isConnected: state.isConnected, 
        isConnecting: state.isConnecting, 
        error: data.message 
      }});
    } catch (error) {
      console.error('❌ ChatContext - Error handling error message:', error);
    }
  }, [state.isConnected, state.isConnecting]);

  const handleMessagesMarkedRead = useCallback((_data: any) => {
    // Currently handled by server-side unread counting
    // Could add local optimistic updates here if needed
  }, []);

  const handleChatJoined = useCallback((data: any) => {
    console.log('Successfully joined chat:', data.chatId);
  }, []);

  const handleChatLeft = useCallback((data: any) => {
    console.log('Successfully left chat:', data.chatId);
  }, []);

  // Enhanced actions with better error handling
  const setCurrentChat = useCallback((chatId: string | null) => {
    try {
      if (state.currentChatId && state.currentChatId !== chatId) {
        leaveChat(state.currentChatId);
        // Clear typing indicators for the previous chat
        dispatch({ type: 'SET_TYPING_USERS', payload: { chatId: state.currentChatId, users: [] } });
      }

      dispatch({ type: 'SET_CURRENT_CHAT', payload: chatId });

      if (chatId) {
        // Reset unread count for this chat when opening it
        dispatch({ type: 'CLEAR_UNREAD_COUNT', payload: chatId });

        joinChat(chatId);
        fetchMessages(chatId).catch(error => {
          console.error('❌ ChatContext - Error fetching messages for chat:', chatId, error);
        });
      }
    } catch (error) {
      console.error('❌ ChatContext - Error setting current chat:', error);
    }
  }, [state.currentChatId]);

  const sendMessage = useCallback((chatId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text') => {
    try {
      if (!state.isConnected || !authData) {
        console.error('Cannot send message: not connected or not authenticated');
        return;
      }

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        console.error('Cannot send empty message');
        return;
      }

      // Create optimistic message
      const optimisticMessage: MessageData = {
        _id: `temp-${Date.now()}-${Math.random()}`,
        messageId: `temp-${Date.now()}-${Math.random()}`,
        chatId,
        senderId: authData.userId,
        senderType: authData.tokenType === 'clerk' ? 'clerk' : 'homestay',
        senderName: undefined, // Will be set when real message comes back
        senderAvatar: undefined, // Will be set when real message comes back
        content: trimmedContent,
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
      dispatch({ type: 'ADD_MESSAGE', payload: { chatId, message: optimisticMessage } });

      // Send via socket with trimmed content to ensure consistency
      socketSendMessage(chatId, trimmedContent, messageType);
    } catch (error) {
      console.error('❌ ChatContext - Error sending message:', error);
    }
  }, [state.isConnected, authData]);

  // Typing debounce refs
  const typingTimeoutRef = useRef<{ [chatId: string]: NodeJS.Timeout }>({});
  const isTypingRef = useRef<{ [chatId: string]: boolean }>({});

  const startTyping = useCallback((chatId: string) => {
    if (!state.isConnected) return;
    
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
  }, [state.isConnected]);

  const stopTyping = useCallback((chatId: string) => {
    if (!state.isConnected) return;
    
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
  }, [state.isConnected]);

  const markAsRead = useCallback(async (chatId: string, messageIds: string[]) => {
    try {
      if (!authData) {
        console.error('Cannot mark as read: not authenticated');
        return;
      }

      if (!messageIds.length) {
        return;
      }

      // Reset unread count for this chat
      dispatch({ type: 'CLEAR_UNREAD_COUNT', payload: chatId });

      // 1) Realtime read receipts via socket
      markMessagesAsRead(chatId, messageIds);

      // 2) Persist participant lastReadAt for ordering/unread logic
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authData.tokenType === 'clerk') {
        headers['Authorization'] = `Bearer ${authData.token}`;
      }

      await fetch('/api/chat/conversations', {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ chatId, action: 'mark_read', timestamp: new Date().toISOString() })
      });
    } catch (err) {
      console.error('❌ ChatContext - Failed to mark messages as read:', err);
    }
  }, [authData]);

  const fetchConversations = useCallback(async () => {
    if (!authData) {
      console.error('Cannot fetch conversations: not authenticated');
      return;
    }

    try {
      console.log('🔍 ChatContext - Fetching conversations with auth:', {
        tokenType: authData.tokenType,
        userId: authData.userId,
        hasToken: !!authData.token
      });

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      };

      if (authData.tokenType === 'clerk') {
        headers['Authorization'] = `Bearer ${authData.token}`;
        console.log('🔍 ChatContext - Added Clerk Authorization header');
      } else {
        console.log('🔍 ChatContext - Using JWT from cookies');
      }

      console.log('🔍 ChatContext - Making fetch request to /api/chat/conversations');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch('/api/chat/conversations', {
        headers,
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('🔍 ChatContext - Response status:', response.status);
      const data = await response.json();
      console.log('🔍 ChatContext - Response data:', data);

      if (response.ok) {
        console.log('✅ ChatContext - Successfully fetched conversations:', data.conversations?.length || 0, 'conversations');
        dispatch({ type: 'SET_CONVERSATIONS', payload: data.conversations || [] });

        // Initialize unread counts from API response
        const unreadCounts: { [chatId: string]: number } = {};
        (data.conversations || []).forEach((conv: any) => {
          unreadCounts[conv.chatId] = conv.unreadCount || 0;
        });
        
        // Update unread counts in batch
        Object.entries(unreadCounts).forEach(([chatId, count]) => {
          dispatch({ type: 'UPDATE_UNREAD_COUNT', payload: { chatId, count } });
        });
      } else {
        console.error('❌ ChatContext - Error fetching conversations:', {
          status: response.status,
          error: data.error,
          details: data.details
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ ChatContext - Conversation fetch timeout');
      } else {
        console.error('❌ ChatContext - Exception fetching conversations:', error);
      }
    }
  }, [authData]);

  const fetchMessages = useCallback(async (chatId: string) => {
    if (!authData) {
      console.error('Cannot fetch messages: not authenticated');
      return;
    }

    if (!chatId) {
      console.error('Cannot fetch messages: invalid chatId');
      return;
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      };

      if (authData.tokenType === 'clerk') {
        headers['Authorization'] = `Bearer ${authData.token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`/api/chat/messages?chatId=${encodeURIComponent(chatId)}&limit=50`, {
        headers,
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (response.ok) {
        const messagesWithSelfFlag = data.messages.map((msg: any) => ({
          ...msg,
          isSelf: msg.senderId === authData.userId
        }));
        
        dispatch({ type: 'SET_MESSAGES', payload: { chatId, messages: messagesWithSelfFlag } });
      } else {
        console.error('❌ ChatContext - Error fetching messages:', data.error);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ ChatContext - Message fetch timeout for chat:', chatId);
      } else {
        console.error('❌ ChatContext - Error fetching messages:', error);
      }
    }
  }, [authData]);

  const createConversation = useCallback(async (participantId: string, participantType: 'clerk' | 'homestay'): Promise<string | null> => {
    if (!authData) {
      console.error('Cannot create conversation: not authenticated');
      return null;
    }

    if (!participantId || !participantType) {
      console.error('Cannot create conversation: invalid parameters');
      return null;
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authData.tokenType === 'clerk') {
        headers['Authorization'] = `Bearer ${authData.token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers,
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          participantId,
          participantType
        })
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (response.ok) {
        if (data.isNew) {
          dispatch({ type: 'SET_CONVERSATIONS', payload: [data.conversation, ...state.conversations] });
        }
        return data.conversation.chatId;
      } else {
        console.error('❌ ChatContext - Error creating conversation:', data.error);
        return null;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ ChatContext - Create conversation timeout');
      } else {
        console.error('❌ ChatContext - Error creating conversation:', error);
      }
      return null;
    }
  }, [authData, state.conversations]);

  // Track current authData in a ref to avoid stale closures
  const authDataRef = useRef(authData);
  authDataRef.current = authData;

  // Enhanced auto-connect with better error handling
  useEffect(() => {
    if (!isMounted) return;

    console.log('🔄 ChatContext - Auto-connect useEffect triggered:', {
      authData: !!authData,
      authDataType: authData?.tokenType,
      authDataUserId: authData?.userId,
      isConnected: state.isConnected,
      isConnecting: state.isConnecting,
      isBrowser: typeof window !== 'undefined',
      isMounted
    });

    if (authData && !state.isConnected && !state.isConnecting) {
      console.log('🚀 ChatContext - Triggering socket connection for:', authData.tokenType, authData.userId);
      // Add a small delay to ensure auth is fully established
      const connectTimer = setTimeout(() => {
        connectSocket();
      }, 100);

      return () => clearTimeout(connectTimer);
    }

    // Only disconnect if we're sure auth data is lost (not just temporarily null during loading)
    // Wait a bit to avoid disconnecting during auth state transitions
    if (!authData && (state.isConnected || state.isConnecting)) {
      console.log('🔌 ChatContext - Auth data lost, scheduling disconnect check...');
      const disconnectTimer = setTimeout(() => {
        // Use ref to get current authData value (avoids stale closure)
        const currentAuthData = authDataRef.current;
        if (!currentAuthData) {
          console.log('🔌 ChatContext - Confirming disconnect due to lost auth data');
          disconnectSocketHandler();
        } else {
          console.log('🔌 ChatContext - Auth data recovered, keeping connection');
        }
      }, 1000); // Wait 1 second before disconnecting

      return () => clearTimeout(disconnectTimer);
    }
  }, [authData, state.isConnected, state.isConnecting, connectSocket, disconnectSocketHandler, isMounted]);

  // Fetch conversations immediately when auth data is available (parallel to socket connection)
  useEffect(() => {
    if (authData && isMounted) {
      console.log('🔍 ChatContext - Auth data available, fetching conversations immediately');
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      fetchTimeoutRef.current = setTimeout(() => {
        fetchConversations();
      }, 50); // Very short delay just to ensure auth is stable
    }
  }, [authData, isMounted, fetchConversations]);

  // Also fetch conversations on socket connect (as backup and for real-time updates)
  useEffect(() => {
    if (state.isConnected) {
      console.log('🔍 ChatContext - Socket connected, refreshing conversations');
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      fetchTimeoutRef.current = setTimeout(() => {
        fetchConversations();
      }, 200);
    }
  }, [state.isConnected, fetchConversations]);

  // Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      // Clear all typing timeouts
      Object.values(typingTimeoutRef.current).forEach((timeout: NodeJS.Timeout) => {
        clearTimeout(timeout);
      });

      disconnectSocketHandler();
    };
  }, [disconnectSocketHandler]);

  const contextValue: ChatContextType = {
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    connectionError: state.connectionError,
    conversations: state.conversations,
    currentChatId: state.currentChatId,
    messages: state.messages,
    userStatuses: state.userStatuses,
    typingUsers: state.typingUsers,
    totalUnreadCount,
    unreadCountByChatId: state.unreadCountByChatId,
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
