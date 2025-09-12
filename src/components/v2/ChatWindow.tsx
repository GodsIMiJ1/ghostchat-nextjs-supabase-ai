'use client';

import { useEffect, useState, useRef } from 'react';
import { useChat } from '@/store/chat';
import MessageBubble from './MessageBubble';
import SystemPromptEditor from './SystemPromptEditor';

interface ChatWindowProps {
  sessionId: string;
}

export default function ChatWindow({ sessionId }: ChatWindowProps) {
  const {
    currentMessages,
    currentSessionId,
    switchSession,
    addMessage,
    getCurrentSession,
    updateSession,
    isLoading,
    error
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Switch to the requested session
  useEffect(() => {
    if (sessionId !== currentSessionId) {
      switchSession(sessionId);
    }
  }, [sessionId, currentSessionId, switchSession]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Focus input when not processing
  useEffect(() => {
    if (!isProcessing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isProcessing]);

  const currentSession = getCurrentSession();

  const generateChatCompletion = async (messages: { role: string; content: string }[], model: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error calling chat API:', error);
      throw error;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing || !currentSession) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);

    try {
      // Add user message first
      await addMessage(userMessage, 'user');

      // Prepare messages for AI including system prompt
      const systemMessage = currentSession.systemPrompt 
        ? [{ role: 'system' as const, content: currentSession.systemPrompt }]
        : [];
      
      const conversationMessages = [
        ...systemMessage,
        ...currentMessages,
        { role: 'user' as const, content: userMessage }
      ];

      // Generate AI response
      const aiResponse = await generateChatCompletion(
        conversationMessages,
        currentSession.model || 'gpt-3.5-turbo'
      );

      // Add AI response
      if (aiResponse) {
        await addMessage(aiResponse, 'assistant');
      } else {
        await addMessage('I apologize, but I was unable to generate a response.', 'assistant');
      }
    } catch (error) {
      console.error('Error in chat:', error);
      await addMessage('Sorry, there was an error processing your message. Please try again.', 'assistant');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateSystemPrompt = async (newPrompt: string) => {
    if (currentSession) {
      await updateSession(currentSession.id, { systemPrompt: newPrompt });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️ Error</div>
          <p className="text-sm text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-gray-400 mb-2">💬</div>
          <p className="text-gray-600">Session not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{currentSession.title}</h2>
            <p className="text-sm text-gray-500">
              {currentMessages.length} messages • Local storage • {currentSession.model}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {currentSession.pinned && (
              <div className="text-yellow-500" title="Pinned session">📌</div>
            )}
            <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Local-First
            </div>
          </div>
        </div>
      </div>

      {/* System Prompt Editor */}
      <SystemPromptEditor
        prompt={currentSession.systemPrompt || ''}
        onSave={handleUpdateSystemPrompt}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-4">👻</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start your conversation</h3>
            <p className="text-gray-600 max-w-md">
              This is a local-first chat powered by AI. Your messages are stored privately 
              on your device and never sent to external servers except for AI processing.
            </p>
          </div>
        ) : (
          <>
            {currentMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isProcessing ? '⏳' : '➤'}
          </button>
        </form>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          🔒 Messages stored locally • ⚡ Offline-ready • 💾 Auto-saved
        </div>
      </div>
    </div>
  );
}
