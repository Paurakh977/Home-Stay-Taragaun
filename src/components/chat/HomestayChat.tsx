'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Phone } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@clerk/nextjs';
import MessageInput from './MessageInput';
import type { MessageData } from '@/types/chat';

interface HomestayChatProps {
  homestayId: string;
  homestayName: string;
  homestayImage?: string;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isSelf: boolean;
}

const HomestayChat: React.FC<HomestayChatProps> = ({
  homestayId,
  homestayName,
  homestayImage,
  onClose
}) => {
  const { isSignedIn } = useAuth();
  const {
    conversations,
    messages,
    isConnected,
    setCurrentChat,
    sendMessage,
    startTyping,
    stopTyping,
    createConversation,
    fetchConversations
  } = useChat();

  const [chatId, setChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Convert MessageData to ChatMessage format
  const convertMessages = (msgs: MessageData[]): ChatMessage[] => {
    return msgs.map(msg => ({
      id: msg.messageId,
      sender: msg.isSelf ? 'You' : homestayName,
      senderAvatar: msg.isSelf ? undefined : homestayImage,
      content: msg.content,
      timestamp: new Date(msg.timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      isSelf: msg.isSelf || false
    }));
  };

  // Initialize chat when component mounts
  useEffect(() => {
    const initializeChat = async () => {
      if (!isSignedIn || !isConnected) {
        setIsLoading(false);
        return;
      }

      try {
        // First, fetch conversations to see if one already exists
        await fetchConversations();

        // Look for existing conversation with this homestay
        const existingConversation = conversations.find(conv =>
          conv.participants.some(p =>
            p.userId === homestayId && p.userType === 'homestay'
          )
        );

        if (existingConversation) {
          setChatId(existingConversation.chatId);
          setCurrentChat(existingConversation.chatId);
        } else {
          // Create new conversation
          const newChatId = await createConversation(homestayId, 'homestay');
          if (newChatId) {
            setChatId(newChatId);
            setCurrentChat(newChatId);
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [isSignedIn, isConnected, homestayId, conversations, createConversation, setCurrentChat, fetchConversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatId]);

  // Handle send message
  const handleSendMessage = (message: string) => {
    if (!chatId || !message.trim()) return;
    sendMessage(chatId, message.trim());
  };

  // Handle typing start
  const handleTypingStart = () => {
    if (chatId) {
      startTyping(chatId);
    }
  };

  // Handle typing stop
  const handleTypingStop = () => {
    if (chatId) {
      stopTyping(chatId);
    }
  };

  const chatMessages = chatId ? convertMessages(messages[chatId] || []) : [];

  if (!isSignedIn) {
    return (
      <div className="fixed bottom-20 right-6 md:right-8 z-40 w-[calc(100%-24px)] md:w-[340px] bg-white rounded-lg shadow-xl border border-gray-200 p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Sign in to Chat</h3>
        <p className="text-gray-600 mb-4">Please sign in to start a conversation with {homestayName}.</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div 
      className="fixed bottom-20 right-6 md:right-8 z-40 w-[calc(100%-24px)] md:w-[340px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col"
      style={{ 
        height: 'calc(80vh - 100px)',
        maxHeight: '550px',
        animation: 'slideUp 0.2s ease-out forwards'
      }}
    >
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between bg-white rounded-t-lg sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {homestayImage ? (
            <div className="relative h-10 w-10 rounded-full overflow-hidden">
              <Image
                src={homestayImage}
                alt={homestayName}
                fill
                className="object-cover"
                unoptimized={true}
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center">
              {homestayName.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-medium text-gray-900 text-sm">{homestayName}</h3>
            <p className="text-xs text-gray-500">
              {isConnected ? 'Online' : 'Connecting...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <Phone className="h-4 w-4" />
          </button>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Chat Messages Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">Start a conversation with {homestayName}</p>
          </div>
        ) : (
          <>
            {/* Date separator */}
            <div className="flex justify-center my-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Today</span>
            </div>

            {/* Messages */}
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex items-end gap-2 ${message.isSelf ? 'justify-end' : ''}`}>
                {!message.isSelf && message.senderAvatar && (
                  <div className="relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={message.senderAvatar}
                      alt={message.sender}
                      fill
                      className="object-cover"
                      unoptimized={true}
                    />
                  </div>
                )}
                {message.isSelf && <span className="text-xs text-gray-400">{message.timestamp}</span>}
                <div className={`rounded-lg p-3 max-w-[80%] text-sm shadow-sm ${
                  message.isSelf 
                    ? 'bg-primary text-white rounded-br-none' 
                    : 'bg-white text-gray-900 rounded-bl-none border'
                }`}>
                  <p>{message.content}</p>
                </div>
                {!message.isSelf && <span className="text-xs text-gray-400">{message.timestamp}</span>}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Message Input */}
      <div className="flex-none">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          disabled={!isConnected || !chatId}
        />
      </div>
    </div>
  );
};

export default HomestayChat;
