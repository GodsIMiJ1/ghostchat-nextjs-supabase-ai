'use client';

import { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 max-w-md">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">⚙️</span>
            <span className="text-sm text-yellow-800 font-medium">System</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%] md:max-w-[70%]">
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }`}
        >
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>
        </div>
        
        {/* Timestamp and metadata */}
        <div
          className={`flex items-center mt-1 space-x-2 text-xs text-gray-500 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {message.meta?.tokens && (
            <span>• {String(message.meta.tokens)} tokens</span>
          )}
          {message.meta?.model && (
            <span>• {String(message.meta.model)}</span>
          )}
          <span>• Local</span>
        </div>
      </div>
    </div>
  );
}
