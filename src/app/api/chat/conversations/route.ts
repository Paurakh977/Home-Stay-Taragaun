import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Chat, type IChat } from '@/lib/models';
import { auth } from '@clerk/nextjs/server';
import { jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { getRedisPublisher, REDIS_CHANNELS } from '@/lib/redis';

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

// GET - Fetch user's conversations
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await Chat.find({
      'participants.userId': user.userId,
      'participants.userType': user.userType,
      isActive: true,
    })
    .sort({ lastActivity: -1 })
    .limit(50)
    .lean();

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participantId, participantType } = await request.json();

    if (!participantId || !participantType) {
      return NextResponse.json({ error: 'Missing participant information' }, { status: 400 });
    }

    if (participantType !== 'clerk' && participantType !== 'homestay') {
      return NextResponse.json({ error: 'Invalid participant type' }, { status: 400 });
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
      return NextResponse.json({ conversation: existingChat });
    }

    // Create new conversation
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

    // Publish chat created event via Redis
    try {
      const chatCreatedEvent = {
        chatId: newChat.chatId,
        participants: newChat.participants,
        createdBy: user.userId,
        createdByType: user.userType,
        timestamp: new Date(),
      };

      getRedisPublisher().publish(REDIS_CHANNELS.CHAT_CREATED, JSON.stringify(chatCreatedEvent));
    } catch (redisError) {
      console.error('Failed to publish chat created event:', redisError);
      // Don't fail the request if Redis publish fails
    }

    return NextResponse.json({ conversation: newChat }, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}