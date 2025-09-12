// src/types/chat.ts
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface Message {
  id: string;          // nanoid
  role: MessageRole;
  content: string;
  createdAt: number;   // Date.now()
  meta?: Record<string, unknown>; // e.g., tokens, model, cost
}

export interface Session {
  id: string;          // nanoid
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  encrypted?: boolean; // if key set
  model?: string;
  systemPrompt?: string;
}

export interface SessionBundle {
  session: Session;
  messages: Message[];
}

export interface PersistenceAdapter {
  init(): Promise<void>;
  listSessions(): Promise<Session[]>;
  getSession(id: string): Promise<SessionBundle | null>;
  upsertSession(bundle: SessionBundle): Promise<void>;
  deleteSession(id: string): Promise<void>;
  exportAll(): Promise<SessionBundle[]>;
  importAll(bundles: SessionBundle[]): Promise<void>;
  clear(): Promise<void>;
  getStorageInfo(): Promise<{ type: 'indexeddb' | 'localstorage'; size: number }>;
}

// Privacy mode settings
export interface PrivacySettings {
  mode: 'local' | 'cloud' | 'hybrid';
  enableEncryption: boolean;
  autoExport: boolean;
  localStorageOnly: boolean;
}

// Storage info interface
export interface StorageInfo {
  type: 'indexeddb' | 'localstorage';
  size: number;
  available: number;
  quota?: number;
}
