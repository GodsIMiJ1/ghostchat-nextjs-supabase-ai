'use client';

import { useEffect, useState } from 'react';
import { useChat } from '@/store/chat';
import SessionList from '@/components/v2/SessionList';
import ChatWindow from '@/components/v2/ChatWindow';

export default function GhostChatV2() {
  const { initialize, isLoading, currentSessionId, createSession } = useChat();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initialize();
      setIsInitialized(true);
    };
    init();
  }, [initialize]);

  const handleCreateFirstSession = async () => {
    await createSession('Welcome to GhostChat v2.0', 'You are a helpful AI assistant. This is a local-first chat application where conversations are stored privately on the user\'s device.');
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Initializing GhostChat v2.0</h2>
          <p className="text-gray-600">Setting up local-first storage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <SessionList currentSessionId={currentSessionId ?? undefined} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {currentSessionId ? (
          <ChatWindow sessionId={currentSessionId} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-6">👻</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to GhostChat v2.0
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Your local-first, privacy-focused AI chat experience. All conversations 
                are stored securely on your device and never leave your control.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={handleCreateFirstSession}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  🚀 Start Your First Chat
                </button>
                
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-500">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="text-2xl">🔒</div>
                    <div>Private</div>
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <div className="text-2xl">💾</div>
                    <div>Local Storage</div>
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <div className="text-2xl">⚡</div>
                    <div>Offline Ready</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
