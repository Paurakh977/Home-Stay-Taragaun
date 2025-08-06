// Chat-related types for frontend use
export interface ChatParticipant {
  userId: string;
  userType: 'clerk' | 'homestay';
  joinedAt: string;
  lastReadAt?: string;
  // Profile data (fetched from Clerk API or homestay model)
  name?: string;
  avatar?: string;
  username?: string;
}

export interface ChatData {
  _id: string;
  chatId: string;
  participants: ChatParticipant[];
  chatType: 'direct';
  lastMessage?: {
    content: string;
    senderId: string;
    senderType: 'clerk' | 'homestay';
    timestamp: string;
    messageType: 'text' | 'image' | 'file';
  };
  lastActivity: string;
  isActive: boolean;
  unreadCount?: number; // Calculated field
  createdAt: string;
  updatedAt: string;
}

export interface MessageData {
  _id: string;
  messageId: string;
  chatId: string;
  senderId: string;
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
    readAt: string;
  }[];
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  replyTo?: string;
  timestamp: string;
  // Profile data (populated from Clerk API or homestay model)
  senderName?: string;
  senderAvatar?: string;
  isSelf?: boolean; // Calculated field
  createdAt: string;
  updatedAt: string;
}

export interface UserStatusData {
  userId: string;
  userType: 'clerk' | 'homestay';
  isOnline: boolean;
  lastActiveAt: string;
  name?: string;
  avatar?: string;
}