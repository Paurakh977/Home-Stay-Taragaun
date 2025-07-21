import React from 'react';
import { Button } from '@/components/ui/button';

interface DashboardEmptyChatProps {
  onViewConversations: () => void;
}

const DashboardEmptyChat: React.FC<DashboardEmptyChatProps> = ({ onViewConversations }) => {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">कुराकानी छान्नुहोस्</h3>
        <p className="text-sm text-gray-500 mb-4">कुराकानी सुरु गर्न आफ्नो कुराकानी सूचीबाट चयन गर्नुहोस्</p>
        <Button 
          onClick={onViewConversations}
          className="bg-primary hover:bg-primary/80 text-white"
        >
          कुराकानीहरू हेर्नुहोस्
        </Button>
      </div>
    </div>
  );
};

export default DashboardEmptyChat; 