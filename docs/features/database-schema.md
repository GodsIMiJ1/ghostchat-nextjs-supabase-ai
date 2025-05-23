# Database Schema

GhostChat uses Supabase PostgreSQL database to store user data, chats, and messages. This document explains the database schema and how to work with it.

## Schema Overview

The database consists of three main tables:

1. **Users** (managed by Supabase Auth)
2. **Chats**
3. **Messages**

## Tables and Relationships

### Users Table

The users table is automatically managed by Supabase Auth and contains user authentication information.

**Key fields:**
- `id` (uuid): Primary key
- `email` (text): User's email address
- `created_at` (timestamp): When the user was created

### Chats Table

The chats table stores information about each chat conversation.

**SQL Definition:**
```sql
create table chats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  system_prompt text,
  created_at timestamp with time zone default now() not null
);
```

**Fields:**
- `id` (uuid): Primary key
- `user_id` (uuid): Foreign key to the users table
- `title` (text): Title of the chat
- `system_prompt` (text): System prompt for the AI
- `created_at` (timestamp): When the chat was created

### Messages Table

The messages table stores individual messages within a chat.

**SQL Definition:**
```sql
create table messages (
  id uuid default uuid_generate_v4() primary key,
  chat_id uuid references chats(id) on delete cascade not null,
  role text not null,
  content text not null,
  created_at timestamp with time zone default now() not null
);
```

**Fields:**
- `id` (uuid): Primary key
- `chat_id` (uuid): Foreign key to the chats table
- `role` (text): Role of the message sender ('user', 'assistant', or 'system')
- `content` (text): Content of the message
- `created_at` (timestamp): When the message was created

## Relationships

- Each user can have multiple chats (one-to-many)
- Each chat belongs to one user (many-to-one)
- Each chat can have multiple messages (one-to-many)
- Each message belongs to one chat (many-to-one)

## Row Level Security (RLS) Policies

Supabase uses Row Level Security (RLS) to control access to data. GhostChat implements the following RLS policies:

### Chats Table Policies

```sql
-- Enable RLS
alter table chats enable row level security;

-- Users can create their own chats
create policy "Users can create their own chats" 
on chats for insert 
with check (auth.uid() = user_id);

-- Users can view their own chats
create policy "Users can view their own chats" 
on chats for select 
using (auth.uid() = user_id);

-- Users can update their own chats
create policy "Users can update their own chats" 
on chats for update 
using (auth.uid() = user_id);

-- Users can delete their own chats
create policy "Users can delete their own chats" 
on chats for delete 
using (auth.uid() = user_id);
```

### Messages Table Policies

```sql
-- Enable RLS
alter table messages enable row level security;

-- Users can insert messages into their chats
create policy "Users can insert messages into their chats" 
on messages for insert 
with check (
  auth.uid() = (select user_id from chats where id = chat_id)
);

-- Users can view messages in their chats
create policy "Users can view messages in their chats" 
on messages for select 
using (
  auth.uid() = (select user_id from chats where id = chat_id)
);
```

## TypeScript Types

GhostChat defines TypeScript types that correspond to the database schema in `src/lib/supabaseClient.ts`:

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

## Working with the Database

### Querying Data

GhostChat uses the Supabase JavaScript client to interact with the database:

```typescript
// Fetch chats for the current user
const { data: chats, error } = await supabase
  .from('chats')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });

// Fetch messages for a specific chat
const { data: messages, error } = await supabase
  .from('messages')
  .select('*')
  .eq('chat_id', chatId)
  .order('created_at', { ascending: true });
```

### Inserting Data

```typescript
// Create a new chat
const { data, error } = await supabase
  .from('chats')
  .insert([
    {
      user_id: user.id,
      title: 'New Chat',
      system_prompt: 'You are a helpful assistant.',
    }
  ])
  .select();

// Add a message to a chat
const { error } = await supabase
  .from('messages')
  .insert([
    {
      chat_id: chatId,
      role: 'user',
      content: 'Hello, AI!',
    }
  ]);
```

### Updating Data

```typescript
// Update a chat title
const { error } = await supabase
  .from('chats')
  .update({ title: 'Updated Title' })
  .eq('id', chatId)
  .eq('user_id', user.id);

// Update the system prompt
const { error } = await supabase
  .from('chats')
  .update({ system_prompt: 'New system prompt' })
  .eq('id', chatId)
  .eq('user_id', user.id);
```

### Deleting Data

```typescript
// Delete a chat (will also delete associated messages due to cascade)
const { error } = await supabase
  .from('chats')
  .delete()
  .eq('id', chatId)
  .eq('user_id', user.id);
```

### Real-time Subscriptions

GhostChat uses Supabase's real-time functionality to update the UI when data changes:

```typescript
// Subscribe to new messages in a chat
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

// Clean up subscription
return () => {
  supabase.removeChannel(messagesSubscription);
};
```

## Schema Extensions

### Adding New Fields

To add new fields to the existing tables:

```sql
-- Add a 'favorite' field to the chats table
alter table chats add column favorite boolean default false;

-- Add a 'read' field to the messages table
alter table messages add column read boolean default false;
```

### Adding New Tables

To add new functionality, you might need to create additional tables:

```sql
-- Create a table for chat tags
create table tags (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default now() not null
);

-- Create a junction table for chat-tag relationships
create table chat_tags (
  chat_id uuid references chats(id) on delete cascade not null,
  tag_id uuid references tags(id) on delete cascade not null,
  primary key (chat_id, tag_id)
);

-- Add RLS policies
alter table tags enable row level security;
create policy "Users can manage their own tags" on tags using (auth.uid() = user_id);

alter table chat_tags enable row level security;
create policy "Users can manage tags for their own chats" on chat_tags 
using (
  auth.uid() = (select user_id from chats where id = chat_id)
);
```

## Database Migrations

For production applications, it's recommended to use database migrations to manage schema changes:

1. Create a `migrations` directory in your project
2. Add SQL files for each migration, e.g., `001_initial_schema.sql`, `002_add_tags.sql`
3. Use a migration tool or custom script to apply migrations in order

## Performance Considerations

### Indexes

Add indexes to improve query performance:

```sql
-- Add index for faster chat lookups by user_id
create index chats_user_id_idx on chats(user_id);

-- Add index for faster message lookups by chat_id
create index messages_chat_id_idx on messages(chat_id);

-- Add index for faster message sorting by created_at
create index messages_created_at_idx on messages(created_at);
```

### Query Optimization

When fetching large datasets:

1. Use pagination to limit the number of records returned
2. Select only the fields you need
3. Use appropriate filters to reduce the result set

Example:

```typescript
// Fetch the 20 most recent messages for a chat
const { data, error } = await supabase
  .from('messages')
  .select('id, role, content, created_at') // Only select needed fields
  .eq('chat_id', chatId)
  .order('created_at', { ascending: false })
  .limit(20);
```

## Backup and Recovery

Regularly back up your Supabase database:

1. Use Supabase's built-in backup functionality
2. Set up automated backups on a schedule
3. Test the restoration process periodically

## Troubleshooting

### Common Issues

1. **Permission denied errors**: Check your RLS policies
2. **Foreign key constraint violations**: Ensure referenced records exist
3. **Duplicate key violations**: Handle unique constraints properly
4. **Connection issues**: Verify your Supabase URL and API key

### Debugging Queries

Use the Supabase dashboard to:

1. View real-time database activity
2. Run SQL queries directly
3. Inspect table structure and data
4. Monitor API usage and performance
