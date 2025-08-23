import { Server as IOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import {
  getRedisPublisher,
  getRedisSubscriber,
  initializeRedis,
  REDIS_CHANNELS,
  type RedisMessage,
  type RedisTypingStatus,
  type RedisUserStatus,
  setChatUserOnline,
  setChatUserOffline,
  addUserToChatRoom,
  removeUserFromChatRoom,
  safeRedisPublish,
  nonBlockingRedisPublish
} from './redis';
import dbConnect from './mongodb';
import { Chat, Message, UserStatus } from './models';
import HomestaySingle from './models/HomestaySingle';
import { jwtVerify } from 'jose';
import { createClerkClient, type ClerkClient } from '@clerk/backend';
import type { JWTPayload } from 'jose';
import { v4 as uuidv4 } from 'uuid';

// Environment variables validation
function validateEnvironmentVariables() {
  const requiredEnvVars = [
    'MONGODB_URI',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'JWT_SECRET'
  ];

  const redisEnvVars = [
    'REDIS_HOST',
    'REDIS_PORT'
  ];

  const missingVars: string[] = [];

  // Check required vars
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Check Redis vars (at least one host var should exist)
  const hasRedisHost = process.env.REDIS_HOST || process.env.REDISDB_HOST;
  if (!hasRedisHost) {
    missingVars.push('REDIS_HOST or REDISDB_HOST');
  }

  if (missingVars.length > 0) {
    const errorMessage = `❌ Missing required environment variables: ${missingVars.join(', ')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  console.log('✅ All required environment variables are present');
}

// Database connection verification
async function verifyDatabaseConnection() {
  try {
    await dbConnect();
    console.log('✅ MongoDB connection verified');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

interface SocketUser {
  userId: string;
  userType: 'clerk' | 'homestay';
  username?: string;
  homestayId?: string;
}

// JWT secret for homestay/admin users
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
const ENCODED_JWT_SECRET = new TextEncoder().encode(JWT_SECRET);

let io: IOServer | null = null;

// Local cache for user statuses to reduce Redis load
const userStatusCache = new Map<string, { isOnline: boolean; lastActiveAt: Date; socketId?: string }>();
const USER_STATUS_CACHE_TTL = 300000; // 5 minutes

// Typing status debouncing to prevent spam
const typingDebounceMap = new Map<string, NodeJS.Timeout>();
const TYPING_DEBOUNCE_MS = 1000; // 1 second debounce

export const getIO = () => {
  if (!io) throw new Error('Socket.io server not initialized');
  return io;
};

// Cleanup function for debounce maps
export const cleanupSocketServer = () => {
  // Clear all pending typing timeouts
  typingDebounceMap.forEach((timeoutId) => {
    clearTimeout(timeoutId);
  });
  typingDebounceMap.clear();

  // Clear user status cache
  userStatusCache.clear();

  if (io) {
    io.close();
    io = null;
  }
};

// Verify user has access to specific chat
async function verifyUserChatAccess(user: SocketUser, chatId: string): Promise<boolean> {
  try {
    const chat = await Chat.findOne({
      chatId,
      'participants.userId': user.userId,
      'participants.userType': user.userType,
      isActive: true
    });

    return !!chat;
  } catch (error) {
    console.error('Error verifying chat access:', error);
    return false;
  }
}

// Get user name by ID and type
async function getUserName(userId: string, userType: 'clerk' | 'homestay'): Promise<string> {
  try {
    if (userType === 'clerk') {
      const clerk = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY!,
        publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
      });

      const user = await clerk.users.getUser(userId);
      return user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || 'Unknown User';
    } else if (userType === 'homestay') {
      const homestay = await HomestaySingle.findOne({ homestayId: userId }).lean();
      return homestay?.homeStayName || homestay?.name || 'Unknown Homestay';
    }
  } catch (error) {
    console.error(`Error fetching user name for ${userType}:${userId}:`, error);
  }

  return 'Unknown User';
}

export async function initializeSocketServer(server: HTTPServer) {
  if (io) {
    console.log('✅ Socket.IO server already initialized');
    return io;
  }

  try {
    // Validate environment variables before proceeding
    validateEnvironmentVariables();

    // Initialize Redis and MongoDB connections
    try {
      await initializeRedis();
    } catch (adapterInitErr) {
      console.error('❌ Redis initialization failed. Continuing without Redis pub/sub:', adapterInitErr);
      // Continue: socket server will run without Redis adapter/subscriptions
    }
    await verifyDatabaseConnection();

    io = new IOServer(server, {
      path: '/api/socket',
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000']
          : '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingInterval: 25000,
      pingTimeout: 60000,
      maxHttpBufferSize: 1e6, // 1MB
      transports: ['websocket', 'polling'],
    });

    // Attach Redis adapter with error handling
    try {
      const pubClient = getRedisPublisher();
      const subClient = getRedisSubscriber();
      io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Redis adapter attached to Socket.IO');
    } catch (adapterError) {
      console.error('❌ Failed to attach Redis adapter:', adapterError);
      // Do not crash if Redis adapter cannot be attached; continue without clustering
    }

    // Subscribe to Redis channels for cross-instance events
    try {
      const subClient = getRedisSubscriber();
      await subClient.subscribe(
        REDIS_CHANNELS.NEW_MESSAGE,
        REDIS_CHANNELS.USER_STATUS,
        REDIS_CHANNELS.TYPING_STATUS,
        REDIS_CHANNELS.CHAT_CREATED
        // Removed MESSAGE_READ to eliminate Redis timeouts for rapid read events
      );

      subClient.on('message', async (channel, message) => {
        try {
          const data = JSON.parse(message);
          
          switch (channel) {
            case REDIS_CHANNELS.NEW_MESSAGE: {
              const msg = data as RedisMessage;
              console.log('📨 Socket Server - Broadcasting new message to room:', msg.chatId, 'message:', msg.content);
              console.log('📨 Socket Server - Message from:', msg.senderType, msg.senderId, 'to recipients:', msg.recipientIds);

              // Log which sockets are in this room
              const socketsInRoom = io?.sockets.adapter.rooms.get(msg.chatId);
              console.log('📨 Socket Server - Sockets in room', msg.chatId, ':', socketsInRoom ? Array.from(socketsInRoom) : 'none');

              // Log all connected sockets and their user info
              const allSockets = Array.from(io?.sockets.sockets.values() || []);
              console.log('📨 Socket Server - All connected sockets:', allSockets.map(s => {
                const user = (s as any).user as SocketUser;
                return user ? `${user.userType}:${user.userId}(${s.id})` : `unknown(${s.id})`;
              }));

              io?.to(msg.chatId).emit('new_message', msg);
              console.log('📨 Socket Server - Message broadcasted to room:', msg.chatId);
              break;
            }
            case REDIS_CHANNELS.USER_STATUS: {
              const status = data as RedisUserStatus;
              console.log('👤 Socket Server - Broadcasting user status:', status.userId, status.isOnline);
              io?.emit('user_status', status);
              break;
            }
            case REDIS_CHANNELS.TYPING_STATUS: {
              const typing = data as RedisTypingStatus;
              console.log('⌨️ Socket Server - Broadcasting typing status to room:', typing.chatId, 'user:', typing.userId, 'typing:', typing.isTyping);

              // Log which sockets are in this room
              const socketsInRoom = io?.sockets.adapter.rooms.get(typing.chatId);
              console.log('⌨️ Socket Server - Sockets in room', typing.chatId, ':', socketsInRoom ? Array.from(socketsInRoom) : 'none');

              io?.to(typing.chatId).emit('typing_status', typing);
              break;
            }
            case REDIS_CHANNELS.CHAT_CREATED: {
              io?.emit('chat_created', data);
              break;
            }
            // Removed MESSAGE_READ case - now handled locally only
          }
        } catch (err) {
          console.error('❌ Failed to process Redis pub/sub message:', err);
        }
      });
    } catch (subErr) {
      console.error('⚠️ Redis subscription not set up; continuing without cross-instance events:', subErr);
    }

    // Enhanced authentication middleware with better error handling
    io.use(async (socket, next) => {
      try {
        const { tokenType, token } = socket.handshake.auth as { tokenType?: 'clerk' | 'jwt'; token?: string };
        const userAgent = socket.handshake.headers['user-agent'] || 'unknown';

        if (!tokenType) {
          return next(new Error('Authentication token type missing'));
        }

        // For JWT, we read from cookies, so token can be a placeholder
        if (tokenType === 'clerk' && !token) {
          return next(new Error('Clerk authentication token missing'));
        }

        let user: SocketUser | null = null;

        if (tokenType === 'clerk') {
          // Verify Clerk session token using Backend SDK
          const clerk: ClerkClient = createClerkClient({
            secretKey: process.env.CLERK_SECRET_KEY as string,
            publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string,
          });

          try {
            // Build a Request object with Authorization header
            const headers = new Headers();
            headers.set('Authorization', `Bearer ${token}`);
            const reqForClerk = new Request('http://localhost/internal-socket-auth', { headers });

            const { isSignedIn, toAuth } = await clerk.authenticateRequest(reqForClerk);

            if (!isSignedIn) {
              return next(new Error('Invalid Clerk token'));
            }

            const authData = await toAuth();
            if (!authData.userId) {
              return next(new Error('Invalid Clerk token - no user ID'));
            }

            user = { userId: authData.userId, userType: 'clerk' };
            
          } catch (clerkError) {
            console.error('Clerk authentication error:', clerkError);
            return next(new Error('Clerk authentication failed'));
          }

        } else if (tokenType === 'jwt') {
          // Verify custom JWT for homestay/admin users - read from cookies
          try {
            console.log('🔐 Socket JWT auth - Starting JWT authentication for homestay user');
            // Extract JWT token from cookies
            const cookieHeader = socket.handshake.headers.cookie;
            console.log('🔐 Socket JWT auth - Cookie header:', cookieHeader);
            let jwtToken = null;

            if (cookieHeader) {
              const cookies = cookieHeader.split(';').map(c => c.trim());
              console.log('🔐 Socket JWT auth - Parsed cookies:', cookies);
              const authCookie = cookies.find(c => c.startsWith('auth_token='));
              console.log('🔐 Socket JWT auth - Auth cookie:', authCookie);
              if (authCookie) {
                jwtToken = authCookie.split('=')[1];
                console.log('🔐 Socket JWT auth - Extracted token:', jwtToken ? 'Found' : 'Not found');
              }
            }

            if (!jwtToken) {
              console.log('❌ Socket JWT auth - No JWT token found in cookies');
              return next(new Error('JWT token not found in cookies'));
            }

            console.log('🔐 Socket JWT auth - Verifying JWT token...');
            const { payload } = await jwtVerify(jwtToken, ENCODED_JWT_SECRET);
            console.log('🔐 Socket JWT auth - JWT payload:', payload);

            const homestayId = (payload as JWTPayload & { homestayId?: string }).homestayId;
            const username = (payload as JWTPayload & { username?: string }).username;

            if (!homestayId) {
              console.log('❌ Socket JWT auth - No homestayId in JWT payload');
              return next(new Error('Invalid homestay token - no homestay ID'));
            }

            console.log('✅ Socket JWT auth - Successfully authenticated homestay user:', homestayId);
            user = {
              userId: homestayId,
              userType: 'homestay',
              username,
              homestayId
            };

          } catch (jwtError) {
            console.error('❌ Socket JWT auth - JWT verification error:', jwtError);
            return next(new Error('JWT authentication failed'));
          }
        }

        if (!user) {
          return next(new Error('Authentication failed - no user data'));
        }

        // Attach user to socket
        (socket as any).user = user;

        // Persist user status to MongoDB and Redis with error handling
        try {
          await UserStatus.findOneAndUpdate(
            { userId: user.userId, userType: user.userType },
            { 
              isOnline: true, 
              lastActiveAt: new Date(), 
              currentSocketId: socket.id,
              deviceInfo: { userAgent, platform: 'web', browser: 'unknown' }
            },
            { upsert: true, new: true }
          );

          // Update local cache first for immediate access
          const userKey = `${user.userType}:${user.userId}`;
          userStatusCache.set(userKey, {
            isOnline: true,
            lastActiveAt: new Date(),
            socketId: socket.id
          });

          // Try to update Redis, but don't block if it fails
          try {
            await setChatUserOnline(user.userId, user.userType, socket.id);

            // Use non-blocking publish for status updates
            const statusEvent: RedisUserStatus = {
              userId: user.userId,
              userType: user.userType,
              isOnline: true,
              lastActiveAt: new Date(),
              socketId: socket.id,
            };

            // Fire-and-forget Redis publish
            safeRedisPublish(REDIS_CHANNELS.USER_STATUS, statusEvent).catch(err => {
              console.warn('⚠️ Failed to publish user status to Redis:', err.message);
            });
          } catch (redisError) {
            console.warn('⚠️ Redis user status update failed, using local cache only:', redisError);
          }
          
        } catch (statusError) {
          console.error('Error updating user status:', statusError);
          // Continue with connection even if status update fails
        }

        console.log(`✅ User authenticated: ${user.userType}:${user.userId}`);
        next();

      } catch (error) {
        console.error('❌ Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Connection handler with comprehensive error handling
    io.on('connection', async (socket) => {
      const user = (socket as any).user as SocketUser;
      console.log(`🔗 Socket Server - User connected: ${user.userType}:${user.userId} (${socket.id})`);

      // Log all rooms this socket is in
      console.log(`🏠 Socket Server - User ${user.userType}:${user.userId} is in rooms:`, Array.from(socket.rooms));

      // Auto-join user to their active chats
      try {
        const activeChats = await Chat.find({
          'participants.userId': user.userId,
          'participants.userType': user.userType,
          isActive: true
        }).select('chatId').limit(10); // Limit to prevent overwhelming

        for (const chat of activeChats) {
          await addUserToChatRoom(chat.chatId, user.userId, user.userType);
          socket.join(chat.chatId);
          console.log(`🏠 Socket Server - Auto-joined ${user.userType}:${user.userId} to active chat ${chat.chatId}`);
        }

        if (activeChats.length > 0) {
          console.log(`🏠 Socket Server - User ${user.userType}:${user.userId} auto-joined to ${activeChats.length} active chats`);
        }
      } catch (autoJoinError) {
        console.error('❌ Error auto-joining user to active chats:', autoJoinError);
        // Continue with connection even if auto-join fails
      }

      // Join chat room with validation
      socket.on('join_chat', async ({ chatId }: { chatId: string }) => {
        try {
          console.log(`🏠 Socket Server - User ${user.userType}:${user.userId} attempting to join chat ${chatId}`);
          if (!chatId) {
            socket.emit('error_message', { message: 'Invalid chatId' });
            return;
          }

          // Verify user has access to this chat
          const hasAccess = await verifyUserChatAccess(user, chatId);
          if (!hasAccess) {
            console.log(`❌ Socket Server - User ${user.userType}:${user.userId} denied access to chat ${chatId}`);
            socket.emit('error_message', { message: 'Access denied to this chat' });
            return;
          }

          await addUserToChatRoom(chatId, user.userId, user.userType);
          socket.join(chatId);

          // Log all rooms this socket is now in
          console.log(`✅ Socket Server - User ${user.userType}:${user.userId} successfully joined chat ${chatId}`);
          console.log(`🏠 Socket Server - User ${user.userType}:${user.userId} is now in rooms:`, Array.from(socket.rooms));

          // Log all sockets in this chat room
          const socketsInRoom = io?.sockets.adapter.rooms.get(chatId);
          console.log(`🏠 Socket Server - All sockets in room ${chatId}:`, socketsInRoom ? Array.from(socketsInRoom) : 'none');

          socket.emit('chat_joined', { chatId, success: true });

        } catch (error) {
          console.error('❌ Socket Server - Error joining chat:', error);
          socket.emit('error_message', { message: 'Failed to join chat' });
        }
      });

      // Leave chat room with cleanup
      socket.on('leave_chat', async ({ chatId }: { chatId: string }) => {
        try {
          if (!chatId) {
            socket.emit('error_message', { message: 'Invalid chatId' });
            return;
          }

          await removeUserFromChatRoom(chatId, user.userId, user.userType);
          socket.leave(chatId);
          
          console.log(`✅ User ${user.userId} left chat ${chatId}`);
          socket.emit('chat_left', { chatId, success: true });

        } catch (error) {
          console.error('❌ Error leaving chat:', error);
          socket.emit('error_message', { message: 'Failed to leave chat' });
        }
      });

      // Typing indicator with validation
      socket.on('typing', async ({ chatId, isTyping }: { chatId: string; isTyping: boolean }) => {
        try {
          if (!chatId || typeof isTyping !== 'boolean') {
            socket.emit('error_message', { message: 'Invalid typing data' });
            return;
          }

          // Verify user has access to this chat
          const hasAccess = await verifyUserChatAccess(user, chatId);
          if (!hasAccess) {
            socket.emit('error_message', { message: 'Access denied to this chat' });
            return;
          }

          // Debounce typing indicators to prevent spam
          const typingKey = `${chatId}:${user.userId}:${user.userType}`;

          // Clear existing timeout
          if (typingDebounceMap.has(typingKey)) {
            clearTimeout(typingDebounceMap.get(typingKey)!);
          }

          // Only send typing indicators if user is typing (not when stopping)
          if (isTyping) {
            // Set debounced timeout for typing
            const timeoutId = setTimeout(async () => {
              const userName = await getUserName(user.userId, user.userType);

              // Broadcast locally only (no Redis) for better performance
              io?.to(chatId).emit('typing_status', {
                chatId,
                userId: user.userId,
                userType: user.userType,
                userName,
                isTyping: true
              });

              typingDebounceMap.delete(typingKey);
            }, TYPING_DEBOUNCE_MS);

            typingDebounceMap.set(typingKey, timeoutId);
          } else {
            // Immediately broadcast stop typing
            const userName = await getUserName(user.userId, user.userType);
            io?.to(chatId).emit('typing_status', {
              chatId,
              userId: user.userId,
              userType: user.userType,
              userName,
              isTyping: false
            });
          }
          
        } catch (error) {
          console.error('❌ Error handling typing event:', error);
          socket.emit('error_message', { message: 'Failed to update typing status' });
        }
      });

      // Send message with comprehensive validation
      socket.on('send_message', async ({ chatId, content, messageType }: { 
        chatId: string; 
        content: string; 
        messageType?: 'text' | 'image' | 'file' 
      }) => {
        try {
          // Input validation
          if (!chatId || !content) {
            socket.emit('error_message', { message: 'Missing chatId or content' });
            return;
          }

          if (typeof content !== 'string' || content.trim().length === 0) {
            socket.emit('error_message', { message: 'Content must be a non-empty string' });
            return;
          }

          if (content.length > 5000) {
            socket.emit('error_message', { message: 'Message too long (max 5000 characters)' });
            return;
          }

          const validMessageType = messageType && ['text', 'image', 'file'].includes(messageType) ? messageType : 'text';

          // Verify user has access to this chat
          const hasAccess = await verifyUserChatAccess(user, chatId);
          if (!hasAccess) {
            socket.emit('error_message', { message: 'Access denied to this chat' });
            return;
          }

          // Ensure sender is in the chat room
          if (!socket.rooms.has(chatId)) {
            await addUserToChatRoom(chatId, user.userId, user.userType);
            socket.join(chatId);
            console.log(`🏠 Socket Server - Auto-joined sender ${user.userType}:${user.userId} to chat ${chatId}`);
          }

          // Auto-join all connected participants to the chat room
          try {
            const chat = await Chat.findOne({ chatId }).select('participants');
            if (chat?.participants) {
              for (const participant of chat.participants) {
                // Skip the sender as they're already in the room
                if (participant.userId === user.userId && participant.userType === user.userType) {
                  continue;
                }

                // Find all connected sockets for this participant
                const participantSockets = Array.from(io?.sockets.sockets.values() || [])
                  .filter(s => {
                    const socketUser = (s as any).user as SocketUser;
                    return socketUser &&
                           socketUser.userId === participant.userId &&
                           socketUser.userType === participant.userType;
                  });

                // Join each connected socket to the room
                for (const participantSocket of participantSockets) {
                  if (!participantSocket.rooms.has(chatId)) {
                    await addUserToChatRoom(chatId, participant.userId, participant.userType);
                    participantSocket.join(chatId);
                    console.log(`🏠 Socket Server - Auto-joined participant ${participant.userType}:${participant.userId} to chat ${chatId}`);
                  }
                }
              }
            }
          } catch (autoJoinError) {
            console.error('❌ Error auto-joining participants:', autoJoinError);
            // Continue with message sending even if auto-join fails
          }

          // Create message with proper error handling
          const messageId = uuidv4();
          const msgDoc = await Message.create({
            messageId,
            chatId,
            senderId: user.userId,
            senderType: user.userType,
            content: content.trim(),
            messageType: validMessageType,
            timestamp: new Date(),
            readBy: [{ userId: user.userId, userType: user.userType, readAt: new Date() }],
          });

          // Update chat last message
          await Chat.findOneAndUpdate(
            { chatId },
            {
              lastMessage: {
                content: msgDoc.content,
                senderId: msgDoc.senderId,
                senderType: msgDoc.senderType,
                timestamp: msgDoc.timestamp,
                messageType: msgDoc.messageType,
              },
              lastActivity: new Date(),
            }
          );

          // Get chat participants for targeting
          const chat = await Chat.findOne({ chatId }).select('participants');
          const recipientIds = chat?.participants
            .filter(p => !(p.userId === user.userId && p.userType === user.userType))
            .map(p => p.userId) || [];

          // Get sender name for message
          const senderName = await getUserName(user.userId, user.userType);

          // Publish message via Redis
          const event: RedisMessage = {
            chatId,
            messageId: msgDoc.messageId,
            senderId: msgDoc.senderId,
            senderType: msgDoc.senderType,
            senderName,
            content: msgDoc.content,
            messageType: msgDoc.messageType,
            timestamp: msgDoc.timestamp,
            recipientIds,
          };

          await safeRedisPublish(REDIS_CHANNELS.NEW_MESSAGE, event);
          
          // Confirm message sent to sender
          socket.emit('message_sent', { 
            messageId: msgDoc.messageId, 
            chatId, 
            timestamp: msgDoc.timestamp 
          });

        } catch (err) {
          console.error('❌ send_message handler error:', err);
          socket.emit('error_message', { 
            message: 'Failed to send message',
            details: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      });

      // Mark messages as read
      socket.on('mark_read', async ({ chatId, messageIds }: { 
        chatId: string; 
        messageIds: string[] 
      }) => {
        try {
          if (!chatId || !Array.isArray(messageIds)) {
            socket.emit('error_message', { message: 'Invalid mark_read data' });
            return;
          }

          // Verify user has access to this chat
          const hasAccess = await verifyUserChatAccess(user, chatId);
          if (!hasAccess) {
            socket.emit('error_message', { message: 'Access denied to this chat' });
            return;
          }

          // Update messages as read
          await Message.updateMany(
            { 
              messageId: { $in: messageIds },
              chatId,
              'readBy.userId': { $ne: user.userId },
              'readBy.userType': { $ne: user.userType }
            },
            {
              $push: {
                readBy: {
                  userId: user.userId,
                  userType: user.userType,
                  readAt: new Date()
                }
              }
            }
          );

          // Update chat participant's lastReadAt
          await Chat.findOneAndUpdate(
            { 
              chatId,
              'participants.userId': user.userId,
              'participants.userType': user.userType 
            },
            { 
              $set: { 'participants.$.lastReadAt': new Date() }
            }
          );

          // Broadcast read receipts only to local socket room (no Redis)
          // This eliminates Redis timeouts for rapid read events
          io?.to(chatId).emit('messages_marked_read', {
            chatId,
            messageIds,
            userId: user.userId,
            userType: user.userType
          });

          // Also emit to the sender's socket immediately
          socket.emit('messages_marked_read', { chatId, messageIds });

        } catch (error) {
          console.error('❌ Error marking messages as read:', error);
          socket.emit('error_message', { message: 'Failed to mark messages as read' });
        }
      });

      // Handle disconnect with proper cleanup
      socket.on('disconnect', async (reason) => {
        try {
          console.log(`🔌 User disconnected: ${user.userId} (${socket.id}) - Reason: ${reason}`);

          // Update user status in MongoDB
          await UserStatus.findOneAndUpdate(
            { userId: user.userId, userType: user.userType },
            { 
              isOnline: false, 
              lastActiveAt: new Date(), 
              currentSocketId: undefined 
            },
            { new: true }
          );

          // Update local cache immediately
          const userKey = `${user.userType}:${user.userId}`;
          userStatusCache.set(userKey, {
            isOnline: false,
            lastActiveAt: new Date()
          });

          // Clear any pending typing timeouts for this user
          const typingKeys = Array.from(typingDebounceMap.keys()).filter(key =>
            key.includes(user.userId)
          );
          typingKeys.forEach(key => {
            const timeoutId = typingDebounceMap.get(key);
            if (timeoutId) {
              clearTimeout(timeoutId);
              typingDebounceMap.delete(key);
            }
          });

          // Try Redis updates but don't block on them
          try {
            await setChatUserOffline(user.userId, user.userType);

            // Fire-and-forget Redis publish
            const statusEvent: RedisUserStatus = {
              userId: user.userId,
              userType: user.userType,
              isOnline: false,
              lastActiveAt: new Date(),
            };

            safeRedisPublish(REDIS_CHANNELS.USER_STATUS, statusEvent).catch(err => {
              console.warn('⚠️ Failed to publish offline status to Redis:', err.message);
            });
          } catch (redisError) {
            console.warn('⚠️ Redis offline status update failed:', redisError);
          }

        } catch (err) {
          console.error('❌ Error handling disconnect:', err);
        }
      });

      // Handle connection errors
      socket.on('error', (error) => {
        console.error(`❌ Socket error for user ${user.userId}:`, error);
      });

      // Heartbeat/ping handler
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });
    });

    // Handle Socket.IO server errors
    io.on('error', (error) => {
      console.error('❌ Socket.IO server error:', error);
    });

    console.log('✅ Socket.IO server initialized successfully');
    return io;

  } catch (error) {
    console.error('❌ Failed to initialize Socket.IO server:', error);
    throw error;
  }
}

// Graceful shutdown handler
export async function shutdownSocketServer() {
  if (io) {
    console.log('🔄 Shutting down Socket.IO server...');
    
    return new Promise<void>((resolve) => {
      io?.close(() => {
        console.log('✅ Socket.IO server shut down successfully');
        io = null;
        resolve();
      });
    });
  }
}