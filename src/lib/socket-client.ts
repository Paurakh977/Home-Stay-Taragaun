import { io, type Socket } from 'socket.io-client';
import { DefaultEventsMap } from "socket.io";
// Define events the server will send to the client
 type SocketClientEvents = {
  new_message: (data: {
    chatId: string;
    messageId: string;
    senderId: string;
    senderType: 'clerk' | 'homestay';
    senderName?: string;
    content: string;
    messageType: 'text' | 'image' | 'file';
    timestamp: string;
  }) => void;
  user_status: (data: {
    userId: string;
    userType: 'clerk' | 'homestay';
    isOnline: boolean;
    lastActiveAt: string;
  }) => void;
  typing_status: (data: {
    chatId: string;
    userId: string;
    userType: 'clerk' | 'homestay';
    userName?: string;
    isTyping: boolean;
  }) => void;
  message_sent: (data: { 
    messageId: string; 
    chatId: string; 
    timestamp: string 
  }) => void;
  messages_marked_read: (data: { chatId: string; messageIds: string[] }) => void;
  chat_joined: (data: { chatId: string; success: boolean }) => void;
  chat_left: (data: { chatId: string; success: boolean }) => void;
  error_message: (data: { message: string }) => void;
  new_booking: (data: {
    bookingId: string;
    homestayId: string;
    homestayName: string;
    clerkUserId: string;
    clerkUserName: string;
    clerkUserEmail: string;
    guestName: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    numberOfRooms: number;
    status: string;
    timestamp: string;
  }) => void;
  booking_status_update: (data: {
    bookingId: string;
    homestayId: string;
    clerkUserId: string;
    oldStatus: string;
    newStatus: string;
    message?: string;
    timestamp: string;
  }) => void;
};

// Define events the client can send to the server
 type SocketServerEvents = {
  join_chat: (data: { chatId: string }) => void;
  leave_chat: (data: { chatId: string }) => void;
  send_message: (data: { chatId: string; content: string; messageType?: 'text' | 'image' | 'file' }) => void;
  typing: (data: { chatId: string; isTyping: boolean }) => void;
  mark_read: (data: { chatId: string; messageIds: string[] }) => void;
};

export type ChatSocket = Socket<
  SocketClientEvents & DefaultEventsMap,
  SocketServerEvents & DefaultEventsMap
>;

let socket: ChatSocket | null = null;

// Connection state management
let connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed' = 'disconnected';
let lastAuthData: { tokenType: 'clerk' | 'jwt'; token: string } | null = null;
let reconnectTimeoutId: NodeJS.Timeout | null = null;
let tokenRefreshTimeoutId: NodeJS.Timeout | null = null;

/**
 * Initialize Socket.IO client with enhanced authentication and reconnection handling
 */
export const initSocket = async (auth: { tokenType: 'clerk' | 'jwt'; token: string }): Promise<ChatSocket> => {
  console.log('🔌 Socket Client - Initializing socket for:', auth.tokenType);

  // Store auth data for potential reconnection
  lastAuthData = { ...auth };

  if (socket?.connected) {
    console.log('🔌 Socket Client - Socket already connected for:', auth.tokenType);
    // Update auth data if different
    const currentAuth = socket.auth as any;
    if (currentAuth?.tokenType !== auth.tokenType || currentAuth?.token !== auth.token) {
      console.log('🔌 Socket Client - Auth data changed, reconnecting...');
      await reconnectWithNewAuth(auth);
    }
    return socket;
  }

  // Cleanup existing socket if present
  if (socket) {
    console.log('🔌 Socket Client - Cleaning up existing socket for:', auth.tokenType);
    cleanupSocket();
  }

  connectionState = 'connecting';
  const socketPath = process.env.NEXT_PUBLIC_SOCKET_PATH || '/api/socket';
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  // Ensure the server initializes the Socket.IO instance via API route before connecting
  try {
    const initUrl = `${socketUrl}${socketPath}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      await fetch(initUrl, { 
        method: 'GET', 
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
    } catch (fetchError) {
      console.warn('🔌 Socket Client - Server init request failed, continuing anyway:', fetchError);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.warn('🔌 Socket Client - Server init failed, continuing anyway:', error);
  }

  socket = io(socketUrl, {
    path: socketPath,
    auth,
    transports: ['websocket', 'polling'],
    timeout: 20000, // Reasonable timeout
    reconnection: true,
    reconnectionAttempts: 15, // More attempts for better resilience
    reconnectionDelay: 1000, // Start with shorter delay
    reconnectionDelayMax: 5000, // Reasonable max delay
    withCredentials: true, // Enable sending cookies with socket connection
    forceNew: true, // Force new connection to ensure fresh authentication
    upgrade: true,
    rememberUpgrade: true
  }) as ChatSocket;

  // Set up token refresh for JWT tokens
  if (auth.tokenType === 'jwt') {
    setupTokenRefresh();
  }

  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Socket initialization failed'));

    let resolved = false;
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        connectionState = 'failed';
        reject(new Error('Socket connection timeout'));
      }
    }, 30000); // 30 second total timeout

    socket.on('connect', () => {
      console.log('✅ Socket Client - Socket.IO client connected for:', auth.tokenType);
      connectionState = 'connected';
      clearTimeout(timeoutId);
      if (!resolved) {
        resolved = true;
        resolve(socket!);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket Client - Socket.IO connection error for:', auth.tokenType, error);
      connectionState = 'failed';
      
      // If this is an auth error, try to refresh token
      if (error.message.includes('authentication') || error.message.includes('token')) {
        handleAuthError();
      }
      
      clearTimeout(timeoutId);
      if (!resolved) {
        resolved = true;
        reject(error);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket Client - Socket.IO client disconnected for:', auth.tokenType, 'reason:', reason);
      connectionState = 'disconnected';
      
      // Clear any existing reconnection timeouts
      clearReconnectionTimeouts();
      
      // Handle specific disconnect reasons
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        console.log('🔌 Socket Client - Manual disconnect, not attempting reconnection');
      } else {
        console.log('🔌 Socket Client - Unexpected disconnect, will attempt reconnection');
      }
    });

    socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`🔄 Socket Client - Reconnection attempt ${attemptNumber} for: ${auth.tokenType}`);
      connectionState = 'reconnecting';
      
      // Update auth data for reconnection if available
      if (lastAuthData && (lastAuthData.tokenType !== auth.tokenType || lastAuthData.token !== auth.token)) {
        console.log('🔄 Socket Client - Updating auth for reconnection');
        socket!.auth = lastAuthData;
      }
    });

    socket.on('reconnect', (attemptNumber: number) => {
      console.log(`✅ Socket Client - Socket.IO client reconnected for: ${auth.tokenType} after ${attemptNumber} attempts`);
      connectionState = 'connected';
    });

    socket.on('reconnect_error', (error: Error) => {
      console.error('❌ Socket Client - Socket.IO reconnection error for:', auth.tokenType, error);
      
      // If this is an auth error during reconnection, try to refresh token
      if (error.message.includes('authentication') || error.message.includes('token')) {
        handleAuthError();
      }
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Socket Client - Socket.IO reconnection failed for:', auth.tokenType);
      connectionState = 'failed';
      
      // Try one more time with fresh auth
      if (lastAuthData) {
        console.log('🔄 Socket Client - Attempting final reconnection with fresh auth');
        scheduleReconnectionWithFreshAuth();
      }
    });
  });
};
// Helper functions for connection management
function cleanupSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  clearReconnectionTimeouts();
  connectionState = 'disconnected';
}

function clearReconnectionTimeouts() {
  if (reconnectTimeoutId) {
    clearTimeout(reconnectTimeoutId);
    reconnectTimeoutId = null;
  }
  if (tokenRefreshTimeoutId) {
    clearTimeout(tokenRefreshTimeoutId);
    tokenRefreshTimeoutId = null;
  }
}

function setupTokenRefresh() {
  clearTimeout(tokenRefreshTimeoutId!);
  
  // Refresh JWT token every 45 minutes (assuming 1 hour expiry)
  tokenRefreshTimeoutId = setTimeout(async () => {
    try {
      console.log('🔄 Socket Client - Checking JWT token validity...');
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        console.log('🔄 Socket Client - JWT token expired, will need fresh auth on next connection');
        if (lastAuthData) {
          lastAuthData.token = 'jwt-from-cookie'; // Reset to cookie-based auth
        }
      } else {
        // Schedule next refresh
        setupTokenRefresh();
      }
    } catch (error) {
      console.error('🔄 Socket Client - JWT token refresh check failed:', error);
    }
  }, 45 * 60 * 1000); // 45 minutes
}

async function handleAuthError() {
  if (!lastAuthData) return;
  
  console.log('🔄 Socket Client - Handling auth error...');
  
  if (lastAuthData.tokenType === 'jwt') {
    // For JWT, just mark for refresh
    lastAuthData.token = 'jwt-from-cookie';
  } else if (lastAuthData.tokenType === 'clerk') {
    // For Clerk, we'll need the app to provide a fresh token
    console.log('🔄 Socket Client - Clerk token needs refresh from app');
  }
}

function scheduleReconnectionWithFreshAuth() {
  if (reconnectTimeoutId) return; // Already scheduled
  
  reconnectTimeoutId = setTimeout(async () => {
    if (lastAuthData && socket) {
      console.log('🔄 Socket Client - Attempting reconnection with fresh auth');
      try {
        await reconnectWithNewAuth(lastAuthData);
      } catch (error) {
        console.error('🔄 Socket Client - Fresh auth reconnection failed:', error);
      }
    }
    reconnectTimeoutId = null;
  }, 5000); // Wait 5 seconds before trying
}

async function reconnectWithNewAuth(auth: { tokenType: 'clerk' | 'jwt'; token: string }) {
  if (!socket) return;
  
  console.log('🔄 Socket Client - Reconnecting with new auth:', auth.tokenType);
  lastAuthData = { ...auth };
  
  // Update socket auth
  socket.auth = auth;
  
  // Force reconnection
  socket.disconnect();
  socket.connect();
}

/**
 * Get current connection state
 */
export const getConnectionState = () => connectionState;

/**
 * Update authentication data for existing connection
 */
export const updateAuth = async (auth: { tokenType: 'clerk' | 'jwt'; token: string }) => {
  if (!socket) return false;
  
  lastAuthData = { ...auth };
  
  if (socket.connected) {
    await reconnectWithNewAuth(auth);
  } else {
    socket.auth = auth;
  }
  
  return true;
};

export const onMessageSent = (callback: SocketClientEvents['message_sent']) => {
  socket?.on('message_sent', callback);
};

export const offMessageSent = (callback?: SocketClientEvents['message_sent']) => {
  if (!socket) return;
  if (callback) socket.off('message_sent', callback);
  else socket.removeAllListeners('message_sent');
};

/**
 * Get current socket instance
 */
export const getSocket = (): ChatSocket | null => socket;

/**
 * Disconnect socket with proper cleanup
 */
export const disconnectSocket = () => {
  if (socket) {
    console.log('🔌 Socket.IO client manually disconnected');
    cleanupSocket();
  }
};

/**
 * Join a chat room
 */
export const joinChat = (chatId: string) => {
  if (socket?.connected) {
    socket.emit('join_chat', { chatId });
  }
};

/**
 * Leave a chat room
 */
export const leaveChat = (chatId: string) => {
  if (socket?.connected) {
    socket.emit('leave_chat', { chatId });
  }
};

/**
 * Send a message
 */
export const sendMessage = (chatId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text') => {
  if (socket?.connected) {
    socket.emit('send_message', { chatId, content, messageType });
  } else {
    console.error('Cannot send message: socket not connected');
  }
};

/**
 * Send typing indicator
 */
export const sendTyping = (chatId: string, isTyping: boolean) => {
  if (socket?.connected) {
    socket.emit('typing', { chatId, isTyping });
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = (chatId: string, messageIds: string[]) => {
  if (socket?.connected) {
    socket.emit('mark_read', { chatId, messageIds });
  }
};

/**
 * Register event listeners
 */
export const onNewMessage = (callback: SocketClientEvents['new_message']) => {
  socket?.on('new_message', callback);
};

export const onUserStatus = (callback: SocketClientEvents['user_status']) => {
  socket?.on('user_status', callback);
};

export const onTypingStatus = (callback: SocketClientEvents['typing_status']) => {
  socket?.on('typing_status', callback);
};

export const onErrorMessage = (callback: SocketClientEvents['error_message']) => {
  socket?.on('error_message', callback);
};

export const onMessagesMarkedRead = (callback: SocketClientEvents['messages_marked_read']) => {
  socket?.on('messages_marked_read', callback);
};

export const onChatJoined = (callback: SocketClientEvents['chat_joined']) => {
  socket?.on('chat_joined', callback);
};

export const onChatLeft = (callback: SocketClientEvents['chat_left']) => {
  socket?.on('chat_left', callback);
};

export const onNewBooking = (callback: SocketClientEvents['new_booking']) => {
  socket?.on('new_booking', callback);
};

export const onBookingStatusUpdate = (callback: SocketClientEvents['booking_status_update']) => {
  socket?.on('booking_status_update', callback);
};

/**
 * Remove event listeners
 */
export const offNewMessage = (callback?: SocketClientEvents['new_message']) => {
  if (!socket) return;
  if (callback) socket.off('new_message', callback);
  else socket.removeAllListeners('new_message');
};

export const offUserStatus = (callback?: SocketClientEvents['user_status']) => {
  if (!socket) return;
  if (callback) socket.off('user_status', callback);
  else socket.removeAllListeners('user_status');
};

export const offTypingStatus = (callback?: SocketClientEvents['typing_status']) => {
  if (!socket) return;
  if (callback) socket.off('typing_status', callback);
  else socket.removeAllListeners('typing_status');
};

export const offErrorMessage = (callback?: SocketClientEvents['error_message']) => {
  if (!socket) return;
  if (callback) socket.off('error_message', callback);
  else socket.removeAllListeners('error_message');
};

export const offMessagesMarkedRead = (callback?: SocketClientEvents['messages_marked_read']) => {
  if (!socket) return;
  if (callback) socket.off('messages_marked_read', callback);
  else socket.removeAllListeners('messages_marked_read');
};

export const offChatJoined = (callback?: SocketClientEvents['chat_joined']) => {
  if (!socket) return;
  if (callback) socket.off('chat_joined', callback);
  else socket.removeAllListeners('chat_joined');
};

export const offChatLeft = (callback?: SocketClientEvents['chat_left']) => {
  if (!socket) return;
  if (callback) socket.off('chat_left', callback);
  else socket.removeAllListeners('chat_left');
};

export const offNewBooking = (callback?: SocketClientEvents['new_booking']) => {
  if (!socket) return;
  if (callback) socket.off('new_booking', callback);
  else socket.removeAllListeners('new_booking');
};

export const offBookingStatusUpdate = (callback?: SocketClientEvents['booking_status_update']) => {
  if (!socket) return;
  if (callback) socket.off('booking_status_update', callback);
  else socket.removeAllListeners('booking_status_update');
};