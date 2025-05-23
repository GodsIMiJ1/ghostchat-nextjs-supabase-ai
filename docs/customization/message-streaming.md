# Adding Message Streaming

This guide explains how to implement message streaming in GhostChat, allowing AI responses to appear in real-time as they're being generated.

## Table of Contents

- [Understanding Message Streaming](#understanding-message-streaming)
- [Backend Implementation](#backend-implementation)
- [Frontend Implementation](#frontend-implementation)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Advanced Features](#advanced-features)

## Understanding Message Streaming

### What is Message Streaming?

Message streaming is a technique where the AI's response is sent to the client in chunks as it's being generated, rather than waiting for the complete response. This provides several benefits:

1. **Improved User Experience**: Users see responses immediately and can start reading while the rest is being generated
2. **Faster Perceived Response Time**: Even if the total generation time is the same, the perceived response time is much faster
3. **Early Cancellation**: Users can cancel long responses if they see it's not going in the right direction

### How Streaming Works

1. The client sends a request to the server
2. The server makes a streaming request to the AI provider
3. As chunks of the response are received, they're forwarded to the client
4. The client updates the UI in real-time with each chunk
5. Once the complete response is received, it's saved to the database

## Backend Implementation

### Step 1: Update OpenAI Client

First, ensure your OpenAI client supports streaming:

```typescript
// src/lib/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
});

export default openai;

// Existing function for non-streaming responses
export async function generateChatCompletion(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  model: string = 'gpt-3.5-turbo'
) {
  // ... existing implementation ...
}

// New function for streaming responses
export async function generateStreamingChatCompletion(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  model: string = 'gpt-3.5-turbo'
) {
  try {
    const stream = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    return stream;
  } catch (error) {
    console.error('Error generating streaming chat completion:', error);
    throw error;
  }
}
```

### Step 2: Create a Streaming API Route

Create a new API route specifically for streaming:

```typescript
// src/app/api/chat/stream/route.ts
import { NextRequest } from 'next/server';
import { generateStreamingChatCompletion } from '@/lib/openai';
import { supabase } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { messages, chatId } = await request.json();

    // Verify authentication
    const cookieStore = cookies();
    const supabaseToken = cookieStore.get('sb-access-token')?.value;
    
    if (!supabaseToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user's token
    const supabaseClient = supabase;
    
    // Verify chat ownership
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: chatData, error: chatError } = await supabaseClient
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .eq('user_id', userData.user.id)
      .single();

    if (chatError || !chatData) {
      return new Response(JSON.stringify({ error: 'Chat not found or access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get streaming response from OpenAI
    const openaiStream = await generateStreamingChatCompletion(messages);
    
    // Create a ReadableStream to send to the client
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        
        try {
          // Process the OpenAI stream
          for await (const chunk of openaiStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              // Add to full response
              fullResponse += content;
              
              // Send chunk to client
              const encoder = new TextEncoder();
              controller.enqueue(encoder.encode(content));
            }
          }
          
          // Save the complete response to the database
          await supabaseClient
            .from('messages')
            .insert([
              {
                chat_id: chatId,
                role: 'assistant',
                content: fullResponse,
                created_at: new Date().toISOString(),
              },
            ]);
          
          controller.close();
        } catch (error) {
          console.error('Error processing stream:', error);
          controller.error(error);
        }
      },
    });

    // Return the stream
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in streaming API route:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

## Frontend Implementation

### Step 1: Update the ChatWindow Component

Modify the `ChatWindow` component to handle streaming:

```typescript
// src/components/ChatWindow.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, Message, Chat } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';
import MessageBubble from './MessageBubble';
import SystemPromptEditor from './SystemPromptEditor';

interface ChatWindowProps {
  chatId: string;
}

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);

  // Fetch chat and messages (existing code)...

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage?.content]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId || isProcessing) return;

    setIsProcessing(true);
    
    try {
      // Insert user message
      const userMessage = {
        chat_id: chatId,
        role: 'user',
        content: newMessage,
        created_at: new Date().toISOString(),
      };

      const { error: userMessageError } = await supabase
        .from('messages')
        .insert([userMessage]);

      if (userMessageError) throw userMessageError;

      // Clear input
      setNewMessage('');

      // Prepare messages for API call
      const allMessages = [
        ...(chat?.system_prompt
          ? [{ role: 'system', content: chat.system_prompt }]
          : []),
        ...messages,
        userMessage,
      ] as { role: 'user' | 'assistant' | 'system'; content: string }[];

      // Create a temporary streaming message
      const tempStreamingMessage: Message = {
        id: 'streaming-' + Date.now(),
        chat_id: chatId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      };
      
      setStreamingMessage(tempStreamingMessage);

      // Call streaming API route
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: allMessages,
          chatId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      // Process the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          setStreamingMessage(prev => ({
            ...prev!,
            content: prev!.content + chunk,
          }));
        }
      }
      
      // The complete message will be added via the real-time subscription
      setStreamingMessage(null);
    } catch (error) {
      console.error('Error sending message:', error);
      setStreamingMessage(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Rest of the component...

  return (
    <div className="flex flex-col h-full">
      {/* ... existing code ... */}

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !streamingMessage ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {streamingMessage && (
              <MessageBubble key={streamingMessage.id} message={streamingMessage} isStreaming={true} />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ... existing code ... */}
    </div>
  );
}
```

### Step 2: Update the MessageBubble Component

Modify the `MessageBubble` component to show a typing indicator for streaming messages:

```typescript
// src/components/MessageBubble.tsx
'use client';

import { Message } from '@/lib/supabaseClient';
import { formatTimestamp } from '@/utils/formatTimestamp';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div
          className={`text-xs mt-1 ${
            isUser ? 'text-blue-200' : 'text-gray-500'
          }`}
        >
          {isStreaming ? (
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse mr-1"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse mr-1" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
            </span>
          ) : (
            formatTimestamp(message.created_at)
          )}
        </div>
      </div>
    </div>
  );
}
```

## Error Handling

### Handling Stream Interruptions

Add error handling for stream interruptions:

```typescript
// In the streaming API route
try {
  // Process the OpenAI stream
  for await (const chunk of openaiStream) {
    // ... existing code ...
  }
} catch (error) {
  console.error('Stream interrupted:', error);
  
  // If we have a partial response, still save it
  if (fullResponse) {
    await supabaseClient
      .from('messages')
      .insert([
        {
          chat_id: chatId,
          role: 'assistant',
          content: fullResponse + ' [Response interrupted]',
          created_at: new Date().toISOString(),
        },
      ]);
  }
  
  controller.error(error);
}
```

### Client-Side Error Recovery

Add client-side error recovery:

```typescript
// In ChatWindow.tsx
try {
  // ... existing streaming code ...
} catch (error) {
  console.error('Error in streaming:', error);
  
  // Show error message to user
  setStreamingMessage({
    id: 'error-' + Date.now(),
    chat_id: chatId,
    role: 'assistant',
    content: 'Sorry, there was an error generating the response. Please try again.',
    created_at: new Date().toISOString(),
  });
  
  // After a delay, remove the error message
  setTimeout(() => {
    setStreamingMessage(null);
  }, 5000);
}
```

## Performance Optimization

### Debouncing UI Updates

To prevent excessive re-renders during streaming, implement debouncing:

```typescript
// In ChatWindow.tsx
import { useCallback, useRef } from 'react';

// Add this inside the component
const updateInterval = useRef<NodeJS.Timeout | null>(null);
const pendingContent = useRef('');

const processStreamChunk = useCallback((chunk: string) => {
  pendingContent.current += chunk;
  
  // Update UI at most every 50ms
  if (!updateInterval.current) {
    updateInterval.current = setInterval(() => {
      if (pendingContent.current) {
        setStreamingMessage(prev => ({
          ...prev!,
          content: prev!.content + pendingContent.current,
        }));
        pendingContent.current = '';
      } else {
        // No new content, clear the interval
        if (updateInterval.current) {
          clearInterval(updateInterval.current);
          updateInterval.current = null;
        }
      }
    }, 50);
  }
}, []);

// Clean up on unmount
useEffect(() => {
  return () => {
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
    }
  };
}, []);

// Use in the streaming code
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  processStreamChunk(chunk);
}
```

### Optimizing Message Rendering

For large conversations, optimize message rendering:

```typescript
// In ChatWindow.tsx
import { memo } from 'react';

// Memoize the MessageBubble component
const MemoizedMessageBubble = memo(MessageBubble);

// Use in the render function
{messages.map((message) => (
  <MemoizedMessageBubble key={message.id} message={message} />
))}
```

## Advanced Features

### Message Cancellation

Add the ability to cancel streaming messages:

```typescript
// In ChatWindow.tsx
const [abortController, setAbortController] = useState<AbortController | null>(null);

const handleCancelResponse = () => {
  if (abortController) {
    abortController.abort();
    setAbortController(null);
    setStreamingMessage(prev => {
      if (prev) {
        return {
          ...prev,
          content: prev.content + ' [Response cancelled]',
        };
      }
      return null;
    });
    
    // Save the partial response
    if (streamingMessage && streamingMessage.content) {
      supabase
        .from('messages')
        .insert([
          {
            chat_id: chatId,
            role: 'assistant',
            content: streamingMessage.content + ' [Response cancelled]',
            created_at: new Date().toISOString(),
          },
        ])
        .then(() => {
          setStreamingMessage(null);
        });
    }
  }
};

// In the handleSendMessage function
const controller = new AbortController();
setAbortController(controller);

const response = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: allMessages,
    chatId,
  }),
  signal: controller.signal,
});

// Add a cancel button to the UI when streaming
{streamingMessage && (
  <button
    onClick={handleCancelResponse}
    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
  >
    Cancel
  </button>
)}
```

### Markdown Rendering

Add Markdown rendering for messages:

```typescript
// Install react-markdown
// npm install react-markdown

// In MessageBubble.tsx
import ReactMarkdown from 'react-markdown';

// Replace the content div
<div className="whitespace-pre-wrap">
  <ReactMarkdown>{message.content}</ReactMarkdown>
</div>
```

### Typing Indicator

Add a more sophisticated typing indicator:

```typescript
// In MessageBubble.tsx
const TypingIndicator = () => (
  <div className="flex items-center space-x-1">
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
);

// Use in the component
{isStreaming && message.content === '' ? (
  <TypingIndicator />
) : (
  <div className="whitespace-pre-wrap">{message.content}</div>
)}
```

### Word-by-Word Animation

For an even more engaging experience, add word-by-word animation:

```typescript
// In MessageBubble.tsx
const [displayedContent, setDisplayedContent] = useState('');
const [isAnimating, setIsAnimating] = useState(false);

useEffect(() => {
  if (isStreaming && message.content !== displayedContent) {
    // Get the new content to add
    const newContent = message.content.slice(displayedContent.length);
    
    // If there's new content, animate it
    if (newContent) {
      setIsAnimating(true);
      
      // Split into words and add one by one
      const words = newContent.split(/(\s+)/);
      let currentIndex = 0;
      
      const animateNextWord = () => {
        if (currentIndex < words.length) {
          setDisplayedContent(prev => prev + words[currentIndex]);
          currentIndex++;
          setTimeout(animateNextWord, 50);
        } else {
          setIsAnimating(false);
        }
      };
      
      animateNextWord();
    }
  } else if (!isStreaming) {
    // If not streaming, show the full content
    setDisplayedContent(message.content);
  }
}, [isStreaming, message.content, displayedContent]);

// Use displayedContent instead of message.content
<div className="whitespace-pre-wrap">
  {isStreaming ? displayedContent : message.content}
</div>
```
