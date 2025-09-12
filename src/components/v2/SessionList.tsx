'use client';

import { useState } from 'react';
import { useChat } from '@/store/chat';
import Link from 'next/link';

interface SessionListProps {
  currentSessionId?: string;
}

export default function SessionList({ currentSessionId }: SessionListProps) {
  const {
    sessions,
    createSession,
    deleteSession,
    pinSession,
    storageInfo,
    exportAllSessions,
    importSessions,
    clearAllData,
  } = useChat();

  const [isCreating, setIsCreating] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [showActions, setShowActions] = useState(false);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim()) return;

    setIsCreating(true);
    try {
      const newId = await createSession(newSessionTitle.trim());
      setNewSessionTitle('');
      // Navigate to new session
      window.location.href = `/v2/chat/${newId}`;
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleExport = async () => {
    try {
      const bundles = await exportAllSessions();
      const dataStr = JSON.stringify(bundles, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ghostchat-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const bundles = JSON.parse(e.target?.result as string);
        await importSessions(bundles);
        alert('Import successful!');
      } catch (error) {
        console.error('Import failed:', error);
        alert('Import failed. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to delete all chat data? This cannot be undone.')) {
      await clearAllData();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  // Sort sessions: pinned first, then by update time
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  return (
    <div className="w-80 h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">GhostChat v2.0</h1>
          <div className="flex items-center space-x-2">
            <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              Local-First
            </div>
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* New Session Form */}
        <form onSubmit={handleCreateSession} className="space-y-2">
          <input
            type="text"
            value={newSessionTitle}
            onChange={(e) => setNewSessionTitle(e.target.value)}
            placeholder="New session title..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isCreating}
          />
          <button
            type="submit"
            disabled={!newSessionTitle.trim() || isCreating}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {isCreating ? '⏳ Creating...' : '➕ New Session'}
          </button>
        </form>

        {/* Actions Menu */}
        {showActions && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
            <button
              onClick={handleExport}
              className="w-full text-left px-2 py-1 hover:bg-gray-200 rounded flex items-center space-x-2"
            >
              <span>📤</span>
              <span>Export All Sessions</span>
            </button>
            
            <label className="w-full text-left px-2 py-1 hover:bg-gray-200 rounded flex items-center space-x-2 cursor-pointer">
              <span>📥</span>
              <span>Import Sessions</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            
            <button
              onClick={handleClearData}
              className="w-full text-left px-2 py-1 hover:bg-red-100 text-red-600 rounded flex items-center space-x-2"
            >
              <span>🗑️</span>
              <span>Clear All Data</span>
            </button>
          </div>
        )}
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {sortedSessions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            <p>No sessions yet</p>
            <p className="text-sm mt-1">Create your first chat above!</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sortedSessions.map((session) => (
              <div
                key={session.id}
                className={`group relative rounded-lg transition-colors ${
                  session.id === currentSessionId
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Link
                  href={`/v2/chat/${session.id}`}
                  className="block p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 mb-1">
                        {session.pinned && <span className="text-yellow-500">📌</span>}
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {session.title}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatTime(session.updatedAt)} ago</span>
                        <span>•</span>
                        <span>{session.model || 'gpt-3.5-turbo'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          pinSession(session.id, !session.pinned);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title={session.pinned ? 'Unpin' : 'Pin'}
                      >
                        {session.pinned ? '📌' : '📍'}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm('Delete this session?')) {
                            deleteSession(session.id);
                          }
                        }}
                        className="p-1 hover:bg-red-100 text-red-600 rounded"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Storage Info */}
      <div className="p-3 border-t border-gray-200 bg-white text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>Storage:</span>
          <span className="capitalize">
            {storageInfo ? `${storageInfo.type} (${formatFileSize(storageInfo.size)})` : 'Loading...'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Sessions:</span>
          <span>{sessions.length}</span>
        </div>
        <div className="text-center text-gray-400 pt-2">
          🔒 Private • 💾 Local • ⚡ Offline
        </div>
      </div>
    </div>
  );
}
