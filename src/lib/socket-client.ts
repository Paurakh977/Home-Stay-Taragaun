import { io, type Socket } from 'socket.io-client';
import { DefaultEventsMap } from "socket.io";
// Define events the server will send to the client
 type SocketClientEvents = {
  new_message: (data: {
    chatId: string;
    messageId: string;
    senderId: string;
    senderType: 'clerk' | 'homestay';
    content: string;
    messageType: 'text' | 'image' | 'file';
    timestamp: Date;
  }) => void;
  user_status: (data: {
    userId: string;
    userType: 'clerk' | 'homestay';
    isOnline: boolean;
    lastActiveAt: Date;
  }) => void;
  typing_status: (data: {
    chatId: string;
    userId: string;
    userType: 'clerk' | 'homestay';
    isTyping: boolean;
  }) => void;
  error_message: (data: { message: string }) => void;
};

// Define events the client can send to the server
 type SocketServerEvents = {
  join_chat: (data: { chatId: string }) => void;
  leave_chat: (data: { chatId: string }) => void;
  send_message: (data: { chatId: string; content: string; messageType?: 'text' | 'image' | 'file' }) => void;
  typing: (data: { chatId: string; isTyping: boolean }) => void;
};

export type ChatSocket = Socket<
  SocketClientEvents & DefaultEventsMap,
  SocketServerEvents & DefaultEventsMap
>;

let socket: ChatSocket | null = null;

/**
 * Initialize Socket.IO client with authentication
 */
export const initSocket = async (auth: { tokenType: 'clerk' | 'jwt'; token: string }): Promise<ChatSocket> => {
  if (socket?.connected) {
    return socket;
  }

  // Disconnect existing socket if present
  if (socket) {
    socket.disconnect();
  }

  const socketPath = process.env.NEXT_PUBLIC_SOCKET_PATH || '/api/socket';
  const socketUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  // Ensure the server initializes the Socket.IO instance via API route before connecting
  try {
    const initUrl = `${socketUrl}${socketPath}`;
    await fetch(initUrl, { method: 'GET', mode: 'no-cors' }).catch(() => {});
  } catch {}

  socket = io(socketUrl, {
    path: socketPath,
    auth,
    transports: ['websocket', 'polling'],
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  }) as ChatSocket;

  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Socket initialization failed'));

    socket.on('connect', () => {
      console.log('✅ Socket.IO client connected');
      resolve(socket!);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      reject(error);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO client disconnected:', reason);
    });

    socket.on('reconnect', (attemptNumber:number) => {
      console.log(`🔄 Socket.IO client reconnected after ${attemptNumber} attempts`);
    });

    socket.on('reconnect_error', (error:Error) => {
      console.error('❌ Socket.IO reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Socket.IO reconnection failed');
    });
  });
};

/**
 * Get current socket instance
 */
export const getSocket = (): ChatSocket | null => socket;

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket.IO client manually disconnected');
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

/**
 * Remove event listeners
 */
export const offNewMessage = (callback?: SocketClientEvents['new_message']) => {
  socket?.off('new_message', callback);
};

export const offUserStatus = (callback?: SocketClientEvents['user_status']) => {
  socket?.off('user_status', callback);
};

export const offTypingStatus = (callback?: SocketClientEvents['typing_status']) => {
  socket?.off('typing_status', callback);
};

export const offErrorMessage = (callback?: SocketClientEvents['error_message']) => {
  socket?.off('error_message', callback);
};