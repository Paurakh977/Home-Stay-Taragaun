import Redis from 'ioredis';

// Type for message broadcasting structure
export interface RedisMessage {
  chatId: string;
  messageId: string;
  senderId: string;
  senderType: 'clerk' | 'homestay';
  content: string;
  messageType: 'text' | 'image' | 'file';
  timestamp: Date;
  recipientIds: string[];
}

// Type for user status broadcasting
export interface RedisUserStatus {
  userId: string;
  userType: 'clerk' | 'homestay';
  isOnline: boolean;
  lastActiveAt: Date;
  socketId?: string;
}

// Type for typing indicator broadcasting
export interface RedisTypingStatus {
  chatId: string;
  userId: string;
  userType: 'clerk' | 'homestay';
  isTyping: boolean;
}

// Redis connection configuration
const getRedisConfig = () => {
  // Support multiple env var names for host for compatibility
  const host = process.env.REDIS_HOST || process.env.REDISDB_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379');
  const username = process.env.REDIS_USERNAME;
  const password = process.env.REDIS_PASSWORD;
  const db = parseInt(process.env.REDIS_DB || '0');

  return {
    host,
    port,
    username,
    password,
    db,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
    // Connection pool settings
    family: 4,
    keepAlive: 30000, // Keep alive timeout in milliseconds
  } as const;
};

// Redis client instances
let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;
let redisPublisher: Redis | null = null;

// Initialize Redis connections
export const initializeRedis = async () => {
  try {
    const config = getRedisConfig();

    // Main Redis client for general operations
    if (!redisClient) {
      redisClient = new Redis(config);
      await redisClient.ping();
      console.log('✅ Redis main client connected successfully');
    }

    // Publisher client for pub/sub
    if (!redisPublisher) {
      redisPublisher = new Redis(config);
      await redisPublisher.ping();
      console.log('✅ Redis publisher connected successfully');
    }

    // Subscriber client for pub/sub
    if (!redisSubscriber) {
      redisSubscriber = new Redis(config);
      await redisSubscriber.ping();
      console.log('✅ Redis subscriber connected successfully');
    }

    // Set up error handlers
    [redisClient, redisPublisher, redisSubscriber].forEach((client, index) => {
      const clientName = ['main', 'publisher', 'subscriber'][index];
      client?.on('error', (error) => {
        console.error(`❌ Redis ${clientName} client error:`, error);
      });

      client?.on('connect', () => {
        console.log(`🔗 Redis ${clientName} client connected`);
      });

      client?.on('ready', () => {
        console.log(`✅ Redis ${clientName} client ready`);
      });

      client?.on('close', () => {
        console.log(`🔌 Redis ${clientName} client connection closed`);
      });

      client?.on('reconnecting', () => {
        console.log(`🔄 Redis ${clientName} client reconnecting...`);
      });
    });

    return { redisClient, redisPublisher, redisSubscriber };
  } catch (error) {
    console.error('❌ Failed to initialize Redis connections:', error);
    throw error;
  }
};

// Get Redis clients
export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
};

export const getRedisPublisher = () => {
  if (!redisPublisher) {
    throw new Error('Redis publisher not initialized. Call initializeRedis() first.');
  }
  return redisPublisher;
};

export const getRedisSubscriber = () => {
  if (!redisSubscriber) {
    throw new Error('Redis subscriber not initialized. Call initializeRedis() first.');
  }
  return redisSubscriber;
};

// Utility functions for chat-related Redis operations
export const setChatUserOnline = async (userId: string, userType: 'clerk' | 'homestay', socketId: string) => {
  const client = getRedisClient();
  const key = `user:${userType}:${userId}:status`;
  
  await client.hset(key, {
    isOnline: 'true',
    lastActiveAt: new Date().toISOString(),
    socketId,
    userType,
  });

  // Set expiry for auto-cleanup
  await client.expire(key, 7200); // 2 hours
};

export const setChatUserOffline = async (userId: string, userType: 'clerk' | 'homestay') => {
  const client = getRedisClient();
  const key = `user:${userType}:${userId}:status`;
  
  await client.hset(key, {
    isOnline: 'false',
    lastActiveAt: new Date().toISOString(),
  });

  // Remove socketId when offline
  await client.hdel(key, 'socketId');
};

export const getUserStatus = async (userId: string, userType: 'clerk' | 'homestay') => {
  const client = getRedisClient();
  const key = `user:${userType}:${userId}:status`;
  
  const status = await client.hgetall(key);
  if (!status || Object.keys(status).length === 0) {
    return null;
  }

  return {
    userId,
    userType,
    isOnline: status.isOnline === 'true',
    lastActiveAt: new Date(status.lastActiveAt),
    socketId: status.socketId,
  };
};

export const getSocketIdByUserId = async (userId: string, userType: 'clerk' | 'homestay') => {
  const client = getRedisClient();
  const key = `user:${userType}:${userId}:status`;
  
  return await client.hget(key, 'socketId');
};

// Chat room management
export const addUserToChatRoom = async (chatId: string, userId: string, userType: 'clerk' | 'homestay') => {
  const client = getRedisClient();
  const key = `chat:${chatId}:users`;
  
  await client.sadd(key, `${userType}:${userId}`);
  await client.expire(key, 86400); // 24 hours
};

export const removeUserFromChatRoom = async (chatId: string, userId: string, userType: 'clerk' | 'homestay') => {
  const client = getRedisClient();
  const key = `chat:${chatId}:users`;
  
  await client.srem(key, `${userType}:${userId}`);
};

export const getChatRoomUsers = async (chatId: string) => {
  const client = getRedisClient();
  const key = `chat:${chatId}:users`;
  
  const users = await client.smembers(key);
  return users.map(user => {
    const [userType, userId] = user.split(':');
    return { userId, userType: userType as 'clerk' | 'homestay' };
  });
};

// Clean up Redis connections
export const closeRedisConnections = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
      console.log('🔌 Redis main client disconnected');
    }

    if (redisPublisher) {
      await redisPublisher.quit();
      redisPublisher = null;
      console.log('🔌 Redis publisher disconnected');
    }

    if (redisSubscriber) {
      await redisSubscriber.quit();
      redisSubscriber = null;
      console.log('🔌 Redis subscriber disconnected');
    }
  } catch (error) {
    console.error('❌ Error closing Redis connections:', error);
  }
};

// Redis channels for pub/sub
export const REDIS_CHANNELS = {
  NEW_MESSAGE: 'chat:new_message',
  USER_STATUS: 'chat:user_status',
  TYPING_STATUS: 'chat:typing_status',
  MESSAGE_READ: 'chat:message_read',
  CHAT_CREATED: 'chat:chat_created',
} as const;

export type RedisChannel = typeof REDIS_CHANNELS[keyof typeof REDIS_CHANNELS];