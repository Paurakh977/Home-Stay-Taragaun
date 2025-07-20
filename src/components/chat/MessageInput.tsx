import React, { useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    onSendMessage(message);
    setMessage('');
  };

  return (
    <div className="flex-none p-4 border-t border-gray-200 bg-white">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon"
          className="text-gray-500 flex-shrink-0"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        
        <div className="relative flex-1">
          <Input 
            type="text" 
            placeholder="Type a message..."
            className="pr-10 py-5"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>
        
        <Button 
          type="submit" 
          disabled={!message.trim()}
          className="bg-[#183636] hover:bg-[#1c4141] text-white rounded-full h-10 w-10 flex-shrink-0 p-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
};

export default MessageInput; 