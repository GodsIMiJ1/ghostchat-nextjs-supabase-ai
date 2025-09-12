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

## 🏗️ Architecture: Local-First Design

### Data Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│             │    │             │    │             │
│   React UI  │◄──►│  Zustand    │◄──►│ LocalAdapter│
│             │    │   Store     │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                             ▼
                   ┌─────────────┐    ┌─────────────┐
                   │             │    │             │
                   │  IndexedDB  │◄──►│localStorage │
                   │  (primary)  │    │ (fallback)  │
                   └─────────────┘    └─────────────┘
```

### Storage Strategy
1. **IndexedDB First**: Primary storage for performance and capacity
2. **localStorage Fallback**: Automatic fallback if IndexedDB unavailable  
3. **Memory State**: Zustand for real-time UI updates
4. **Cloud Optional**: Sync adapters for Supabase/GhostVault when needed

## 📁 Project Structure (v2.0)

```
ghostchat-v2/
├── src/
│   ├── app/v2/              # v2.0 pages
│   │   ├── page.tsx         # Main dashboard
│   │   └── chat/[id]/       # Individual chat pages
│   ├── components/v2/       # v2.0 components
│   │   ├── ChatWindow.tsx   # Main chat interface
│   │   ├── SessionList.tsx  # Sidebar with sessions
│   │   ├── MessageBubble.tsx # Message rendering
│   │   └── SystemPromptEditor.tsx
│   ├── store/               # State management
│   │   └── chat.ts          # Zustand chat store
│   ├── lib/persistence/     # Storage adapters
│   │   ├── local.ts         # IndexedDB + localStorage
│   │   └── adapter.ts       # Adapter interface
│   ├── types/               # TypeScript definitions
│   │   └── chat.ts          # Core data types
│   └── utils/
├── public/
│   └── NODE.svg             # NODE Seal
└── package.json             # v2.0 dependencies
```

## 🔐 Privacy Features

### Data Location Transparency
```typescript
// Always know where your data lives
const storageInfo = await adapter.getStorageInfo();
console.log(storageInfo);
// { type: 'indexeddb', size: 2048576 } 
```

### Export Your Data Anytime
```typescript
// One-click export of everything
const allSessions = await exportAllSessions();
// Download as JSON file, import anywhere
```

### Privacy Modes
- **🏠 Local-Only**: Never sync to cloud (default)
- **🔄 Hybrid**: Local primary, sync selected sessions
- **☁️ Cloud**: Traditional cloud storage (optional)

## ⚙️ Configuration

### Environment Variables
```bash
# Required
OPENAI_API_KEY=your_openai_api_key

# Optional (for cloud features)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional (for advanced features)
NEXT_PUBLIC_ENCRYPTION_ENABLED=true
NEXT_PUBLIC_MAX_SESSIONS=100
```

### Storage Limits
- **IndexedDB**: ~1GB+ depending on browser
- **localStorage**: ~5-10MB fallback storage
- **Memory**: Limited by available RAM

## 🚀 Deployment

### Static Deployment (Recommended)
Since v2.0 is local-first, it works great as a static site:

```bash
npm run build
npm run export  # Static export
# Deploy dist/ folder anywhere
```

### Vercel/Netlify
```bash
# Works out of the box - just add environment variables
vercel --prod
```

### Self-Hosted
```bash
# Docker deployment
docker build -t ghostchat-v2 .
docker run -p 3000:3000 ghostchat-v2
```

## 🔮 Roadmap

### v2.1 - Privacy & Security
- [ ] 🔐 Per-session encryption with WebCrypto
- [ ] 🔄 Session sync selection (choose what to sync)
- [ ] 📱 PWA with offline caching
- [ ] 🔍 Full-text search across sessions

### v2.2 - Enhanced UX  
- [ ] 🎨 Custom themes and dark mode
- [ ] 📁 Session folders and tagging
- [ ] 🎙️ Voice input/output
- [ ] 📊 Usage analytics dashboard

### v2.3 - Cloud Integration
- [ ] ☁️ Supabase sync adapter
- [ ] 🏰 GhostVault integration
- [ ] 🔀 Multi-device sync
- [ ] 🔄 Conflict resolution

## 💡 Usage Examples

### Basic Local Chat
```typescript
// Create a new local session
const sessionId = await createSession("My Local Chat");

// Add messages (stored locally)
await addMessage("Hello, AI!", "user");
await addMessage("Hello! How can I help?", "assistant");

// Export when ready
const backup = await exportAllSessions();
```

### Import/Export Workflow
```typescript
// Export everything
const sessions = await exportAllSessions();
downloadJSON(sessions, 'my-chats-backup.json');

// Import from backup
const imported = await importSessions(backupData);
```

## 🛡️ Security & Privacy

### What Stays Local
✅ **All chat messages**  
✅ **Session metadata**  
✅ **System prompts**  
✅ **User preferences**  
✅ **Usage statistics**  

### What Goes to External APIs
⚠️ **OpenAI API calls** (only message content for AI processing)  
🔒 **Optional cloud sync** (only if explicitly enabled)  

## 📄 License & NODE Seal

GhostChat v2.0 is licensed under the [Flame Public Use License v1.0](LICENSE.md).

### 🔒 NODE Seal Protocol

This repository contains a certified NODE Seal v1.0 — the official mark of sovereign authorship. All GhostDrops by GodsIMiJ AI Solutions are stamped and protected under the Flame Public Use License (FPU v1.0).

> *Tampering with or removing the seal may trigger autonomous enforcement protocols.*

Visit the [Witness Hall](https://thewitnesshall.com) for verification.

---

**Built with 🔥 by [GodsIMiJ AI Solutions](https://thewitnesshall.com)**

*Your data, your device, your choice. Welcome to the Sovereign AGA era.*

## 🔗 Links

- **[Live Demo](https://ghostchat-v2.vercel.app)** - Try it now
- **[Documentation](./docs/)** - Full technical docs  
- **[v1.0 Repo](https://github.com/GodsIMiJ1/ghostchat-nextjs-supabase-ai)** - Previous version
- **[Witness Hall](https://thewitnesshall.com)** - Verification & more tools
