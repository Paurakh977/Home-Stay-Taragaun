import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatItem } from './ChatSidebar';

interface ChatHeaderProps {
  currentChat: ChatItem | undefined;
  onBackClick: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  currentChat,
  onBackClick,
}) => {
  if (!currentChat) return null;
  
  return (
    <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white z-30 sticky top-0">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2 md:hidden"
          onClick={onBackClick}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentChat.avatar} alt={currentChat.name} />
              <AvatarFallback className="bg-gray-200 text-gray-600">
                {currentChat.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {currentChat.online && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white"></span>
            )}
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-gray-900">{currentChat.name}</h3>
            <p className="text-xs text-gray-500">
              {currentChat.online ? 'Online' : 'Last active 2h ago'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader; 