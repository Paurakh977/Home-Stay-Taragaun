import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Message, Chat } from '@/lib/models';
import { auth } from '@clerk/nextjs/server';
import { jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { getRedisPublisher, REDIS_CHANNELS, initializeRedis, type RedisMessage } from '@/lib/redis';

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
    console.error('Clerk authentication error:', error);
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
      console.error('JWT verification error:', error);
    }
  }

  return null;
}

// Verify user authorization for chat access
async function verifyUserChatAccess(user: { userId: string; userType: 'clerk' | 'homestay' }, chatId: string) {
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

// GET - Fetch messages for a chat
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
    const chatId = searchParams.get('chatId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');
    const after = searchParams.get('after');

    if (!chatId) {
      return NextResponse.json({ error: 'Missing chatId parameter' }, { status: 400 });
    }

    // Verify user has access to this chat
    const hasAccess = await verifyUserChatAccess(user, chatId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: No access to this chat' }, { status: 403 });
    }

    // Validate and sanitize limit
    const validLimit = Math.min(Math.max(limit, 1), 100);

    // Build query
    const query: any = { 
      chatId, 
      isDeleted: { $ne: true } 
    };

    if (before) {
      query.timestamp = { $lt: new Date(before) };
    } else if (after) {
      query.timestamp = { $gt: new Date(after) };
    }

    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(validLimit)
      .lean();

    // Reverse to get chronological order
    const sortedMessages = messages.reverse();

    return NextResponse.json({ 
      messages: sortedMessages,
      pagination: {
        limit: validLimit,
        before,
        after,
        hasMore: messages.length === validLimit
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    // Initialize database and Redis connections
    await dbConnect();
    await initializeRedis();

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chatId, content, messageType, replyTo } = body;

    // Input validation
    if (!chatId || !content) {
      return NextResponse.json({ error: 'Missing required fields: chatId and content' }, { status: 400 });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content must be a non-empty string' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Message content too long (max 5000 characters)' }, { status: 400 });
    }

    const validMessageType = messageType && ['text', 'image', 'file'].includes(messageType) ? messageType : 'text';

    // Verify user has access to this chat
    const hasAccess = await verifyUserChatAccess(user, chatId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: No access to this chat' }, { status: 403 });
    }

    // Validate replyTo message exists if provided
    if (replyTo) {
      const replyMessage = await Message.findOne({ 
        messageId: replyTo, 
        chatId,
        isDeleted: { $ne: true }
      });
      
      if (!replyMessage) {
        return NextResponse.json({ error: 'Reply target message not found' }, { status: 400 });
      }
    }

    // Create message
    const messageId = uuidv4();
    const msgDoc = await Message.create({
      messageId,
      chatId,
      senderId: user.userId,
      senderType: user.userType,
      content: content.trim(),
      messageType: validMessageType,
      timestamp: new Date(),
      readBy: [{ 
        userId: user.userId, 
        userType: user.userType, 
        readAt: new Date() 
      }],
      replyTo: replyTo || undefined,
    });

    // Update chat last message and activity
    const chatUpdateResult = await Chat.findOneAndUpdate(
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
      },
      { new: true }
    );

    if (!chatUpdateResult) {
      console.error('Failed to update chat with last message');
    }

    // Get chat participants for recipient targeting
    const chat = await Chat.findOne({ chatId }).select('participants');
    const recipientIds = chat?.participants
      .filter(p => !(p.userId === user.userId && p.userType === user.userType))
      .map(p => p.userId) || [];

    // Publish new message event via Redis with comprehensive error handling
    try {
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

      const publisher = getRedisPublisher();
      await publisher.publish(REDIS_CHANNELS.NEW_MESSAGE, JSON.stringify(event));
      console.log('✅ New message event published to Redis');

    } catch (redisError) {
      console.error('❌ Failed to publish new message event:', redisError);
      // Don't fail the request if Redis publish fails, but log it
    }

    return NextResponse.json({ 
      message: msgDoc,
      success: true 
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending message:', error);
    
    // Handle specific validation errors
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: 'Validation error', details: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH - Update message (edit/delete)
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    await initializeRedis();

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, action, content } = await request.json();

    if (!messageId || !action) {
      return NextResponse.json({ error: 'Missing messageId or action' }, { status: 400 });
    }

    // Find the message and verify ownership
    const message = await Message.findOne({ 
      messageId,
      senderId: user.userId,
      senderType: user.userType,
      isDeleted: { $ne: true }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    // Verify user has access to the chat
    const hasAccess = await verifyUserChatAccess(user, message.chatId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: No access to this chat' }, { status: 403 });
    }

    let updateResult;

    switch (action) {
      case 'edit':
        if (!content || content.trim().length === 0) {
          return NextResponse.json({ error: 'Content required for edit action' }, { status: 400 });
        }
        
        if (content.length > 5000) {
          return NextResponse.json({ error: 'Message content too long (max 5000 characters)' }, { status: 400 });
        }

        updateResult = await Message.findOneAndUpdate(
          { messageId },
          { 
            content: content.trim(),
            isEdited: true,
            editedAt: new Date()
          },
          { new: true }
        );
        break;

      case 'delete':
        updateResult = await Message.findOneAndUpdate(
          { messageId },
          { 
            isDeleted: true,
            deletedAt: new Date()
          },
          { new: true }
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ message: updateResult });

  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}