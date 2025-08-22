import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Chat, HomestaySingle, Message, type IChat } from '@/lib/models';
import { auth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/backend';
import { jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { getRedisPublisher, REDIS_CHANNELS, initializeRedis } from '@/lib/redis';

// JWT verification for homestay users
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
const ENCODED_JWT_SECRET = new TextEncoder().encode(JWT_SECRET);

async function getUserFromRequest(request: NextRequest) {
  // Check for Authorization header first (for client-side requests)
  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      // Try to verify as Clerk token
      const clerk = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY!,
        publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
      });

      const { toAuth } = await clerk.authenticateRequest(request);
      const authData = toAuth();
      if (authData && authData.userId) {
        return { userId: authData.userId, userType: 'clerk' as const };
      }
    } catch (error) {
      console.log('Clerk token verification failed, trying JWT...');

      // Try to verify as JWT token
      try {
        const { payload } = await jwtVerify(token, ENCODED_JWT_SECRET);
        const homestayId = (payload as any).homestayId;
        if (homestayId) {
          return { userId: homestayId, userType: 'homestay' as const };
        }
      } catch (jwtError) {
        console.log('JWT token verification also failed');
      }
    }
  }

  // Fallback to server-side auth (for server-side requests)
  try {
    const { userId } = await auth();
    if (userId) {
      return { userId, userType: 'clerk' as const };
    }
  } catch (error) {
    // Clerk auth failed, continue to JWT check
  }

  // Check for JWT token in cookies (homestay/admin users)
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

// Enrich participant data with user information
async function enrichParticipantData(participants: any[]) {
  const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  });

  const enrichedParticipants = await Promise.all(
    participants.map(async (participant) => {
      try {
        if (participant.userType === 'clerk') {
          // Get Clerk user data
          const user = await clerk.users.getUser(participant.userId);
          return {
            ...participant,
            name: user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || 'Unknown User',
            avatar: user.imageUrl || null,
            email: user.emailAddresses[0]?.emailAddress || null,
          };
        } else if (participant.userType === 'homestay') {
          // Get homestay data
          const homestay = await HomestaySingle.findOne({ homestayId: participant.userId }).lean();
          if (homestay) {
            return {
              ...participant,
              name: homestay.homeStayName || homestay.name || 'Unknown Homestay',
              avatar: homestay.profileImage || null,
              email: homestay.email || null,
            };
          }
        }
      } catch (error) {
        console.error(`Error enriching participant ${participant.userId}:`, error);
      }

      // Fallback for failed enrichment
      return {
        ...participant,
        name: 'Unknown User',
        avatar: null,
        email: null,
      };
    })
  );

  return enrichedParticipants;
}

// Calculate unread message count for a user in a chat
async function calculateUnreadCount(chatId: string, userId: string, userType: 'clerk' | 'homestay') {
  try {
    // Get the user's lastReadAt timestamp from the chat participants
    const chat = await Chat.findOne({
      chatId,
      'participants.userId': userId,
      'participants.userType': userType
    }).lean();

    if (!chat) return 0;

    const participant = chat.participants.find(p => p.userId === userId && p.userType === userType);
    const lastReadAt = participant?.lastReadAt || new Date(0); // Default to epoch if never read

    // Count messages sent after lastReadAt that are not from this user
    const unreadCount = await Message.countDocuments({
      chatId,
      timestamp: { $gt: lastReadAt },
      $or: [
        { senderId: { $ne: userId } },
        { senderType: { $ne: userType } }
      ]
    });

    return unreadCount;
  } catch (error) {
    console.error('Error calculating unread count:', error);
    return 0;
  }
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

    // Enrich conversations with participant data and unread counts
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const enrichedParticipants = await enrichParticipantData(conversation.participants);
        const unreadCount = await calculateUnreadCount(conversation.chatId, user.userId, user.userType);
        return {
          ...conversation,
          participants: enrichedParticipants,
          unreadCount,
        };
      })
    );

    return NextResponse.json({
      conversations: enrichedConversations,
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
      // Enrich existing chat with participant data
      const enrichedParticipants = await enrichParticipantData(existingChat.participants);
      const enrichedChat = {
        ...existingChat.toObject(),
        participants: enrichedParticipants,
      };

      return NextResponse.json({
        conversation: enrichedChat,
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

    // Enrich new chat with participant data
    const enrichedParticipants = await enrichParticipantData(newChat.participants);
    const enrichedNewChat = {
      ...newChat.toObject(),
      participants: enrichedParticipants,
    };

    return NextResponse.json({
      conversation: enrichedNewChat,
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