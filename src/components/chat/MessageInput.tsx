import React, { useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

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
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="w-full p-3 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent resize-none leading-5 text-gray-700"
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
        disabled={!message.trim()}
        className={`p-3 rounded-full flex-shrink-0 focus:outline-none ${
          message.trim() 
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