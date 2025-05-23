# Installation Guide

This guide will walk you through the process of installing and setting up GhostChat on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 18.x or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [Git](https://git-scm.com/) (for cloning the repository)

You'll also need accounts for the following services:

- [Supabase](https://supabase.io/) (for authentication and database)
- [OpenAI](https://openai.com/) (for AI chat functionality)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ghostchat.git
cd ghostchat
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

Replace the placeholder values with your actual credentials.

### 4. Set Up Supabase Database

Follow these steps to set up your Supabase database:

1. Create a new project in Supabase
2. Go to the SQL Editor
3. Run the following SQL commands to create the necessary tables:

**Chats table**:
```sql
create table chats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  system_prompt text,
  created_at timestamp with time zone default now() not null
);

-- Add RLS policies
alter table chats enable row level security;
create policy "Users can create their own chats" on chats for insert with check (auth.uid() = user_id);
create policy "Users can view their own chats" on chats for select using (auth.uid() = user_id);
create policy "Users can update their own chats" on chats for update using (auth.uid() = user_id);
create policy "Users can delete their own chats" on chats for delete using (auth.uid() = user_id);
```

**Messages table**:
```sql
create table messages (
  id uuid default uuid_generate_v4() primary key,
  chat_id uuid references chats(id) on delete cascade not null,
  role text not null,
  content text not null,
  created_at timestamp with time zone default now() not null
);

-- Add RLS policies
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

### 5. Start the Development Server

```bash
npm run dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

## Troubleshooting

### Common Issues

1. **"Module not found" errors**: Make sure all dependencies are installed correctly. Try running `npm install` again.

2. **Supabase connection issues**: Verify that your Supabase URL and anon key are correct in the `.env.local` file.

3. **OpenAI API errors**: Ensure your OpenAI API key is valid and has sufficient credits.

4. **Database errors**: Check that you've created all the required tables in Supabase with the correct schema.

If you encounter any other issues, please check the [GitHub issues](https://github.com/yourusername/ghostchat/issues) or create a new one.
