'use client';

import { useEffect, useState } from 'react';
import { useChat } from '@/store/chat';
import SessionList from '@/components/v2/SessionList';
import ChatWindow from '@/components/v2/ChatWindow';

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { initialize, isLoading } = useChat();
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params;
      setSessionId(resolvedParams.id);
      await initialize();
      setIsInitialized(true);
    };
    init();
  }, [initialize, params]);

  if (!isInitialized || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Chat</h2>
          <p className="text-gray-600">Accessing local storage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <SessionList currentSessionId={sessionId} />
      <div className="flex-1">
        <ChatWindow sessionId={sessionId} />
      </div>
    </div>
  );
}
