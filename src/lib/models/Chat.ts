import mongoose, { Schema, Document, models, Model } from 'mongoose';

// Interface for Chat Participant
interface IChatParticipant {
  userId: string; // Clerk user ID or homestay ID
  userType: 'clerk' | 'homestay'; // Type of user
  joinedAt: Date;
  lastReadAt?: Date; // When they last read messages
}

// Interface for Chat data
export interface IChat extends Document {
  chatId: string; // Unique chat identifier
  participants: IChatParticipant[];
  chatType: 'direct'; // For future expansion (group chats)
  lastMessage?: {
    content: string;
    senderId: string;
    senderType: 'clerk' | 'homestay';
    timestamp: Date;
    messageType: 'text' | 'image' | 'file';
  };
  lastActivity: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the chat schema
const chatSchema = new Schema<IChat>(
  {
    chatId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    participants: [{
      userId: {
        type: String,
        required: true
      },
      userType: {
        type: String,
        required: true,
        enum: ['clerk', 'homestay']
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      lastReadAt: {
        type: Date,
        default: Date.now
      }
    }],
    chatType: {
      type: String,
      required: true,
      enum: ['direct'],
      default: 'direct'
    },
    lastMessage: {
      content: String,
      senderId: String,
      senderType: {
        type: String,
        enum: ['clerk', 'homestay']
      },
      timestamp: Date,
      messageType: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
      }
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'Chats'
  }
);

// Compound indexes for efficient queries
chatSchema.index({ 'participants.userId': 1, lastActivity: -1 });
chatSchema.index({ 'participants.userId': 1, 'participants.userType': 1 });

const Chat = (models?.Chat as Model<IChat>) || mongoose.model<IChat>('Chat', chatSchema);

export default Chat;