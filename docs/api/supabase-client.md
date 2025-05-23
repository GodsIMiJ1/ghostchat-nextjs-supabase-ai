# Supabase Client API

GhostChat uses Supabase for authentication, database, and real-time functionality. This document explains how to use the Supabase client in the application.

## Client Configuration

The Supabase client is configured in `src/lib/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

// These are public keys that can be exposed in the client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Type Definitions

The file also exports TypeScript types that correspond to the database schema:

```typescript
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
```

## Authentication API

### Sign Up

```typescript
const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};
```

### Sign In

```typescript
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};
```

### Sign Out

```typescript
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
```

### Get Current Session

```typescript
const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};
```

### Get Current User

```typescript
const getUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
};
```

### Subscribe to Auth Changes

```typescript
const subscribeToAuthChanges = (callback) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  
  return data.subscription;
};
```

## Database API

### Chats

#### Fetch Chats

```typescript
const fetchChats = async (userId: string) => {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};
```

#### Get Chat by ID

```typescript
const getChat = async (chatId: string, userId: string) => {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .eq('user_id', userId)
    .single();
    
  if (error) throw error;
  return data;
};
```

#### Create Chat

```typescript
const createChat = async (chat: Omit<Chat, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('chats')
    .insert([chat])
    .select();
    
  if (error) throw error;
  return data[0];
};
```

#### Update Chat

```typescript
const updateChat = async (chatId: string, userId: string, updates: Partial<Chat>) => {
  const { data, error } = await supabase
    .from('chats')
    .update(updates)
    .eq('id', chatId)
    .eq('user_id', userId)
    .select();
    
  if (error) throw error;
  return data[0];
};
```

#### Delete Chat

```typescript
const deleteChat = async (chatId: string, userId: string) => {
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId)
    .eq('user_id', userId);
    
  if (error) throw error;
};
```

### Messages

#### Fetch Messages

```typescript
const fetchMessages = async (chatId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  return data;
};
```

#### Create Message

```typescript
const createMessage = async (message: Omit<Message, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([message])
    .select();
    
  if (error) throw error;
  return data[0];
};
```

## Real-time API

### Subscribe to Chat Changes

```typescript
const subscribeToChatChanges = (userId: string, callback) => {
  const subscription = supabase
    .channel(`chats:user_id=eq.${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chats',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
    
  return subscription;
};
```

### Subscribe to Message Changes

```typescript
const subscribeToMessageChanges = (chatId: string, callback) => {
  const subscription = supabase
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
        callback(payload);
      }
    )
    .subscribe();
    
  return subscription;
};
```

### Unsubscribe from Changes

```typescript
const unsubscribe = (subscription) => {
  supabase.removeChannel(subscription);
};
```

## Storage API

Supabase also provides storage functionality, which can be used to store files like images or documents:

### Upload File

```typescript
const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(path, file);
    
  if (error) throw error;
  return data;
};
```

### Download File

```typescript
const downloadFile = async (bucket: string, path: string) => {
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .download(path);
    
  if (error) throw error;
  return data;
};
```

### Get Public URL

```typescript
const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(path);
    
  return data.publicUrl;
};
```

## Error Handling

When working with the Supabase client, it's important to handle errors properly:

```typescript
try {
  const { data, error } = await supabase.from('chats').select('*');
  
  if (error) {
    throw error;
  }
  
  // Process data...
} catch (error) {
  console.error('Error fetching chats:', error);
  
  // Handle specific error types
  if (error.code === 'PGRST116') {
    // Foreign key violation
    console.error('Foreign key constraint violated');
  } else if (error.code === 'PGRST104') {
    // Not found
    console.error('Resource not found');
  } else if (error.code === '42501') {
    // Permission denied
    console.error('Permission denied');
  }
  
  // Show user-friendly error message
  // ...
}
```

## Best Practices

### 1. Use TypeScript Types

Always use TypeScript types with Supabase queries to ensure type safety:

```typescript
const { data, error } = await supabase
  .from<Chat>('chats')
  .select('*');
```

### 2. Handle Errors Consistently

Always check for errors in Supabase responses and handle them appropriately.

### 3. Use Single Responsibility Functions

Create dedicated functions for each Supabase operation to improve code organization and reusability.

### 4. Clean Up Subscriptions

Always clean up real-time subscriptions when components unmount:

```typescript
useEffect(() => {
  const subscription = subscribeToMessageChanges(chatId, handleNewMessage);
  
  return () => {
    unsubscribe(subscription);
  };
}, [chatId]);
```

### 5. Use RLS Policies

Rely on Row Level Security (RLS) policies in Supabase rather than implementing access control in your application code.

## Advanced Usage

### Transactions

For operations that need to be atomic, use transactions:

```typescript
const { data, error } = await supabase.rpc('create_chat_with_first_message', {
  p_title: 'New Chat',
  p_user_id: userId,
  p_message_content: 'Hello, AI!',
});
```

This requires creating a custom function in your Supabase database:

```sql
create or replace function create_chat_with_first_message(
  p_title text,
  p_user_id uuid,
  p_message_content text
) returns uuid as $$
declare
  v_chat_id uuid;
begin
  -- Insert chat and get ID
  insert into chats (title, user_id)
  values (p_title, p_user_id)
  returning id into v_chat_id;
  
  -- Insert first message
  insert into messages (chat_id, role, content)
  values (v_chat_id, 'user', p_message_content);
  
  return v_chat_id;
end;
$$ language plpgsql security definer;
```

### Pagination

For large datasets, implement pagination:

```typescript
const fetchPaginatedMessages = async (chatId: string, page: number, pageSize: number) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .range(from, to);
    
  if (error) throw error;
  return data;
};
```
