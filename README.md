
![GhostChat Banner](./public/ghostchat-banner.png)

# 👻 GhostChat v2.0 — Sovereign AGA (Local-First)

![NODE Seal](public/NODE.svg) [![GitHub stars](https://img.shields.io/github/stars/GodsIMiJ1/ghostchat-nextjs-supabase-ai?style=social)](https://github.com/GodsIMiJ1/ghostchat-nextjs-supabase-ai/stargazers)

**The evolution of AI chat: Privacy-first, local storage, offline-capable chat experience with optional cloud sync.**

> 🔥 **What's New in v2.0:** Complete local-first architecture with IndexedDB persistence, session management, import/export, and sovereign data control.

## ✨ Why GhostChat v2.0?

- **🔒 Privacy by Default**: Your conversations never leave your device unless you explicitly choose cloud sync
- **💾 Local-First Storage**: IndexedDB with localStorage fallback — works completely offline
- **⚡ Instant Performance**: No database roundtrips, instant message loading, blazing fast UI
- **📤 Data Portability**: Export/import your entire chat history as JSON
- **🛡️ Sovereign Control**: You own your data, you control your privacy
- **🔌 Cloud Optional**: Sync to Supabase/GhostVault only when you want to

## 🔥 Features

### Core v2.0 Features
- **🏠 Local-First Architecture** - IndexedDB + localStorage fallback persistence
- **💬 Session Management** - Multiple chats with pin/favorite, soft-delete
- **📱 Offline Capable** - Works without internet (except AI API calls)
- **🔐 Privacy Controls** - Local-only mode, optional encryption, data export
- **⚡ Real-time UI** - Zustand state management for instant responsiveness
- **🎨 Enhanced UX** - Modern interface with local storage indicators

### Privacy & Data Control
- **🔒 Local Storage Priority** - Data stays on your device by default
- **📤 Full Export/Import** - JSON backup and restore functionality
- **🗑️ Complete Data Control** - Clear all data with one click
- **🔐 Optional Encryption** - Browser-based encryption for sensitive chats (coming v2.1)
- **📊 Storage Transparency** - See exactly how much data you're storing locally

### Advanced Features
- **🎯 Smart Session Management** - Pin important chats, organize by recency
- **🧠 System Prompt Control** - Customize AI behavior per session
- **⚙️ Adapter Pattern** - Easy to add cloud storage providers
- **🔄 Migration Ready** - Upgrade path to cloud sync without breaking local experience

## 🚀 Quick Start (2 minutes)

### Option 1: Pure Local Mode (No Setup Required)
```bash
# Clone and run
git clone https://github.com/GodsIMiJ1/ghostchat-nextjs-supabase-ai.git
cd ghostchat-nextjs-supabase-ai
git checkout v2.0-sovereign-aga
npm install
npm run dev
```

**That's it!** Just add your OpenAI API key in the UI and start chatting. Everything is stored locally.

### Option 2: With Optional Cloud Features
```bash
# Same as above, plus create .env.local:
echo 'OPENAI_API_KEY=your_openai_api_key' > .env.local
# Optional: Add Supabase for cloud sync (future feature)
echo 'NEXT_PUBLIC_SUPABASE_URL=your_supabase_url' >> .env.local
echo 'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key' >> .env.local
```

4. Set up your Supabase database with the following tables:

**Users table** (created automatically by Supabase Auth)

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

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fghostchat)

1. Push your code to GitHub
2. Import your repository to Vercel
3. Add environment variables
4. Deploy!

## 📜 License

This project is licensed under the [Flame Public Use License v1.0](LICENSE.md) - see the LICENSE.md file for details.

## 🔒 NODE Seal Protocol

This repository contains a certified NODE Seal v1.0 — the official mark of sovereign authorship.

All GhostDrops by GodsIMiJ AI Solutions are stamped and protected under the Flame Public Use License (FPU v1.0).
This includes embedded validation systems, metadata markers, and signature integrity files.

> *Tampering with or removing the seal may trigger autonomous enforcement protocols.*

Further documentation is internal and protected under the NODE Manifest Directive.

Visit the [Witness Hall](https://thewitnesshall.com) for verification.

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [OpenAI](https://openai.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

Built with 🔥 by [GodsIMiJ AI Solutions](https://thewitnesshall.com)
