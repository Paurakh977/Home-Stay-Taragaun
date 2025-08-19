import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Chat, type IChat } from '@/lib/models';
import { auth } from '@clerk/nextjs/server';
import { jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { getRedisPublisher, REDIS_CHANNELS, initializeRedis } from '@/lib/redis';

// JWT verification for homestay users
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
const ENCODED_JWT_SECRET = new TextEncoder().encode(JWT_SECRET);

async function getUserFromRequest(request: NextRequest) {
  // Check for Clerk authentication first
  try {
    const { userId } = await auth();
    if (userId) {
      return { userId, userType: 'clerk' as const };
    }
  } catch (error) {
    // Clerk auth failed, continue to JWT check
  }

  // Check for JWT token (homestay/admin users)
  const authToken = request.cookies.get('auth_token')?.value;
  if (authToken) {
    try {
      const { payload } = await jwtVerify(authToken, ENCODED_JWT_SECRET);
      const homestayId = (payload as any).homestayId;
      if (homestayId) {
        return { userId: homestayId, userType: 'homestay' as const };
      }
    } catch (error) {
      // JWT verification failed
    }
  }

  return null;
}

// Verify user authorization for chat access
async function verifyUserChatAccess(user: { userId: string; userType: 'clerk' | 'homestay' }, chatId?: string) {
  if (!chatId) return true; // For creating new chats

  const chat = await Chat.findOne({ 
    chatId,
    'participants.userId': user.userId,
    'participants.userType': user.userType,
    isActive: true 
  });

  return !!chat;
}

// GET - Fetch user's conversations
export async function GET(request: NextRequest) {
  try {
    // Initialize database and Redis connections
    await dbConnect();
    await initializeRedis();

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate limit bounds
    const validLimit = Math.min(Math.max(limit, 1), 100);

    const conversations = await Chat.find({
      'participants.userId': user.userId,
      'participants.userType': user.userType,
      isActive: true,
    })
    .sort({ lastActivity: -1 })
    .skip(offset)
    .limit(validLimit)
    .lean();

    return NextResponse.json({ 
      conversations,
      pagination: {
        limit: validLimit,
        offset,
        total: conversations.length
      }
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    // Initialize database and Redis connections
    await dbConnect();
    await initializeRedis();

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participantId, participantType } = await request.json();

    // Validation
    if (!participantId || !participantType) {
      return NextResponse.json({ error: 'Missing participant information' }, { status: 400 });
    }

    if (participantType !== 'clerk' && participantType !== 'homestay') {
      return NextResponse.json({ error: 'Invalid participant type' }, { status: 400 });
    }

    // Prevent users from creating conversations with themselves
    if (user.userId === participantId && user.userType === participantType) {
      return NextResponse.json({ error: 'Cannot create conversation with yourself' }, { status: 400 });
    }

    // Validate participant limits (max 2 for direct chat)
    const participantCount = 2;
    if (participantCount > 2) {
      return NextResponse.json({ error: 'Direct chats can only have 2 participants' }, { status: 400 });
    }

    // Check if conversation already exists
    const existingChat = await Chat.findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: user.userId, userType: user.userType } },
          { $elemMatch: { userId: participantId, userType: participantType } }
        ]
      },
      chatType: 'direct',
      isActive: true,
    });

    if (existingChat) {
      return NextResponse.json({ 
        conversation: existingChat,
        isNew: false 
      });
    }

    // Create new conversation with validation
    const chatId = uuidv4();
    const newChat = await Chat.create({
      chatId,
      participants: [
        {
          userId: user.userId,
          userType: user.userType,
          joinedAt: new Date(),
          lastReadAt: new Date(),
        },
        {
          userId: participantId,
          userType: participantType,
          joinedAt: new Date(),
          lastReadAt: new Date(),
        }
      ],
      chatType: 'direct',
      lastActivity: new Date(),
      isActive: true,
    });

    // Publish chat created event via Redis with error handling
    try {
      const chatCreatedEvent = {
        chatId: newChat.chatId,
        participants: newChat.participants,
        createdBy: user.userId,
        createdByType: user.userType,
        timestamp: new Date(),
      };

      const publisher = getRedisPublisher();
      await publisher.publish(REDIS_CHANNELS.CHAT_CREATED, JSON.stringify(chatCreatedEvent));
      console.log('✅ Chat created event published to Redis');

    } catch (redisError) {
      console.error('❌ Failed to publish chat created event:', redisError);
      // Don't fail the request if Redis publish fails
    }

    return NextResponse.json({ 
      conversation: newChat,
      isNew: true 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating conversation:', error);
    
    // Handle specific MongoDB errors
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({ error: 'Conversation already exists' }, { status: 409 });
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH - Update conversation (e.g., mark as read)
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    await initializeRedis();

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, action, timestamp } = await request.json();

    if (!chatId || !action) {
      return NextResponse.json({ error: 'Missing chatId or action' }, { status: 400 });
    }

    // Verify user has access to this chat
    const hasAccess = await verifyUserChatAccess(user, chatId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: No access to this chat' }, { status: 403 });
    }

    let updateResult;

    switch (action) {
      case 'mark_read':
        updateResult = await Chat.findOneAndUpdate(
          { 
            chatId,
            'participants.userId': user.userId,
            'participants.userType': user.userType 
          },
          { 
            $set: { 
              'participants.$.lastReadAt': timestamp ? new Date(timestamp) : new Date() 
            }
          },
          { new: true }
        );
        break;

      case 'archive':
        updateResult = await Chat.findOneAndUpdate(
          { 
            chatId,
            'participants.userId': user.userId,
            'participants.userType': user.userType 
          },
          { 
            isActive: false 
          },
          { new: true }
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!updateResult) {
      return NextResponse.json({ error: 'Chat not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ conversation: updateResult });

  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}