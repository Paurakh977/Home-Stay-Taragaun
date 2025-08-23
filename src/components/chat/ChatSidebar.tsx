import React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Types
export interface ChatItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  unreadCount?: number;
  online?: boolean;
}

interface ChatSidebarProps {
  chats: ChatItem[];
  currentChatId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onChatSelect: (chatId: string) => void;
  onClose: () => void;
  isMobileSidebarOpen: boolean;
  navbarHeight?: number;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  currentChatId,
  searchQuery,
  onSearchChange,
  onChatSelect,
  onClose,
  isMobileSidebarOpen,
  navbarHeight = 80
}) => {
  const router = useRouter();

  // Filter chats based on search query
  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div 
      className={`w-full md:w-80 border-r border-gray-200 bg-white flex flex-col ${
        isMobileSidebarOpen ? 'fixed inset-0 z-40' : 'hidden md:flex'
      }`} 
      style={{ top: `${navbarHeight}px` }}
    >
      {/* Sidebar Header - Fixed */}
      <div className="flex-none p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800 mb-4">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Search conversations" 
            className="pl-9 py-2 bg-gray-50 border-gray-200"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      {/* Chat List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length > 0 ? (
          filteredChats.map(chat => (
            <button 
              key={chat.id}
              className={`w-full px-4 py-3 flex items-start hover:bg-gray-50 transition-colors ${
                currentChatId === chat.id ? 'bg-gray-50' : ''
              }`}
              onClick={() => {
                onChatSelect(chat.id);
                router.push(`/chat?id=${chat.id}`);
              }}
            >
              <div className="relative mr-3 flex-shrink-0">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={chat.avatar} alt={chat.name} />
                  <AvatarFallback className="bg-gray-200 text-gray-600">
                    {chat.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {chat.online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
                )}
                {chat.unreadCount && chat.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                    </span>
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-medium text-gray-900 truncate">{chat.name}</h4>
                  <span className="text-xs text-gray-500 ml-1 flex-shrink-0">{chat.time}</span>
                </div>
                <p className={`text-sm ${chat.unread ? 'text-gray-800 font-medium' : 'text-gray-500'} truncate`}>
                  {chat.lastMessage}
                </p>
              </div>
            </button>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            No conversations found.
          </div>
        )}
      </div>
      
      {/* Close button for mobile - redirect to home */}
      <div className="flex-none md:hidden p-4 border-t">
        <Button 
          onClick={onClose}
          variant="ghost" 
          className="w-full"
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar; 