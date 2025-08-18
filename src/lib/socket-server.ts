import { Server as IOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { getRedisPublisher, getRedisSubscriber, initializeRedis, REDIS_CHANNELS, type RedisMessage, type RedisTypingStatus, type RedisUserStatus, setChatUserOnline, setChatUserOffline, addUserToChatRoom, removeUserFromChatRoom } from './redis';
import dbConnect from './mongodb';
import { Chat, Message, UserStatus } from './models';
import { jwtVerify } from 'jose';
import { createClerkClient, type ClerkClient } from '@clerk/backend';
import type { JWTPayload } from 'jose';
import { v4 as uuidv4 } from 'uuid';

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

export async function initializeSocketServer(server: HTTPServer) {
  if (io) return io;

  await initializeRedis();
  await dbConnect();

  io = new IOServer(server, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // Attach Redis adapter
  const pubClient = getRedisPublisher();
  const subClient = getRedisSubscriber();
  io.adapter(createAdapter(pubClient, subClient));

  // Subscribe to Redis channels for cross-instance events
  subClient.subscribe(REDIS_CHANNELS.NEW_MESSAGE, REDIS_CHANNELS.USER_STATUS, REDIS_CHANNELS.TYPING_STATUS, REDIS_CHANNELS.CHAT_CREATED);

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
      }
    } catch (err) {
      console.error('Failed to process Redis pub/sub message', err);
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const { tokenType, token } = socket.handshake.auth as { tokenType?: 'clerk' | 'jwt'; token?: string };
      const userAgent = socket.handshake.headers['user-agent'] || 'unknown';

      if (!token || !tokenType) {
        return next(new Error('Authentication token missing'));
      }

      let user: SocketUser | null = null;

      if (tokenType === 'clerk') {
        // Verify Clerk session token using Backend SDK authenticateRequest
        const clerk: ClerkClient = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY as string,
          publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string,
        });

        // Build a Request object with Authorization header since we are in WS context
        const headers = new Headers();
        headers.set('Authorization', `Bearer ${token}`);
        const reqForClerk = new Request('http://localhost/internal-socket-auth', { headers });

        const { isSignedIn, toAuth } = await clerk.authenticateRequest(reqForClerk);

        if (!isSignedIn) return next(new Error('Invalid Clerk token'));

        const authData = await toAuth();
        if (!authData.userId) return next(new Error('Invalid Clerk token'));
        user = { userId: authData.userId, userType: 'clerk' };
      } else if (tokenType === 'jwt') {
        // Verify our custom JWT for homestay/admin users
        const { payload } = await jwtVerify(token, ENCODED_JWT_SECRET);
        const homestayId = (payload as JWTPayload & { homestayId?: string }).homestayId;
        const username = (payload as JWTPayload & { username?: string }).username;

        if (!homestayId) return next(new Error('Invalid homestay token'));
        user = { userId: homestayId, userType: 'homestay', username };
      }

      if (!user) return next(new Error('Authentication failed'));

      // Attach user to socket
      (socket as any).user = user;

      // Persist user status to MongoDB and Redis
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

      next();
    } catch (error) {
      console.error('Socket auth error', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const user = (socket as any).user as SocketUser;

    socket.on('join_chat', async ({ chatId }: { chatId: string }) => {
      await addUserToChatRoom(chatId, user.userId, user.userType);
      socket.join(chatId);
    });

    socket.on('leave_chat', async ({ chatId }: { chatId: string }) => {
      await removeUserFromChatRoom(chatId, user.userId, user.userType);
      socket.leave(chatId);
    });

    socket.on('typing', async ({ chatId, isTyping }: { chatId: string; isTyping: boolean }) => {
      const typing: RedisTypingStatus = { chatId, userId: user.userId, userType: user.userType, isTyping };
      getRedisPublisher().publish(REDIS_CHANNELS.TYPING_STATUS, JSON.stringify(typing));
    });

    socket.on('send_message', async ({ chatId, content, messageType }: { chatId: string; content: string; messageType?: 'text' | 'image' | 'file' }) => {
      try {
        const msgDoc = await Message.create({
          messageId: uuidv4(),
          chatId,
          senderId: user.userId,
          senderType: user.userType,
          content,
          messageType: messageType || 'text',
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

        const event: RedisMessage = {
          chatId,
          messageId: msgDoc.messageId,
          senderId: msgDoc.senderId,
          senderType: msgDoc.senderType,
          content: msgDoc.content,
          messageType: msgDoc.messageType,
          timestamp: msgDoc.timestamp,
          // Optionally compute recipient ids based on chat participants
          recipientIds: [],
        };

        getRedisPublisher().publish(REDIS_CHANNELS.NEW_MESSAGE, JSON.stringify(event));
      } catch (err) {
        console.error('send_message handler error', err);
        socket.emit('error_message', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', async () => {
      try {
        await UserStatus.findOneAndUpdate(
          { userId: user.userId, userType: user.userType },
          { isOnline: false, lastActiveAt: new Date(), currentSocketId: undefined },
          { new: true }
        );
        await setChatUserOffline(user.userId, user.userType);

        const statusEvent: RedisUserStatus = {
          userId: user.userId,
          userType: user.userType,
          isOnline: false,
          lastActiveAt: new Date(),
        };
        getRedisPublisher().publish(REDIS_CHANNELS.USER_STATUS, JSON.stringify(statusEvent));
      } catch (err) {
        console.error('Error handling disconnect', err);
      }
    });
  });

  console.log('✅ Socket.IO server initialized successfully');
  return io;
}