// src/lib/persistence/local.ts
import type { PersistenceAdapter, Session, SessionBundle, Message } from '@/types/chat';

const DB_NAME = 'ghostchat_v2';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';
const STORE_MESSAGES = 'messages';

const hasIDB = () => typeof indexedDB !== 'undefined' && typeof window !== 'undefined';

interface MessageWithSessionId extends Message {
  sessionId: string;
}

export class LocalAdapter implements PersistenceAdapter {
  private idb: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    if (!hasIDB()) {
      console.log('IndexedDB not available, using localStorage fallback');
      return;
    }

    try {
      this.idb = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        
        req.onupgradeneeded = () => {
          const db = req.result;
          
          // Create sessions store
          if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
            db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
          }
          
          // Create messages store with index
          if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
            const store = db.createObjectStore(STORE_MESSAGES, { keyPath: 'id' });
            store.createIndex('by_session', 'sessionId');
          }
        };
        
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      
      console.log('IndexedDB initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize IndexedDB, falling back to localStorage:', error);
      this.idb = null;
    }
  }

  // localStorage helper methods
  private ls<T>(key: string, value?: T): T | null {
    try {
      if (value !== undefined) {
        localStorage.setItem(key, JSON.stringify(value));
        return value;
      }
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      console.error('localStorage operation failed:', error);
      return null;
    }
  }

  async listSessions(): Promise<Session[]> {
    if (this.idb) {
      return new Promise((resolve, reject) => {
        const tx = this.idb!.transaction(STORE_SESSIONS, 'readonly');
        const req = tx.objectStore(STORE_SESSIONS).getAll();
        
        req.onsuccess = () => {
          const sessions = (req.result as Session[]).sort((a, b) => b.updatedAt - a.updatedAt);
          resolve(sessions);
        };
        req.onerror = () => reject(req.error);
      });
    }
    
    // localStorage fallback
    const sessions = this.ls<Session[]>('gc_sessions') ?? [];
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getSession(id: string): Promise<SessionBundle | null> {
    if (this.idb) {
      return new Promise((resolve, reject) => {
        const tx = this.idb!.transaction([STORE_SESSIONS, STORE_MESSAGES], 'readonly');
        
        // Get session
        const sessionReq = tx.objectStore(STORE_SESSIONS).get(id);
        
        sessionReq.onsuccess = () => {
          const session = sessionReq.result as Session | undefined;
          if (!session) {
            resolve(null);
            return;
          }
          
          // Get messages
          const messagesReq = tx.objectStore(STORE_MESSAGES).index('by_session').getAll(id);
          
          messagesReq.onsuccess = () => {
            const messagesWithSessionId = messagesReq.result as MessageWithSessionId[];
            const messages = messagesWithSessionId.map((item) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { sessionId, ...message } = item;
              return message;
            });
            resolve({ session, messages: messages.sort((a, b) => a.createdAt - b.createdAt) });
          };
          messagesReq.onerror = () => reject(messagesReq.error);
        };
        
        sessionReq.onerror = () => reject(sessionReq.error);
      });
    }
    
    // localStorage fallback
    const bundles = this.ls<SessionBundle[]>('gc_bundles') ?? [];
    const bundle = bundles.find(b => b.session.id === id);
    if (bundle) {
      // Sort messages by creation time
      bundle.messages.sort((a, b) => a.createdAt - b.createdAt);
    }
    return bundle ?? null;
  }

  async upsertSession(bundle: SessionBundle): Promise<void> {
    if (this.idb) {
      return new Promise<void>((resolve, reject) => {
        const tx = this.idb!.transaction([STORE_SESSIONS, STORE_MESSAGES], 'readwrite');
        
        // Update session
        bundle.session.updatedAt = Date.now();
        tx.objectStore(STORE_SESSIONS).put(bundle.session);
        
        // Clear existing messages for this session
        const messagesStore = tx.objectStore(STORE_MESSAGES);
        const index = messagesStore.index('by_session');
        const deleteReq = index.openCursor(IDBKeyRange.only(bundle.session.id));
        
        deleteReq.onsuccess = () => {
          const cursor = deleteReq.result;
          if (cursor) {
            messagesStore.delete(cursor.primaryKey);
            cursor.continue();
          }
        };
        
        // Insert new messages
        bundle.messages.forEach(message => {
          const messageWithSessionId: MessageWithSessionId = {
            ...message,
            sessionId: bundle.session.id
          };
          messagesStore.put(messageWithSessionId);
        });
        
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
    
    // localStorage fallback
    const bundles = this.ls<SessionBundle[]>('gc_bundles') ?? [];
    const index = bundles.findIndex(b => b.session.id === bundle.session.id);
    
    bundle.session.updatedAt = Date.now();
    
    if (index >= 0) {
      bundles[index] = bundle;
    } else {
      bundles.push(bundle);
    }
    
    this.ls('gc_bundles', bundles);
    
    // Update sessions list for quick access
    const sessions = bundles.map(b => b.session);
    this.ls('gc_sessions', sessions);
  }

  async deleteSession(id: string): Promise<void> {
    if (this.idb) {
      return new Promise<void>((resolve, reject) => {
        const tx = this.idb!.transaction([STORE_SESSIONS, STORE_MESSAGES], 'readwrite');
        
        // Delete session
        tx.objectStore(STORE_SESSIONS).delete(id);
        
        // Delete all messages for this session
        const messagesStore = tx.objectStore(STORE_MESSAGES);
        const index = messagesStore.index('by_session');
        const req = index.openCursor(IDBKeyRange.only(id));
        
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            messagesStore.delete(cursor.primaryKey);
            cursor.continue();
          }
        };
        
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
    
    // localStorage fallback
    const bundles = (this.ls<SessionBundle[]>('gc_bundles') ?? []).filter(b => b.session.id !== id);
    this.ls('gc_bundles', bundles);
    
    const sessions = bundles.map(b => b.session);
    this.ls('gc_sessions', sessions);
  }

  async exportAll(): Promise<SessionBundle[]> {
    if (this.idb) {
      const sessions = await this.listSessions();
      const bundles: SessionBundle[] = [];
      
      for (const session of sessions) {
        const bundle = await this.getSession(session.id);
        if (bundle) bundles.push(bundle);
      }
      
      return bundles;
    }
    
    return this.ls<SessionBundle[]>('gc_bundles') ?? [];
  }

  async importAll(bundles: SessionBundle[]): Promise<void> {
    for (const bundle of bundles) {
      await this.upsertSession(bundle);
    }
  }

  async clear(): Promise<void> {
    if (this.idb) {
      return new Promise<void>((resolve, reject) => {
        const tx = this.idb!.transaction([STORE_SESSIONS, STORE_MESSAGES], 'readwrite');
        
        tx.objectStore(STORE_SESSIONS).clear();
        tx.objectStore(STORE_MESSAGES).clear();
        
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
    
    // localStorage fallback
    localStorage.removeItem('gc_bundles');
    localStorage.removeItem('gc_sessions');
  }

  // Utility method to get storage info
  async getStorageInfo(): Promise<{ type: 'indexeddb' | 'localstorage'; size: number }> {
    if (this.idb) {
      // Rough estimate - IndexedDB doesn't provide direct size info
      const bundles = await this.exportAll();
      const size = JSON.stringify(bundles).length;
      return { type: 'indexeddb', size };
    } else {
      const bundles = this.ls<SessionBundle[]>('gc_bundles') ?? [];
      const size = JSON.stringify(bundles).length;
      return { type: 'localstorage', size };
    }
  }
}
