'use client';

import { useState } from 'react';

interface SystemPromptEditorProps {
  prompt: string;
  onSave: (prompt: string) => Promise<void>;
}

export default function SystemPromptEditor({ prompt, onSave }: SystemPromptEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(prompt);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editValue === prompt) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save system prompt:', error);
      // Could show an error toast here
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(prompt);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="px-6 py-3 bg-amber-50 border-b border-amber-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-amber-600">🧠</span>
              <h3 className="text-sm font-medium text-amber-800">System Prompt</h3>
              <div className="px-2 py-0.5 bg-amber-200 text-amber-700 text-xs rounded-full">
                Local
              </div>
            </div>
            <p className="text-sm text-amber-700 leading-relaxed max-w-4xl">
              {prompt || 'No system prompt set. Click edit to add instructions for the AI.'}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors"
          >
            <span>✏️</span>
            <span>Edit</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-amber-600">🧠</span>
        <h3 className="text-sm font-medium text-amber-800">Edit System Prompt</h3>
        <div className="px-2 py-0.5 bg-amber-200 text-amber-700 text-xs rounded-full">
          Local
        </div>
      </div>
      
      <div className="space-y-3">
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder="Enter instructions for the AI (e.g., 'You are a helpful assistant that...')"
          className="w-full h-24 px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm"
          autoFocus
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-amber-700">
            <span>💡 Tip: Be specific about tone, expertise, and response style</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                  <span>Saving</span>
                </div>
              ) : (
                'Save Prompt'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
