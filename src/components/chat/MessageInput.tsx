import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  disabled = false, 
  onTypingStart, 
  onTypingStop 
}) => {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      // Clear typing timeout and stop typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (onTypingStop) {
        onTypingStop();
      }

      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Handle typing indicators
    if (value.trim() && onTypingStart && !disabled) {
      onTypingStart();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (onTypingStop) {
          onTypingStop();
        }
      }, 3000);
    } else if (!value.trim() && onTypingStop) {
      // Stop typing if input is empty
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      onTypingStop();
    }
  };

  useEffect(() => {
    // Cleanup typing timeout on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <form 
      onSubmit={handleSubmit} 
      className="px-4 py-3 bg-white flex items-end gap-2 w-full"
    >
      <button
        type="button"
        className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 focus:outline-none flex-shrink-0"
        title="Attach file"
      >
        <Paperclip className="h-5 w-5" />
      </button>
      
      <div className="flex-1 relative">
        <textarea
          value={message}
          onChange={handleInputChange}
          placeholder={disabled ? "Connecting..." : "Type a message..."}
          disabled={disabled}
          className={`w-full p-3 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent resize-none leading-5 ${
            disabled ? 'text-gray-400 bg-gray-50' : 'text-gray-700'
          }`}
          style={{ maxHeight: '120px', minHeight: '40px' }}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="button"
          className="absolute right-3 bottom-3 text-gray-500 hover:text-gray-700"
          title="Add emoji"
        >
          <Smile className="h-5 w-5" />
        </button>
      </div>
      
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className={`p-3 rounded-full flex-shrink-0 focus:outline-none ${
          message.trim() && !disabled
            ? 'bg-primary text-white hover:bg-primary-dark' 
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
        title="Send message"
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  );
};

export default MessageInput;