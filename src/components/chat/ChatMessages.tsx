import React, { useRef, useEffect } from 'react';
import { format } from 'date-fns';

export interface Message {
  id: string;
  sender: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isSelf: boolean;
  isRead?: boolean;
}

interface ChatMessagesProps {
  messages: Message[];
  typingUsers?: string[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, typingUsers = [] }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to format time
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    // If it's already in HH:MM AM/PM format, just return it
    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(timeString)) {
      return timeString;
    }
    
    // Try to parse as date
    try {
      const date = new Date(timeString);
      return format(date, 'h:mm a');
    } catch {
      return timeString;
    }
  };

  return (
    <div className="px-4 py-2">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={`flex mb-4 ${message.isSelf ? 'justify-end' : 'justify-start'}`}
        >
          {!message.isSelf && (
            <div className="flex-shrink-0 mr-3">
              {message.senderAvatar ? (
                <div className="h-8 w-8 rounded-full overflow-hidden">
                  <img
                    src={message.senderAvatar}
                    alt={message.sender}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {message.sender.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          )}
          <div className={`max-w-[75%] ${message.isSelf ? 'order-1' : 'order-2'}`}>
            {!message.isSelf && (
              <p className="text-xs text-gray-600 mb-1">{message.sender}</p>
            )}
            <div
              className={`px-4 py-2 rounded-lg ${
                message.isSelf
                  ? 'bg-primary text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              <p className={`text-sm ${message.isSelf ? 'text-white' : 'text-gray-800'}`}>{message.content}</p>
            </div>
            <div className={`flex items-center mt-1 gap-1 ${message.isSelf ? 'justify-end' : 'justify-start'}`}>
              <p className="text-xs text-gray-500">
                {formatTime(message.timestamp)}
              </p>
              {message.isSelf && (
                <span className="text-xs text-gray-500">
                  {message.isRead ? '✓✓' : '✓'}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {/* Typing indicators */}
      {typingUsers.length > 0 && (
        <div className="flex mb-4 justify-start">
          <div className="flex-shrink-0 mr-3">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">...</span>
            </div>
          </div>
          <div className="max-w-[75%]">
            <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 rounded-bl-none">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
            <p className="text-xs mt-1 text-gray-500">
              {typingUsers.length === 1 
                ? `${typingUsers[0]} is typing...` 
                : `${typingUsers.length} people are typing...`
              }
            </p>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;