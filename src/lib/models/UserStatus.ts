import mongoose, { Schema, Document, models, Model } from 'mongoose';

// Interface for User Status data
export interface IUserStatus extends Document {
  userId: string; // Clerk user ID or homestay ID
  userType: 'clerk' | 'homestay';
  isOnline: boolean;
  lastActiveAt: Date;
  currentSocketId?: string; // For Socket.io connection tracking
  deviceInfo?: {
    userAgent: string;
    platform: string;
    browser: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Define the user status schema
const userStatusSchema = new Schema<IUserStatus>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    userType: {
      type: String,
      required: true,
      enum: ['clerk', 'homestay']
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    currentSocketId: {
      type: String,
      sparse: true
    },
    deviceInfo: {
      userAgent: String,
      platform: String,
      browser: String
    }
  },
  {
    timestamps: true,
    collection: 'UserStatuses'
  }
);

// Compound indexes
userStatusSchema.index({ userType: 1, isOnline: 1 });
userStatusSchema.index({ userId: 1, userType: 1 }, { unique: true });

const UserStatus = (models?.UserStatus as Model<IUserStatus>) || mongoose.model<IUserStatus>('UserStatus', userStatusSchema);

export default UserStatus;