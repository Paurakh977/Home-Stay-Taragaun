import mongoose, { Schema, Document, models, Model } from 'mongoose';

// Interface for Message data
export interface IMessage extends Document {
  messageId: string;
  chatId: string; // Reference to Chat
  senderId: string; // Clerk user ID or homestay ID
  senderType: 'clerk' | 'homestay';
  content: string;
  messageType: 'text' | 'image' | 'file';
  attachments?: {
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
  }[];
  readBy: {
    userId: string;
    userType: 'clerk' | 'homestay';
    readAt: Date;
  }[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  replyTo?: string; // Reference to another message ID
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Define the message schema
const messageSchema = new Schema<IMessage>(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    chatId: {
      type: String,
      required: true,
      index: true
    },
    senderId: {
      type: String,
      required: true,
      index: true
    },
    senderType: {
      type: String,
      required: true,
      enum: ['clerk', 'homestay']
    },
    content: {
      type: String,
      required: true
    },
    messageType: {
      type: String,
      required: true,
      enum: ['text', 'image', 'file'],
      default: 'text'
    },
    attachments: [{
      fileName: {
        type: String,
        required: true
      },
      filePath: {
        type: String,
        required: true
      },
      fileType: {
        type: String,
        required: true
      },
      fileSize: {
        type: Number,
        required: true
      }
    }],
    readBy: [{
      userId: {
        type: String,
        required: true
      },
      userType: {
        type: String,
        required: true,
        enum: ['clerk', 'homestay']
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    },
    replyTo: {
      type: String,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'Messages'
  }
);

// Compound indexes for efficient queries
messageSchema.index({ chatId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1, timestamp: -1 });
messageSchema.index({ chatId: 1, isDeleted: 1, timestamp: -1 });

const Message = (models?.Message as Model<IMessage>) || mongoose.model<IMessage>('Message', messageSchema);

export default Message;