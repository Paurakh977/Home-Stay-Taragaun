import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Message, Chat } from '@/lib/models';
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

// GET - Fetch messages for a chat
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');

    if (!chatId) {
      return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });
    }

    const query: any = { chatId, isDeleted: { $ne: true } };
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, content, messageType } = await request.json();

    if (!chatId || !content) {
      return NextResponse.json({ error: 'Missing chatId or content' }, { status: 400 });
    }

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

    // Publish new message event via Redis
    try {
      const event = {
        chatId,
        messageId: msgDoc.messageId,
        senderId: msgDoc.senderId,
        senderType: msgDoc.senderType,
        content: msgDoc.content,
        messageType: msgDoc.messageType,
        timestamp: msgDoc.timestamp,
        recipientIds: [],
      };
      getRedisPublisher().publish(REDIS_CHANNELS.NEW_MESSAGE, JSON.stringify(event));
    } catch (redisError) {
      console.error('Failed to publish new message event:', redisError);
      // Don't fail the request if Redis publish fails
    }

    return NextResponse.json({ message: msgDoc }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}