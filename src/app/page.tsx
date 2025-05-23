'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { SignInForm, SignUpForm } from '@/components/AuthForms';
import Link from 'next/link';
import { supabase, Chat } from '@/lib/supabaseClient';
import { getRelativeTime } from '@/utils/formatTimestamp';

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');
  const [chats, setChats] = useState<Chat[]>([]);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      try {
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setChats(data as Chat[]);
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    fetchChats();

    // Subscribe to changes
    const chatsSubscription = supabase
      .channel(`chats:user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setChats((prev) => [payload.new as Chat, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setChats((prev) =>
              prev.map((chat) =>
                chat.id === payload.new.id ? (payload.new as Chat) : chat
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setChats((prev) =>
              prev.filter((chat) => chat.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatsSubscription);
    };
  }, [user]);

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newChatTitle.trim()) return;

    setIsCreatingChat(true);
    try {
      const newChat = {
        user_id: user.id,
        title: newChatTitle.trim(),
        created_at: new Date().toISOString(),
        system_prompt: 'You are a helpful assistant.',
      };

      const { data, error } = await supabase.from('chats').insert([newChat]).select();

      if (error) throw error;
      
      if (data && data[0]) {
        window.location.href = `/chat/${data[0].id}`;
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setIsCreatingChat(false);
      setNewChatTitle('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">GhostChat</h1>
            <p className="text-gray-600">
              A production-ready AI chat template using Next.js, Supabase, and OpenAI
            </p>
          </div>

          {authView === 'signin' ? (
            <>
              <SignInForm />
              <p className="mt-4 text-center text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setAuthView('signup')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Sign up
                </button>
              </p>
            </>
          ) : (
            <>
              <SignUpForm />
              <p className="mt-4 text-center text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setAuthView('signin')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">GhostChat</h1>
          <button
            onClick={() => signOut()}
            className="text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <form onSubmit={handleCreateChat} className="flex gap-2">
            <input
              type="text"
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              placeholder="Enter chat title..."
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isCreatingChat}
            />
            <button
              type="submit"
              disabled={!newChatTitle.trim() || isCreatingChat}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isCreatingChat ? 'Creating...' : 'New Chat'}
            </button>
          </form>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Your Chats</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {chats.length === 0 ? (
              <li className="px-4 py-5 sm:px-6 text-gray-500 text-center">
                No chats yet. Create your first chat above!
              </li>
            ) : (
              chats.map((chat) => (
                <li key={chat.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <Link href={`/chat/${chat.id}`} className="block">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {chat.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(chat.created_at)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>
            GhostChat - A production-ready, open-source AI chat template using
            Next.js, Supabase, and OpenAI
          </p>
          <p className="mt-1">
            Licensed under the{' '}
            <a
              href="https://thewitnesshall.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              Flame Public Use License v1.0
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
