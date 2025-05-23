# Alternative AI Providers

This guide explains how to replace OpenAI with alternative AI providers in GhostChat, with a focus on using Ollama for local AI inference.

## Table of Contents

- [Why Use Alternative AI Providers](#why-use-alternative-ai-providers)
- [Integrating Ollama](#integrating-ollama)
- [Using Other AI Providers](#using-other-ai-providers)
- [Creating a Provider-Agnostic Interface](#creating-a-provider-agnostic-interface)
- [Handling Provider-Specific Features](#handling-provider-specific-features)
- [Performance Considerations](#performance-considerations)

## Why Use Alternative AI Providers

There are several reasons to consider alternative AI providers:

1. **Cost**: Local inference can be more cost-effective for high-volume usage
2. **Privacy**: Local models don't send data to external servers
3. **Latency**: Local inference can have lower latency
4. **Customization**: Some providers offer more customization options
5. **Specialized Models**: Different providers may offer models specialized for certain tasks

## Integrating Ollama

[Ollama](https://ollama.ai/) is an open-source tool that allows you to run large language models locally. Here's how to integrate it with GhostChat:

### Step 1: Install Ollama

First, install Ollama on your local machine or server:

- **macOS/Linux**: `curl -fsSL https://ollama.ai/install.sh | sh`
- **Windows**: Download from [Ollama's website](https://ollama.ai/download)

### Step 2: Pull a Model

Pull a model that you want to use:

```bash
ollama pull llama2
# or other models like
# ollama pull mistral
# ollama pull gemma:7b
```

### Step 3: Create an Ollama Client

Create a new file `src/lib/ollama.ts`:

```typescript
// src/lib/ollama.ts
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_DEFAULT_MODEL || 'llama2';

interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OllamaCompletionResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
  eval_count?: number;
}

interface OllamaStreamingResponse extends OllamaCompletionResponse {
  response: string;
}

/**
 * Generate a chat completion using Ollama
 */
export async function generateChatCompletion(
  messages: OllamaMessage[],
  model: string = DEFAULT_MODEL
): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data: OllamaCompletionResponse = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('Error generating chat completion with Ollama:', error);
    throw error;
  }
}

/**
 * Generate a streaming chat completion using Ollama
 */
export async function generateStreamingChatCompletion(
  messages: OllamaMessage[],
  model: string = DEFAULT_MODEL
) {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    // Return the response as a stream
    return response.body;
  } catch (error) {
    console.error('Error generating streaming chat completion with Ollama:', error);
    throw error;
  }
}

/**
 * Process a streaming response from Ollama
 */
export async function processOllamaStream(
  stream: ReadableStream<Uint8Array>,
  onChunk: (chunk: string) => void
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        try {
          const data: OllamaStreamingResponse = JSON.parse(line);
          onChunk(data.response);
        } catch (e) {
          console.error('Error parsing JSON from stream:', e);
        }
      }
    }
  } catch (error) {
    console.error('Error processing Ollama stream:', error);
    throw error;
  } finally {
    reader.releaseLock();
  }
}

export default {
  generateChatCompletion,
  generateStreamingChatCompletion,
  processOllamaStream,
};
```

### Step 4: Update the API Route

Update the chat API route to use Ollama instead of OpenAI:

```typescript
// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateChatCompletion } from '@/lib/ollama'; // Import from ollama instead of openai
import { supabase } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { messages, chatId } = await request.json();

    // Authentication checks remain the same...

    // Generate AI response using Ollama
    const aiResponse = await generateChatCompletion(messages);

    // Save AI response to database
    const { error: insertError } = await supabaseClient
      .from('messages')
      .insert([
        {
          chat_id: chatId,
          role: 'assistant',
          content: aiResponse || 'I apologize, but I was unable to generate a response.',
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      console.error('Error inserting AI response:', insertError);
      return NextResponse.json(
        { error: 'Failed to save AI response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 5: Create a Streaming API Route (Optional)

For streaming responses, create a dedicated streaming API route:

```typescript
// src/app/api/chat/stream/route.ts
import { NextRequest } from 'next/server';
import { generateStreamingChatCompletion, processOllamaStream } from '@/lib/ollama';
import { supabase } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { messages, chatId } = await request.json();

    // Authentication checks...

    // Get streaming response from Ollama
    const ollamaStream = await generateStreamingChatCompletion(messages);
    
    // Create a ReadableStream to send to the client
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        
        // Process the Ollama stream
        await processOllamaStream(ollamaStream, (chunk) => {
          // Add to full response
          fullResponse += chunk;
          
          // Send chunk to client
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(chunk));
        });
        
        // Save the complete response to the database
        await supabase
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
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
```

### Step 6: Update Environment Variables

Add Ollama-specific environment variables to your `.env.local` file:

```
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama2
```

### Step 7: Update the Frontend (Optional)

If you want to allow users to select different models, update the UI:

```tsx
// Add a model selector to SystemPromptEditor.tsx
const models = [
  { id: 'llama2', name: 'Llama 2' },
  { id: 'mistral', name: 'Mistral' },
  { id: 'gemma:7b', name: 'Gemma 7B' },
];

// Add a select element to the form
<select
  value={selectedModel}
  onChange={(e) => setSelectedModel(e.target.value)}
  className="w-full p-2 border border-gray-300 rounded-md"
>
  {models.map((model) => (
    <option key={model.id} value={model.id}>
      {model.name}
    </option>
  ))}
</select>
```

## Using Other AI Providers

### Anthropic Claude

To use Anthropic's Claude:

```typescript
// src/lib/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function generateChatCompletion(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  model: string = 'claude-3-opus-20240229'
) {
  try {
    // Convert messages to Anthropic format
    const anthropicMessages = messages.map(msg => {
      if (msg.role === 'system') {
        return { role: 'system', content: msg.content };
      } else if (msg.role === 'user') {
        return { role: 'user', content: msg.content };
      } else {
        return { role: 'assistant', content: msg.content };
      }
    });

    const response = await anthropic.messages.create({
      model,
      messages: anthropicMessages,
      max_tokens: 1000,
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Error generating chat completion with Anthropic:', error);
    throw error;
  }
}
```

### Google Gemini

To use Google's Gemini:

```typescript
// src/lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function generateChatCompletion(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  model: string = 'gemini-pro'
) {
  try {
    const geminiModel = genAI.getGenerativeModel({ model });
    
    // Convert messages to Gemini format
    const geminiMessages = messages.map(msg => {
      if (msg.role === 'user') {
        return { role: 'user', parts: [{ text: msg.content }] };
      } else if (msg.role === 'assistant') {
        return { role: 'model', parts: [{ text: msg.content }] };
      } else {
        // Handle system messages (Gemini doesn't have system messages)
        return { role: 'user', parts: [{ text: `System instruction: ${msg.content}` }] };
      }
    });

    const chat = geminiModel.startChat({
      history: geminiMessages,
    });

    const result = await chat.sendMessage('');
    return result.response.text();
  } catch (error) {
    console.error('Error generating chat completion with Gemini:', error);
    throw error;
  }
}
```

## Creating a Provider-Agnostic Interface

To make it easy to switch between providers, create a provider-agnostic interface:

```typescript
// src/lib/ai.ts
import * as openai from './openai';
import * as ollama from './ollama';
import * as anthropic from './anthropic';
import * as gemini from './gemini';

// Define the provider type
type Provider = 'openai' | 'ollama' | 'anthropic' | 'gemini';

// Get the current provider from environment variables
const currentProvider = (process.env.AI_PROVIDER || 'openai') as Provider;

// Map of providers to their implementations
const providers = {
  openai,
  ollama,
  anthropic,
  gemini,
};

// Get the current provider implementation
const provider = providers[currentProvider];

// Export the provider's functions
export const generateChatCompletion = provider.generateChatCompletion;
export const generateStreamingChatCompletion = provider.generateStreamingChatCompletion;

// Export the provider information
export const getProviderInfo = () => ({
  name: currentProvider,
  models: getAvailableModels(),
});

// Get available models for the current provider
function getAvailableModels() {
  switch (currentProvider) {
    case 'openai':
      return [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        { id: 'gpt-4', name: 'GPT-4' },
      ];
    case 'ollama':
      return [
        { id: 'llama2', name: 'Llama 2' },
        { id: 'mistral', name: 'Mistral' },
        { id: 'gemma:7b', name: 'Gemma 7B' },
      ];
    case 'anthropic':
      return [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      ];
    case 'gemini':
      return [
        { id: 'gemini-pro', name: 'Gemini Pro' },
      ];
    default:
      return [];
  }
}
```

Then update your API routes to use this provider-agnostic interface:

```typescript
// src/app/api/chat/route.ts
import { generateChatCompletion } from '@/lib/ai';
```

## Handling Provider-Specific Features

Different providers may have different capabilities. Here's how to handle them:

### Model Parameters

Create a function to map generic parameters to provider-specific ones:

```typescript
// src/lib/ai.ts
export function mapParameters(provider: Provider, params: any) {
  switch (provider) {
    case 'openai':
      return {
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        top_p: params.topP,
      };
    case 'ollama':
      return {
        temperature: params.temperature,
        num_predict: params.maxTokens,
        top_p: params.topP,
      };
    case 'anthropic':
      return {
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        top_p: params.topP,
      };
    case 'gemini':
      return {
        temperature: params.temperature,
        maxOutputTokens: params.maxTokens,
        topP: params.topP,
      };
    default:
      return params;
  }
}
```

### Message Formats

Create adapters for different message formats:

```typescript
// src/lib/ai.ts
export function adaptMessages(provider: Provider, messages: any[]) {
  switch (provider) {
    case 'openai':
      return messages; // OpenAI format is our base format
    case 'ollama':
      return messages; // Ollama uses the same format
    case 'anthropic':
      // Anthropic doesn't support system messages in the same way
      return messages.map(msg => {
        if (msg.role === 'system') {
          return { role: 'user', content: `System instruction: ${msg.content}` };
        }
        return msg;
      });
    case 'gemini':
      // Convert to Gemini format
      return messages.map(msg => {
        if (msg.role === 'user') {
          return { role: 'user', parts: [{ text: msg.content }] };
        } else if (msg.role === 'assistant') {
          return { role: 'model', parts: [{ text: msg.content }] };
        } else {
          return { role: 'user', parts: [{ text: `System instruction: ${msg.content}` }] };
        }
      });
    default:
      return messages;
  }
}
```

## Performance Considerations

### Local vs. Cloud Models

When using Ollama for local inference:

1. **Hardware Requirements**: Ensure your server has sufficient RAM and GPU for the model
2. **Warm-up Time**: First inference may be slow as the model loads into memory
3. **Concurrency**: Local models may struggle with multiple concurrent requests

### Hybrid Approach

Consider a hybrid approach:

1. Use local models for development and testing
2. Use cloud providers for production or when local resources are insufficient
3. Implement fallback mechanisms to switch between providers

```typescript
// Example fallback mechanism
async function generateWithFallback(messages, model) {
  try {
    // Try local model first
    return await ollama.generateChatCompletion(messages, model);
  } catch (error) {
    console.warn('Local model failed, falling back to OpenAI:', error);
    // Fall back to OpenAI
    return await openai.generateChatCompletion(messages, 'gpt-3.5-turbo');
  }
}
```

### Caching

Implement caching to improve performance:

```typescript
// Simple in-memory cache
const cache = new Map();

async function generateWithCache(messages, model) {
  const cacheKey = JSON.stringify({ messages, model });
  
  // Check cache
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  // Generate response
  const response = await generateChatCompletion(messages, model);
  
  // Cache response
  cache.set(cacheKey, response);
  
  return response;
}
```
