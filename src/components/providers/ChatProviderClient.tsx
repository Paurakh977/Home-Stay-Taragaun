'use client';

import { ChatProvider } from '@/context/ChatContext';

interface ChatProviderClientProps {
  children: React.ReactNode;
}

export default function ChatProviderClient({ children }: ChatProviderClientProps) {
  return (
    <ChatProvider>
      {children}
    </ChatProvider>
  );
}
