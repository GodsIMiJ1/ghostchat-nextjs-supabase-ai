// src/store/chat.ts
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Message, Session, SessionBundle, PrivacySettings } from '@/types/chat';
import { LocalAdapter } from '@/lib/persistence/local';

interface ChatState {
  // Core state
  sessions: Session[];
  currentSessionId: string | null;
  currentMessages: Message[];
  isLoading: boolean;
  error: string | null;
  
  // Privacy settings
  privacySettings: PrivacySettings;
  
  // Storage info
  storageInfo: { type: 'indexeddb' | 'localstorage'; size: number } | null;
  
  // Actions
  initialize: () => Promise<void>;
  createSession: (title?: string, systemPrompt?: string) => Promise<string>;
  switchSession: (id: string) => Promise<void>;
  addMessage: (content: string, role?: 'user' | 'assistant') => Promise<void>;
  updateSession: (id: string, updates: Partial<Session>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  pinSession: (id: string, pinned: boolean) => Promise<void>;
  
  // Import/Export
  exportAllSessions: () => Promise<SessionBundle[]>;
  importSessions: (bundles: SessionBundle[]) => Promise<void>;
  
  // Privacy controls
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  clearAllData: () => Promise<void>;
  
  // Utilities
  refreshStorageInfo: () => Promise<void>;
  getCurrentSession: () => Session | null;
  getSessionById: (id: string) => Session | null;
}

// Initialize adapter
const adapter = new LocalAdapter();

export const useChat = create<ChatState>((set, get) => ({
  // Initial state
  sessions: [],
  currentSessionId: null,
  currentMessages: [],
  isLoading: false,
  error: null,
  
  privacySettings: {
    mode: 'local',
    enableEncryption: false,
    autoExport: false,
    localStorageOnly: false,
  },
  
  storageInfo: null,
  
  // Initialize the store and adapter
  initialize: async () => {
    set({ isLoading: true, error: null });
    
    try {
      await adapter.init();
      const sessions = await adapter.listSessions();
      
      // Load privacy settings from localStorage
      const savedSettings = localStorage.getItem('gc_privacy_settings');
      const privacySettings = savedSettings 
        ? { ...get().privacySettings, ...JSON.parse(savedSettings) }
        : get().privacySettings;
      
      set({ 
        sessions, 
        privacySettings,
        currentSessionId: sessions[0]?.id ?? null,
        isLoading: false 
      });
      
      // Load current session if available
      if (sessions[0]?.id) {
        await get().switchSession(sessions[0].id);
      }
      
      // Update storage info
      await get().refreshStorageInfo();
      
    } catch (error) {
      console.error('Failed to initialize chat store:', error);
      set({ error: 'Failed to initialize chat storage', isLoading: false });
    }
  },
  
  createSession: async (title?: string, systemPrompt?: string) => {
    const id = nanoid();
    const now = Date.now();
    
    const newSession: Session = {
      id,
      title: title ?? `Chat ${get().sessions.length + 1}`,
      createdAt: now,
      updatedAt: now,
      systemPrompt: systemPrompt ?? 'You are a helpful AI assistant.',
      model: 'gpt-3.5-turbo',
      pinned: false,
    };
    
    const bundle: SessionBundle = {
      session: newSession,
      messages: [],
    };
    
    try {
      await adapter.upsertSession(bundle);
      
      const sessions = await adapter.listSessions();
      set({ 
        sessions, 
        currentSessionId: id,
        currentMessages: [],
      });
      
      await get().refreshStorageInfo();
      return id;
    } catch (error) {
      console.error('Failed to create session:', error);
      set({ error: 'Failed to create new session' });
      throw error;
    }
  },
  
  switchSession: async (id: string) => {
    set({ isLoading: true });
    
    try {
      const bundle = await adapter.getSession(id);
      if (!bundle) {
        throw new Error('Session not found');
      }
      
      set({
        currentSessionId: id,
        currentMessages: bundle.messages,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to switch session:', error);
      set({ error: 'Failed to load session', isLoading: false });
    }
  },
  
  addMessage: async (content: string, role: 'user' | 'assistant' = 'user') => {
    const { currentSessionId, currentMessages } = get();
    if (!currentSessionId) return;
    
    const newMessage: Message = {
      id: nanoid(),
      role,
      content,
      createdAt: Date.now(),
    };
    
    const updatedMessages = [...currentMessages, newMessage];
    
    // Optimistic update
    set({ currentMessages: updatedMessages });
    
    try {
      const currentSession = get().getSessionById(currentSessionId);
      if (!currentSession) throw new Error('Current session not found');
      
      const bundle: SessionBundle = {
        session: currentSession,
        messages: updatedMessages,
      };
      
      await adapter.upsertSession(bundle);
      
      // Update sessions list to reflect new updatedAt time
      const sessions = await adapter.listSessions();
      set({ sessions });
      
      await get().refreshStorageInfo();
    } catch (error) {
      console.error('Failed to add message:', error);
      // Revert optimistic update
      set({ currentMessages, error: 'Failed to save message' });
    }
  },
  
  updateSession: async (id: string, updates: Partial<Session>) => {
    try {
      const bundle = await adapter.getSession(id);
      if (!bundle) throw new Error('Session not found');
      
      const updatedSession = { ...bundle.session, ...updates, updatedAt: Date.now() };
      await adapter.upsertSession({ ...bundle, session: updatedSession });
      
      const sessions = await adapter.listSessions();
      set({ sessions });
      
      // Update current session if it's the one being edited
      if (id === get().currentSessionId) {
        set({ currentMessages: bundle.messages });
      }
    } catch (error) {
      console.error('Failed to update session:', error);
      set({ error: 'Failed to update session' });
    }
  },
  
  deleteSession: async (id: string) => {
    try {
      await adapter.deleteSession(id);
      
      const sessions = await adapter.listSessions();
      const { currentSessionId } = get();
      
      let newCurrentSessionId = currentSessionId;
      let newCurrentMessages: Message[] = [];
      
      // If we deleted the current session, switch to another one
      if (currentSessionId === id) {
        newCurrentSessionId = sessions[0]?.id ?? null;
        if (newCurrentSessionId) {
          const bundle = await adapter.getSession(newCurrentSessionId);
          newCurrentMessages = bundle?.messages ?? [];
        }
      }
      
      set({
        sessions,
        currentSessionId: newCurrentSessionId,
        currentMessages: newCurrentMessages,
      });
      
      await get().refreshStorageInfo();
    } catch (error) {
      console.error('Failed to delete session:', error);
      set({ error: 'Failed to delete session' });
    }
  },
  
  pinSession: async (id: string, pinned: boolean) => {
    await get().updateSession(id, { pinned });
  },
  
  exportAllSessions: async () => {
    try {
      return await adapter.exportAll();
    } catch (error) {
      console.error('Failed to export sessions:', error);
      set({ error: 'Failed to export sessions' });
      return [];
    }
  },
  
  importSessions: async (bundles: SessionBundle[]) => {
    try {
      await adapter.importAll(bundles);
      
      const sessions = await adapter.listSessions();
      set({ 
        sessions,
        currentSessionId: sessions[0]?.id ?? null,
      });
      
      // Load first session if available
      if (sessions[0]?.id) {
        await get().switchSession(sessions[0].id);
      }
      
      await get().refreshStorageInfo();
    } catch (error) {
      console.error('Failed to import sessions:', error);
      set({ error: 'Failed to import sessions' });
    }
  },
  
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => {
    const newSettings = { ...get().privacySettings, ...settings };
    localStorage.setItem('gc_privacy_settings', JSON.stringify(newSettings));
    set({ privacySettings: newSettings });
  },
  
  clearAllData: async () => {
    try {
      await adapter.clear();
      localStorage.removeItem('gc_privacy_settings');
      
      set({
        sessions: [],
        currentSessionId: null,
        currentMessages: [],
        privacySettings: {
          mode: 'local',
          enableEncryption: false,
          autoExport: false,
          localStorageOnly: false,
        },
        storageInfo: null,
      });
    } catch (error) {
      console.error('Failed to clear all data:', error);
      set({ error: 'Failed to clear data' });
    }
  },
  
  refreshStorageInfo: async () => {
    try {
      const info = await adapter.getStorageInfo();
      set({ storageInfo: info });
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }
  },
  
  getCurrentSession: () => {
    const { currentSessionId, sessions } = get();
    return sessions.find(s => s.id === currentSessionId) ?? null;
  },
  
  getSessionById: (id: string) => {
    return get().sessions.find(s => s.id === id) ?? null;
  },
}));
