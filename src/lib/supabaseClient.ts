import { createClient } from '@supabase/supabase-js';

// These are public keys that can be exposed in the client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type Chat = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  system_prompt: string;
};

export type Message = {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
};
