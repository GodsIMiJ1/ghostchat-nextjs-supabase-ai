# API Routes

GhostChat uses Next.js API routes to handle server-side operations. This document explains the API routes available in the application and how to use them.

## Overview

API routes in Next.js are serverless functions that run on the server. In GhostChat, they are used for:

1. Processing chat messages
2. Interacting with the OpenAI API
3. Authenticating requests
4. Storing data in Supabase

## API Route Structure

API routes are located in the `src/app/api` directory and follow the Next.js App Router convention:

```
src/app/api/
└── chat/
    └── route.ts
```

## Chat API Route

The main API route for handling chat functionality is located at `src/app/api/chat/route.ts`.

### Endpoint: POST /api/chat

This endpoint processes user messages and generates AI responses.

#### Request

```typescript
// POST /api/chat
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello, how are you?" },
    { "role": "assistant", "content": "I'm doing well, thank you! How can I help you today?" },
    { "role": "user", "content": "What's the weather like?" }
  ],
  "chatId": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### Response

```typescript
// Success response
{
  "success": true
}

// Error response
{
  "error": "Error message"
}
```

#### Implementation

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateChatCompletion } from '@/lib/openai';
import { supabase } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { messages, chatId } = await request.json();

    // Verify authentication
    const cookieStore = cookies();
    const supabaseToken = cookieStore.get('sb-access-token')?.value;
    
    if (!supabaseToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase client with user's token
    const supabaseClient = supabase;
    
    // Verify chat ownership
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: chatData, error: chatError } = await supabaseClient
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .eq('user_id', userData.user.id)
      .single();

    if (chatError || !chatData) {
      return NextResponse.json(
        { error: 'Chat not found or access denied' },
        { status: 403 }
      );
    }

    // Generate AI response
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

## Authentication in API Routes

GhostChat uses Supabase for authentication. API routes verify authentication using the Supabase token stored in cookies:

```typescript
// Verify authentication
const cookieStore = cookies();
const supabaseToken = cookieStore.get('sb-access-token')?.value;

if (!supabaseToken) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

// Get user information
const { data: userData, error: userError } = await supabase.auth.getUser();

if (userError || !userData.user) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}
```

## Error Handling

API routes implement consistent error handling:

1. **Authentication errors**: 401 Unauthorized
2. **Authorization errors**: 403 Forbidden
3. **Not found errors**: 404 Not Found
4. **Validation errors**: 400 Bad Request
5. **Server errors**: 500 Internal Server Error

Example:

```typescript
try {
  // API logic...
} catch (error) {
  console.error('API error:', error);
  
  if (error.code === 'auth/invalid-token') {
    return NextResponse.json(
      { error: 'Invalid authentication token' },
      { status: 401 }
    );
  } else if (error.code === 'permission-denied') {
    return NextResponse.json(
      { error: 'Permission denied' },
      { status: 403 }
    );
  } else {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Rate Limiting

To prevent abuse, you can implement rate limiting in API routes:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create a Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || '',
});

// Create a rate limiter that allows 10 requests per minute
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});

export async function POST(request: NextRequest) {
  try {
    // Get user ID from authentication
    const cookieStore = cookies();
    const supabaseToken = cookieStore.get('sb-access-token')?.value;
    
    if (!supabaseToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Apply rate limiting
    const { success, limit, reset, remaining } = await ratelimit.limit(userId);
    
    if (!success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          limit,
          reset,
          remaining,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }
    
    // Continue with API logic...
  } catch (error) {
    // Error handling...
  }
}
```

## Streaming Responses

For streaming AI responses, you can implement a streaming API route:

```typescript
import { NextRequest } from 'next/server';
import { generateStreamingChatCompletion } from '@/lib/openai';
import { supabase } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { messages, chatId } = await request.json();

    // Authentication checks...

    // Create a ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Get streaming response from OpenAI
          const openaiStream = await generateStreamingChatCompletion(messages);
          
          let fullResponse = '';
          
          // Process each chunk
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
        } catch (error) {
          console.error('Streaming error:', error);
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
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
```

## Creating New API Routes

To create a new API route:

1. Create a new directory in `src/app/api/`
2. Add a `route.ts` file with the appropriate HTTP method handlers

Example for a user profile API:

```typescript
// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Authentication checks...
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();
    
    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ profile: profileData });
  } catch (error) {
    console.error('Error in profile API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { name, bio } = await request.json();
    
    // Authentication checks...
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Update user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({ name, bio })
      .eq('id', userData.user.id)
      .select();
    
    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ profile: profileData[0] });
  } catch (error) {
    console.error('Error in profile API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Best Practices

### 1. Validate Input

Always validate input data:

```typescript
import { z } from 'zod';

// Define a schema for validation
const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().min(1).max(4000),
    })
  ).min(1),
  chatId: z.string().uuid(),
});

// In your API route
try {
  const body = await request.json();
  
  // Validate the request body
  const result = chatRequestSchema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: result.error.format() },
      { status: 400 }
    );
  }
  
  const { messages, chatId } = result.data;
  
  // Continue with API logic...
} catch (error) {
  // Error handling...
}
```

### 2. Use Middleware for Common Logic

Create middleware for common operations like authentication:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function middleware(request: NextRequest) {
  // Check for authentication
  const supabaseToken = request.cookies.get('sb-access-token')?.value;
  
  if (!supabaseToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Continue to the API route
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### 3. Implement Proper Error Handling

Use consistent error handling across all API routes:

```typescript
function handleApiError(error: any) {
  console.error('API error:', error);
  
  // Determine the appropriate status code
  let status = 500;
  let message = 'Internal server error';
  
  if (error.code === 'auth/invalid-token') {
    status = 401;
    message = 'Invalid authentication token';
  } else if (error.code === 'permission-denied') {
    status = 403;
    message = 'Permission denied';
  } else if (error.code === 'not-found') {
    status = 404;
    message = 'Resource not found';
  } else if (error.code === 'invalid-argument') {
    status = 400;
    message = 'Invalid request data';
  }
  
  return NextResponse.json(
    { error: message },
    { status }
  );
}
```

### 4. Use Environment Variables for Configuration

Store sensitive information in environment variables:

```typescript
// .env.local
OPENAI_API_KEY=your_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

// In your API route
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.error('Missing OpenAI API key');
  return NextResponse.json(
    { error: 'Server configuration error' },
    { status: 500 }
  );
}
```

### 5. Implement Logging

Add proper logging for debugging and monitoring:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  console.log(`[${requestId}] API request started: ${request.url}`);
  
  try {
    // API logic...
    
    const responseTime = Date.now() - startTime;
    console.log(`[${requestId}] API request completed in ${responseTime}ms`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[${requestId}] API request failed in ${responseTime}ms:`, error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```
