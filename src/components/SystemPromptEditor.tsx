'use client';

import { useState } from 'react';

interface SystemPromptEditorProps {
  initialPrompt: string;
  onSave: (prompt: string) => Promise<void>;
}

export default function SystemPromptEditor({
  initialPrompt,
  onSave,
}: SystemPromptEditorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(prompt);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving system prompt:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">System Prompt</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
        </div>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{prompt}</p>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 bg-gray-100 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">Edit System Prompt</h3>
        <button
          onClick={() => setIsEditing(false)}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
        placeholder="Enter system instructions for the AI..."
      />
      <div className="mt-2 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
