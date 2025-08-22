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
  removeUserFromChatRoom 
} from './redis';
import dbConnect from './mongodb';
import { Chat, Message, UserStatus } from './models';
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

export const getIO = () => {
  if (!io) throw new Error('Socket.io server not initialized');
  return io;
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
        REDIS_CHANNELS.CHAT_CREATED,
        REDIS_CHANNELS.MESSAGE_READ
      );

      subClient.on('message', async (channel, message) => {
        try {
          const data = JSON.parse(message);
          
          switch (channel) {
            case REDIS_CHANNELS.NEW_MESSAGE: {
              const msg = data as RedisMessage;
              io?.to(msg.chatId).emit('new_message', msg);
              break;
            }
            case REDIS_CHANNELS.USER_STATUS: {
              const status = data as RedisUserStatus;
              io?.emit('user_status', status);
              break;
            }
            case REDIS_CHANNELS.TYPING_STATUS: {
              const typing = data as RedisTypingStatus;
              io?.to(typing.chatId).emit('typing_status', typing);
              break;
            }
            case REDIS_CHANNELS.CHAT_CREATED: {
              io?.emit('chat_created', data);
              break;
            }
            case REDIS_CHANNELS.MESSAGE_READ: {
              io?.to(data.chatId).emit('messages_marked_read', data);
              break;
            }
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
            // Extract JWT token from cookies
            const cookieHeader = socket.handshake.headers.cookie;
            console.log('Socket JWT auth - Cookie header:', cookieHeader);
            let jwtToken = null;

            if (cookieHeader) {
              const cookies = cookieHeader.split(';').map(c => c.trim());
              console.log('Socket JWT auth - Parsed cookies:', cookies);
              const authCookie = cookies.find(c => c.startsWith('auth_token='));
              console.log('Socket JWT auth - Auth cookie:', authCookie);
              if (authCookie) {
                jwtToken = authCookie.split('=')[1];
                console.log('Socket JWT auth - Extracted token:', jwtToken ? 'Found' : 'Not found');
              }
            }

            if (!jwtToken) {
              console.log('Socket JWT auth - No JWT token found in cookies');
              return next(new Error('JWT token not found in cookies'));
            }

            const { payload } = await jwtVerify(jwtToken, ENCODED_JWT_SECRET);
            const homestayId = (payload as JWTPayload & { homestayId?: string }).homestayId;
            const username = (payload as JWTPayload & { username?: string }).username;

            if (!homestayId) {
              return next(new Error('Invalid homestay token - no homestay ID'));
            }

            user = {
              userId: homestayId,
              userType: 'homestay',
              username,
              homestayId
            };

          } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
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

          await setChatUserOnline(user.userId, user.userType, socket.id);

          // Publish status update via Redis
          const statusEvent: RedisUserStatus = {
            userId: user.userId,
            userType: user.userType,
            isOnline: true,
            lastActiveAt: new Date(),
            socketId: socket.id,
          };
          
          getRedisPublisher().publish(REDIS_CHANNELS.USER_STATUS, JSON.stringify(statusEvent));
          
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
    io.on('connection', (socket) => {
      const user = (socket as any).user as SocketUser;
      console.log(`🔗 User connected: ${user.userType}:${user.userId} (${socket.id})`);

      // Join chat room with validation
      socket.on('join_chat', async ({ chatId }: { chatId: string }) => {
        try {
          if (!chatId) {
            socket.emit('error_message', { message: 'Invalid chatId' });
            return;
          }

          // Verify user has access to this chat
          const hasAccess = await verifyUserChatAccess(user, chatId);
          if (!hasAccess) {
            socket.emit('error_message', { message: 'Access denied to this chat' });
            return;
          }

          await addUserToChatRoom(chatId, user.userId, user.userType);
          socket.join(chatId);
          
          console.log(`✅ User ${user.userId} joined chat ${chatId}`);
          socket.emit('chat_joined', { chatId, success: true });

        } catch (error) {
          console.error('❌ Error joining chat:', error);
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

          const typing: RedisTypingStatus = { 
            chatId, 
            userId: user.userId, 
            userType: user.userType, 
            isTyping 
          };
          
          await getRedisPublisher().publish(REDIS_CHANNELS.TYPING_STATUS, JSON.stringify(typing));
          
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

          // Publish message via Redis
          const event: RedisMessage = {
            chatId,
            messageId: msgDoc.messageId,
            senderId: msgDoc.senderId,
            senderType: msgDoc.senderType,
            content: msgDoc.content,
            messageType: msgDoc.messageType,
            timestamp: msgDoc.timestamp,
            recipientIds,
          };

          await getRedisPublisher().publish(REDIS_CHANNELS.NEW_MESSAGE, JSON.stringify(event));
          
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

          // Publish read receipt across instances via Redis (best-effort)
          try {
            await getRedisPublisher().publish(
              REDIS_CHANNELS.MESSAGE_READ,
              JSON.stringify({ chatId, messageIds, userId: user.userId, userType: user.userType })
            );
          } catch (pubErr) {
            console.warn('⚠️ Failed to publish MESSAGE_READ event:', pubErr);
          }

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

          // Update Redis status
          await setChatUserOffline(user.userId, user.userType);

          // Publish offline status
          const statusEvent: RedisUserStatus = {
            userId: user.userId,
            userType: user.userType,
            isOnline: false,
            lastActiveAt: new Date(),
          };
          
          await getRedisPublisher().publish(REDIS_CHANNELS.USER_STATUS, JSON.stringify(statusEvent));

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