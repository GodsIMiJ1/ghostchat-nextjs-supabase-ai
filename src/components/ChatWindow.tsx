'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, Message, Chat } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';
import MessageBubble from './MessageBubble';
import SystemPromptEditor from './SystemPromptEditor';

interface ChatWindowProps {
  chatId: string;
}

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch chat and messages
  useEffect(() => {
    if (!user || !chatId) return;

    const fetchChat = async () => {
      setIsLoading(true);
      try {
        // Fetch chat details
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('*')
          .eq('id', chatId)
          .eq('user_id', user.id)
          .single();

        if (chatError) throw chatError;
        setChat(chatData as Chat);

        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData as Message[]);
      } catch (error) {
        console.error('Error fetching chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChat();

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel(`messages:chat_id=eq.${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [chatId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId || isProcessing) return;

    setIsProcessing(true);
    
    try {
      // Insert user message
      const userMessage = {
        chat_id: chatId,
        role: 'user',
        content: newMessage,
        created_at: new Date().toISOString(),
      };

      const { error: userMessageError } = await supabase
        .from('messages')
        .insert([userMessage]);

      if (userMessageError) throw userMessageError;

      // Clear input
      setNewMessage('');

      // Prepare messages for API call
      const allMessages = [
        ...(chat?.system_prompt
          ? [{ role: 'system', content: chat.system_prompt }]
          : []),
        ...messages,
        userMessage,
      ] as { role: 'user' | 'assistant' | 'system'; content: string }[];

      // Call API route to get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: allMessages,
          chatId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateSystemPrompt = async (newPrompt: string) => {
    if (!user || !chatId) return;

    try {
      const { error } = await supabase
        .from('chats')
        .update({ system_prompt: newPrompt })
        .eq('id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;

      setChat((prev) => (prev ? { ...prev, system_prompt: newPrompt } : null));
    } catch (error) {
      console.error('Error updating system prompt:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-600">Chat not found or access denied</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">{chat.title}</h2>
      </div>

      <SystemPromptEditor
        initialPrompt={chat.system_prompt || 'You are a helpful assistant.'}
        onSave={handleUpdateSystemPrompt}
      />

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isProcessing}
            className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing
              </span>
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
