# Quick Start Guide

This guide will help you get GhostChat up and running quickly.

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Supabase account
- OpenAI API key

## 5-Minute Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/ghostchat.git
cd ghostchat

# Install dependencies
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### 3. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application running.

## Quick Supabase Setup

### 1. Create Tables

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Create chats table
create table chats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  system_prompt text,
  created_at timestamp with time zone default now() not null
);

-- Add RLS policies for chats
alter table chats enable row level security;
create policy "Users can create their own chats" on chats for insert with check (auth.uid() = user_id);
create policy "Users can view their own chats" on chats for select using (auth.uid() = user_id);
create policy "Users can update their own chats" on chats for update using (auth.uid() = user_id);
create policy "Users can delete their own chats" on chats for delete using (auth.uid() = user_id);

-- Create messages table
create table messages (
  id uuid default uuid_generate_v4() primary key,
  chat_id uuid references chats(id) on delete cascade not null,
  role text not null,
  content text not null,
  created_at timestamp with time zone default now() not null
);

-- Add RLS policies for messages
alter table messages enable row level security;
create policy "Users can insert messages into their chats" on messages 
  for insert with check (
    auth.uid() = (select user_id from chats where id = chat_id)
  );
create policy "Users can view messages in their chats" on messages 
  for select using (
    auth.uid() = (select user_id from chats where id = chat_id)
  );
```

### 2. Enable Email Authentication

In your Supabase dashboard:
1. Go to Authentication → Settings
2. Ensure Email auth is enabled
3. Configure any additional settings as needed

## Testing the Application

### 1. Create a User Account

1. Visit your application at [http://localhost:3000](http://localhost:3000)
2. Click "Sign up" to create a new account
3. Enter your email and password
4. Check your email for a confirmation link (if email confirmation is enabled)

### 2. Create a Chat

1. After signing in, you'll see the main dashboard
2. Enter a title for your new chat in the input field
3. Click "New Chat" to create it
4. You'll be redirected to the chat interface

### 3. Start Chatting with the AI

1. In the chat interface, type a message in the input field
2. Click "Send" to send your message
3. The AI will respond based on your message

## Next Steps

Now that you have GhostChat running, you might want to:

1. **Customize the UI**: Edit the components in `src/components` to match your brand
2. **Modify the system prompt**: Change the default AI behavior by editing the system prompt
3. **Add more features**: Implement additional functionality like file uploads or voice input
4. **Deploy your application**: See the [Deployment Guide](../deployment/vercel.md) for instructions

## Common Issues and Solutions

### Authentication Issues

If you're having trouble with authentication:
- Ensure your Supabase URL and anon key are correct
- Check that email authentication is enabled in Supabase
- Look for any CORS errors in the browser console

### OpenAI API Issues

If the AI isn't responding:
- Verify your OpenAI API key is correct
- Check that you have sufficient credits in your OpenAI account
- Look for any rate limiting errors in the server logs

### Database Issues

If you're experiencing database problems:
- Confirm that all tables are created correctly
- Ensure Row Level Security (RLS) policies are properly configured
- Check for any permission errors in the server logs

For more detailed troubleshooting, refer to the [Installation Guide](installation.md).
