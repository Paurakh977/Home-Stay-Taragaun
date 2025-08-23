import React from 'react';
import { Search, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Local ChatItem interface for compatibility
interface ChatItem {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface DashboardChatSidebarProps {
  chats: ChatItem[];
  currentChatId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onChatSelect: (chatId: string) => void;
  onClose: () => void;
  isMobileSidebarOpen: boolean;
  navbarHeight?: number;
  basePath: string;
}

const DashboardChatSidebar: React.FC<DashboardChatSidebarProps> = ({
  chats,
  currentChatId,
  searchQuery,
  onSearchChange,
  onChatSelect,
  onClose,
  isMobileSidebarOpen,
  navbarHeight = 0,
  basePath
}) => {
  // Filter chats based on search query
  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <>
      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={onClose} />
      )}
      
      {/* Sidebar */}
      <div 
        className={`w-full md:w-80 border-r border-gray-200 bg-white flex flex-col h-full overflow-hidden transition-all duration-300 ${
          isMobileSidebarOpen ? 'fixed inset-0 z-40 md:relative md:z-0' : 'hidden md:flex'
        }`}
      >
        {/* Sidebar Header - Fixed */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-800">सन्देशहरू</h1>
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded-md text-gray-500 hover:bg-gray-100"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="कुराकानीहरू खोज्नुहोस्..." 
              className="pl-9 py-2 bg-gray-50 border-gray-200"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        
        {/* Chat List - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {filteredChats.length > 0 ? (
            filteredChats.map(chat => (
              <button 
                key={chat.id}
                className={`w-full px-4 py-3 flex items-start hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  currentChatId === chat.id ? 'bg-gray-50 border-l-4 border-primary pl-3' : ''
                }`}
                onClick={() => onChatSelect(chat.id)}
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
                  {chat.unread > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {chat.unread > 99 ? '99+' : chat.unread}
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-medium text-gray-900 truncate">{chat.name}</h4>
                    <span className="text-xs text-gray-500 ml-1 flex-shrink-0">{chat.time}</span>
                  </div>
                  <p className={`text-sm ${chat.unread > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'} truncate`}>
                    {chat.lastMessage}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>कुनै कुराकानी फेला परेन।</p>
              <p className="text-sm mt-2">नयाँ कुराकानी सुरु गर्न चाहनुहुन्छ?</p>
            </div>
          )}
        </div>
        
        {/* Close button for mobile */}
        <div className="flex-shrink-0 md:hidden p-4 border-t">
          <Button 
            onClick={onClose}
            variant="ghost" 
            className="w-full"
          >
            बन्द गर्नुहोस्
          </Button>
        </div>
      </div>
    </>
  );
};

export default DashboardChatSidebar;