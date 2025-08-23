import Redis from 'ioredis';

// Type for message broadcasting structure
export interface RedisMessage {
  chatId: string;
  messageId: string;
  senderId: string;
  senderType: 'clerk' | 'homestay';
  senderName?: string;
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
  userName?: string;
  isTyping: boolean;
}

// Redis connection configuration with enhanced reliability
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
    maxRetriesPerRequest: 1, // Fail fast instead of retrying
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: 5000, // Reduced from 10s to 5s
    commandTimeout: 2000, // Reduced to 2s for faster failure detection
    // Connection pool settings for better performance
    family: 4,
    keepAlive: 30000, // Keep alive timeout in milliseconds
    // Additional performance optimizations
    enableOfflineQueue: false, // Don't queue commands when disconnected
    maxLoadingTimeout: 3000, // Max time to wait for Redis to load data from disk
    retryDelayOnClusterDown: 300,
    // Enhanced reconnection strategy
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      console.log(`🔄 Redis reconnection attempt ${times}, delay: ${delay}ms`);
      return delay;
    },
  } as const;
};

// Redis client instances
let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;
let redisPublisher: Redis | null = null;

// Circuit breaker for Redis operations
let redisFailureCount = 0;
let lastFailureTime = 0;
const MAX_FAILURES = 5;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

const isCircuitBreakerOpen = () => {
  if (redisFailureCount >= MAX_FAILURES) {
    const timeSinceLastFailure = Date.now() - lastFailureTime;
    if (timeSinceLastFailure < CIRCUIT_BREAKER_TIMEOUT) {
      return true;
    } else {
      // Reset circuit breaker after timeout
      redisFailureCount = 0;
      return false;
    }
  }
  return false;
};

const recordRedisFailure = () => {
  redisFailureCount++;
  lastFailureTime = Date.now();
};

const recordRedisSuccess = () => {
  redisFailureCount = 0;
};

// Connection health check
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

export const checkRedisHealth = async (): Promise<boolean> => {
  const now = Date.now();
  
  // Throttle health checks
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return true;
  }
  
  lastHealthCheck = now;

  try {
    if (!redisClient || !redisPublisher || !redisSubscriber) {
      console.log('⚠️ Redis clients not initialized');
      return false;
    }

    // Ping all clients
    await Promise.all([
      redisClient.ping(),
      redisPublisher.ping(),
      redisSubscriber.ping()
    ]);

    console.log('✅ Redis health check passed');
    return true;

  } catch (error) {
    console.error('❌ Redis health check failed:', error);
    return false;
  }
};

// Track if event handlers have been set up to prevent duplicates
let eventHandlersSetup = false;
let healthCheckInterval: NodeJS.Timeout | null = null;

// Initialize Redis connections with enhanced error handling
export const initializeRedis = async () => {
  try {
    const config = getRedisConfig();

    // Main Redis client for general operations
    if (!redisClient) {
      redisClient = new Redis(config);
      redisClient.setMaxListeners(30); // Increase limit to prevent warnings

      // Wait for connection
      await redisClient.connect();
      await redisClient.ping();
      console.log('✅ Redis main client connected successfully');
    }

    // Publisher client for pub/sub
    if (!redisPublisher) {
      redisPublisher = new Redis(config);
      redisPublisher.setMaxListeners(30); // Increase limit to prevent warnings

      await redisPublisher.connect();
      await redisPublisher.ping();
      console.log('✅ Redis publisher connected successfully');
    }

    // Subscriber client for pub/sub
    if (!redisSubscriber) {
      redisSubscriber = new Redis(config);
      redisSubscriber.setMaxListeners(30); // Increase limit to prevent warnings

      await redisSubscriber.connect();
      await redisSubscriber.ping();
      console.log('✅ Redis subscriber connected successfully');
    }

    // Set up comprehensive error handlers only once
    if (!eventHandlersSetup) {
      [
        { client: redisClient, name: 'main' },
        { client: redisPublisher, name: 'publisher' },
        { client: redisSubscriber, name: 'subscriber' }
      ].forEach(({ client, name }) => {
        if (!client) return;

        client.on('error', (error) => {
          console.error(`❌ Redis ${name} client error:`, error);
        });

        client.on('connect', () => {
          console.log(`🔗 Redis ${name} client connected`);
        });

        client.on('ready', () => {
          console.log(`✅ Redis ${name} client ready`);
        });

        client.on('close', () => {
          console.log(`🔌 Redis ${name} client connection closed`);
        });

        client.on('reconnecting', (ms: number) => {
          console.log(`🔄 Redis ${name} client reconnecting in ${ms}ms...`);
        });

        client.on('end', () => {
          console.log(`🔚 Redis ${name} client connection ended`);
        });
      });

      eventHandlersSetup = true;
    }

    // Start periodic health checks only once
    if (!healthCheckInterval) {
      healthCheckInterval = setInterval(checkRedisHealth, HEALTH_CHECK_INTERVAL);
    }

    return { redisClient, redisPublisher, redisSubscriber };

  } catch (error) {
    console.error('❌ Failed to initialize Redis connections:', error);
    throw new Error(`Redis initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get Redis clients with automatic reconnection
export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  
  // Check connection status
  if (redisClient.status !== 'ready') {
    console.warn(`⚠️ Redis main client status: ${redisClient.status}`);
  }
  
  return redisClient;
};

export const getRedisPublisher = () => {
  if (!redisPublisher) {
    throw new Error('Redis publisher not initialized. Call initializeRedis() first.');
  }

  // Check connection status
  if (redisPublisher.status !== 'ready') {
    console.warn(`⚠️ Redis publisher status: ${redisPublisher.status}`);
  }
  
  return redisPublisher;
};

export const getRedisSubscriber = () => {
  if (!redisSubscriber) {
    throw new Error('Redis subscriber not initialized. Call initializeRedis() first.');
  }

  // Check connection status
  if (redisSubscriber.status !== 'ready') {
    console.warn(`⚠️ Redis subscriber status: ${redisSubscriber.status}`);
  }

  return redisSubscriber;
};

// Cleanup function to properly close Redis connections
export const closeRedisConnections = async () => {
  try {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }

    const promises = [];

    if (redisClient) {
      promises.push(redisClient.disconnect());
      redisClient = null;
    }

    if (redisPublisher) {
      promises.push(redisPublisher.disconnect());
      redisPublisher = null;
    }

    if (redisSubscriber) {
      promises.push(redisSubscriber.disconnect());
      redisSubscriber = null;
    }

    await Promise.all(promises);
    eventHandlersSetup = false;
    console.log('✅ All Redis connections closed successfully');
  } catch (error) {
    console.error('❌ Error closing Redis connections:', error);
  }
};

// Enhanced utility functions for chat-related Redis operations
export const setChatUserOnline = async (userId: string, userType: 'clerk' | 'homestay', socketId: string) => {
  try {
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
    
  } catch (error) {
    console.error('❌ Error setting user online status:', error);
    throw error;
  }
};

export const setChatUserOffline = async (userId: string, userType: 'clerk' | 'homestay') => {
  try {
    const client = getRedisClient();
    const key = `user:${userType}:${userId}:status`;
    
    await client.hset(key, {
      isOnline: 'false',
      lastActiveAt: new Date().toISOString(),
    });

    // Remove socketId when offline
    await client.hdel(key, 'socketId');
    
  } catch (error) {
    console.error('❌ Error setting user offline status:', error);
    throw error;
  }
};

export const getUserStatus = async (userId: string, userType: 'clerk' | 'homestay') => {
  try {
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
    
  } catch (error) {
    console.error('❌ Error getting user status:', error);
    return null;
  }
};

export const getSocketIdByUserId = async (userId: string, userType: 'clerk' | 'homestay') => {
  try {
    const client = getRedisClient();
    const key = `user:${userType}:${userId}:status`;
    
    return await client.hget(key, 'socketId');
    
  } catch (error) {
    console.error('❌ Error getting socket ID:', error);
    return null;
  }
};

// Enhanced chat room management with validation
export const addUserToChatRoom = async (chatId: string, userId: string, userType: 'clerk' | 'homestay') => {
  try {
    if (!chatId || !userId || !userType) {
      throw new Error('Invalid parameters for adding user to chat room');
    }

    const client = getRedisClient();
    const key = `chat:${chatId}:users`;
    
    await client.sadd(key, `${userType}:${userId}`);
    await client.expire(key, 86400); // 24 hours
    
    console.log(`✅ User ${userType}:${userId} added to chat room ${chatId}`);
    
  } catch (error) {
    console.error('❌ Error adding user to chat room:', error);
    throw error;
  }
};

export const removeUserFromChatRoom = async (chatId: string, userId: string, userType: 'clerk' | 'homestay') => {
  try {
    if (!chatId || !userId || !userType) {
      throw new Error('Invalid parameters for removing user from chat room');
    }

    const client = getRedisClient();
    const key = `chat:${chatId}:users`;
    
    await client.srem(key, `${userType}:${userId}`);
    
    console.log(`✅ User ${userType}:${userId} removed from chat room ${chatId}`);
    
  } catch (error) {
    console.error('❌ Error removing user from chat room:', error);
    throw error;
  }
};

export const getChatRoomUsers = async (chatId: string) => {
  try {
    if (!chatId) {
      throw new Error('Invalid chatId for getting chat room users');
    }

    const client = getRedisClient();
    const key = `chat:${chatId}:users`;
    
    const users = await client.smembers(key);
    return users.map(user => {
      const [userType, userId] = user.split(':');
      return { userId, userType: userType as 'clerk' | 'homestay' };
    });
    
  } catch (error) {
    console.error('❌ Error getting chat room users:', error);
    return [];
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

// Utility function to safely publish to Redis with timeout and retry
export const safeRedisPublish = async (channel: RedisChannel, data: any, customTimeoutMs?: number) => {
  // Check circuit breaker first
  if (isCircuitBreakerOpen()) {
    console.warn(`⚠️ Redis circuit breaker is open, skipping publish to ${channel}`);
    return false;
  }

  try {
    const publisher = getRedisPublisher();

    // Set different timeout values based on channel priority
    let timeoutMs = customTimeoutMs;
    if (!timeoutMs) {
      switch (channel) {
        case REDIS_CHANNELS.MESSAGE_READ:
          timeoutMs = 2000; // 2s for read receipts (less critical)
          break;
        case REDIS_CHANNELS.TYPING_STATUS:
          timeoutMs = 1000; // 1s for typing indicators (least critical)
          break;
        case REDIS_CHANNELS.NEW_MESSAGE:
          timeoutMs = 5000; // 5s for new messages (most critical)
          break;
        case REDIS_CHANNELS.USER_STATUS:
          timeoutMs = 3000; // 3s for user status
          break;
        default:
          timeoutMs = 3000; // 3s default
      }
    }

    // Check if publisher is ready
    if (publisher.status !== 'ready') {
      console.warn(`⚠️ Redis publisher not ready (status: ${publisher.status}), attempting reconnection...`);

      // Try to reconnect if not ready
      try {
        await publisher.connect();
        await publisher.ping();
      } catch (reconnectError) {
        console.error('❌ Redis publisher reconnection failed:', reconnectError);
        return false;
      }
    }

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Redis publish timeout for channel ${channel}`)), timeoutMs);
    });

    // Race between publish and timeout
    await Promise.race([
      publisher.publish(channel, JSON.stringify(data)),
      timeoutPromise
    ]);

    // Record success for circuit breaker
    recordRedisSuccess();
    return true;

  } catch (error) {
    // Record failure for circuit breaker
    recordRedisFailure();

    if (error instanceof Error && error.message.includes('timeout')) {
      console.warn(`⚠️ Redis publish timeout for channel ${channel}:`, error.message);
    } else {
      console.error('❌ Error publishing to Redis:', error);
    }
    return false;
  }
};

// Non-blocking publish for less critical events (fire-and-forget)
export const nonBlockingRedisPublish = async (channel: RedisChannel, data: any) => {
  // Don't await this - fire and forget
  safeRedisPublish(channel, data).catch(error => {
    // Silently log errors for non-blocking publishes
    console.warn(`⚠️ Non-blocking Redis publish failed for ${channel}:`, error.message);
  });
};

// Batch publishing for high-frequency events
const publishBatch = new Map<RedisChannel, any[]>();
const batchTimeouts = new Map<RedisChannel, NodeJS.Timeout>();
const BATCH_SIZE = 10;
const BATCH_TIMEOUT_MS = 100; // 100ms

export const batchedRedisPublish = async (channel: RedisChannel, data: any) => {
  if (!publishBatch.has(channel)) {
    publishBatch.set(channel, []);
  }

  const batch = publishBatch.get(channel)!;
  batch.push(data);

  // If batch is full, publish immediately
  if (batch.length >= BATCH_SIZE) {
    await flushBatch(channel);
    return;
  }

  // Set timeout to publish batch if not full
  if (!batchTimeouts.has(channel)) {
    const timeoutId = setTimeout(() => {
      flushBatch(channel);
    }, BATCH_TIMEOUT_MS);
    batchTimeouts.set(channel, timeoutId);
  }
};

const flushBatch = async (channel: RedisChannel) => {
  const batch = publishBatch.get(channel);
  if (!batch || batch.length === 0) return;

  // Clear timeout
  const timeoutId = batchTimeouts.get(channel);
  if (timeoutId) {
    clearTimeout(timeoutId);
    batchTimeouts.delete(channel);
  }

  // Publish batch as a single message
  await nonBlockingRedisPublish(channel, { batch, timestamp: Date.now() });

  // Clear batch
  publishBatch.set(channel, []);
};

// Emergency reconnection function
export const forceRedisReconnection = async () => {
  try {
    console.log('🔄 Force reconnecting Redis clients...');
    
    await closeRedisConnections();
    await initializeRedis();
    
    console.log('✅ Redis force reconnection completed');
    return true;
    
  } catch (error) {
    console.error('❌ Redis force reconnection failed:', error);
    return false;
  }
};