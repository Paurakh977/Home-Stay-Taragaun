import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyChatProps {
  onViewConversations: () => void;
}

const EmptyChat: React.FC<EmptyChatProps> = ({ onViewConversations }) => {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Select a conversation</h3>
        <p className="text-sm text-gray-500 mb-4">Choose from your conversations list to start chatting</p>
        <Button 
          onClick={onViewConversations}
          className="bg-[#183636] hover:bg-[#1c4141] text-white"
        >
          View Conversations
        </Button>
      </div>
    </div>
  );
};

export default EmptyChat; 