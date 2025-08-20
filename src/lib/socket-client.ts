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
    isTyping: boolean;
  }) => void;
  message_sent: (data: { 
    messageId: string; 
    chatId: string; 
    timestamp: string 
  }) => void;
  messages_marked_read: (data: { chatId: string; messageIds: string[] }) => void;
  error_message: (data: { message: string }) => void;
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

/**
 * Initialize Socket.IO client with authentication
 */
export const initSocket = async (auth: { tokenType: 'clerk' | 'jwt'; token: string }): Promise<ChatSocket> => {
  if (socket?.connected) {
    return socket;
  }

  // Disconnect existing socket if present
  if (socket) {
    // Ensure we clean up previous listeners to prevent memory leaks
    socket.removeAllListeners();
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