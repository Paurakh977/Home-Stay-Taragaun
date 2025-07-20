import React, { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface Message {
  id: string;
  sender: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isSelf: boolean;
}

interface ChatMessagesProps {
  messages: Message[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        {/* Date separator */}
        <div className="flex justify-center my-4">
          <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
            Today
          </div>
        </div>
        
        {/* Messages */}
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`flex mb-4 ${msg.isSelf ? 'justify-end' : 'justify-start'}`}
          >
            {!msg.isSelf && (
              <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                <AvatarImage src={msg.senderAvatar} alt={msg.sender} />
                <AvatarFallback className="bg-gray-200 text-gray-600">
                  {msg.sender.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className={`max-w-[75%] ${msg.isSelf ? 'order-2' : 'order-1'}`}>
              <div 
                className={`px-4 py-2 rounded-lg ${
                  msg.isSelf 
                    ? 'bg-[#183636] text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
              <div className={`mt-1 text-xs text-gray-500 ${msg.isSelf ? 'text-right' : 'text-left'}`}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages; 