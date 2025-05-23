# Data Flow

This document explains the data flow in GhostChat, providing an overview of how data moves through the application, from user input to database storage and back to the UI.

## Overview

GhostChat follows a unidirectional data flow pattern, where data flows in a single direction through the application:

1. **User Input**: User interacts with the UI
2. **Client-Side Processing**: React components process the input
3. **API Requests**: Data is sent to API routes
4. **Server-Side Processing**: API routes process the data
5. **External Services**: Interact with Supabase and OpenAI
6. **Database Storage**: Data is stored in Supabase
7. **Real-Time Updates**: Changes are pushed to clients via Supabase real-time
8. **UI Updates**: React components update based on new data

## Data Flow Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│             │         │             │         │             │
│    User     │ ──────> │  React UI   │ ──────> │  API Routes │
│             │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
                              ▲                        │
                              │                        │
                              │                        ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│             │         │             │         │             │
│  Supabase   │ <────── │ Real-Time   │ <────── │   OpenAI    │
│  Database   │         │ Subscriptions│         │    API      │
│             │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
```

## User Input Flow

### Chat Message Flow

When a user sends a message:

1. User types a message and clicks "Send"
2. The `ChatWindow` component captures the input
3. The component sends a POST request to `/api/chat`
4. The API route authenticates the request
5. The user message is stored in Supabase
6. The API route calls the OpenAI API
7. The AI response is stored in Supabase
8. Real-time subscriptions notify the client
9. The UI updates to show the new messages

```typescript
// In ChatWindow.tsx
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
    ];

    // Call API route to get AI response
    const response = await fetch('/api/chat', {
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
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    setIsProcessing(false);
  }
};
```

### Authentication Flow

When a user signs in:

1. User enters credentials and submits the form
2. The `SignInForm` component captures the input
3. The component calls the `signIn` function from `AuthContext`
4. The function calls Supabase authentication API
5. Supabase returns a session token
6. The `AuthContext` updates the user state
7. Protected routes become accessible

```typescript
// In AuthContext.tsx
const signIn = async (email: string, password: string) => {
  setLoading(true);
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

## Server-Side Data Flow

### API Route Flow

When the API route processes a chat request:

1. The route receives the request with messages and chatId
2. It authenticates the user using Supabase
3. It verifies chat ownership
4. It calls the OpenAI API with the messages
5. It receives the AI response
6. It stores the response in Supabase
7. It returns a success response to the client

```typescript
// In src/app/api/chat/route.ts
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

## Database Interactions

### Data Storage

GhostChat stores data in Supabase PostgreSQL database:

1. **Users**: Managed by Supabase Auth
2. **Chats**: Stores chat metadata
3. **Messages**: Stores individual messages

```typescript
// Database types
export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type Chat = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  system_prompt: string;
};

export type Message = {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
};
```

### Data Retrieval

Data is retrieved from Supabase using the Supabase client:

```typescript
// Fetch chats
const { data: chats, error } = await supabase
  .from('chats')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });

// Fetch messages
const { data: messages, error } = await supabase
  .from('messages')
  .select('*')
  .eq('chat_id', chatId)
  .order('created_at', { ascending: true });
```

## Real-Time Updates

GhostChat uses Supabase's real-time functionality to update the UI when data changes:

```typescript
// Subscribe to new messages
const messagesSubscription = supabase
  .channel(`messages:chat_id=eq.${chatId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `chat_id=eq.${chatId}`,
    },
    (payload) => {
      const newMessage = payload.new as Message;
      setMessages((prev) => [...prev, newMessage]);
    }
  )
  .subscribe();

// Clean up subscription
return () => {
  supabase.removeChannel(messagesSubscription);
};
```

## External API Interactions

### OpenAI API

GhostChat interacts with the OpenAI API to generate AI responses:

```typescript
// In src/lib/openai.ts
export async function generateChatCompletion(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  model: string = 'gpt-3.5-turbo'
) {
  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating chat completion:', error);
    throw error;
  }
}
```

## Error Handling

GhostChat implements error handling at multiple levels:

1. **Client-Side**: React components catch and display errors
2. **API Routes**: API routes catch and return appropriate error responses
3. **Database**: Supabase errors are caught and handled
4. **External APIs**: OpenAI API errors are caught and handled

```typescript
// Client-side error handling
try {
  // Operation that might fail
} catch (error) {
  console.error('Error:', error);
  setError('Something went wrong. Please try again.');
} finally {
  setLoading(false);
}

// API route error handling
try {
  // API logic
} catch (error) {
  console.error('API error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

## Optimistic Updates

For a better user experience, GhostChat implements optimistic updates:

1. Update the UI immediately when the user performs an action
2. Send the request to the server
3. If the request fails, revert the UI update

```typescript
// Example of optimistic update for sending a message
const handleSendMessage = async () => {
  // Create message object
  const newMessage = {
    id: 'temp-' + Date.now(),
    chat_id: chatId,
    role: 'user',
    content: messageText,
    created_at: new Date().toISOString(),
  };
  
  // Optimistically update UI
  setMessages((prev) => [...prev, newMessage]);
  setMessageText('');
  
  try {
    // Send to server
    const { error } = await supabase
      .from('messages')
      .insert([{
        chat_id: chatId,
        role: 'user',
        content: newMessage.content,
      }]);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Revert optimistic update
    setMessages((prev) => prev.filter(msg => msg.id !== newMessage.id));
    setMessageText(newMessage.content);
    
    // Show error
    setError('Failed to send message. Please try again.');
  }
};
```

## Data Caching

GhostChat implements client-side caching for better performance:

1. Store fetched data in component state
2. Use React Query or SWR for more advanced caching (optional)
3. Implement local storage for offline support (optional)

```typescript
// Example of simple caching with useState
const [chats, setChats] = useState<Chat[]>([]);
const [chatCache, setChatCache] = useState<Record<string, Message[]>>({});

// Fetch messages with caching
const fetchMessages = async (chatId: string) => {
  // Check cache first
  if (chatCache[chatId]) {
    setMessages(chatCache[chatId]);
    return;
  }
  
  // Fetch from server if not in cache
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  
  // Update cache
  setChatCache((prev) => ({
    ...prev,
    [chatId]: data,
  }));
  
  setMessages(data);
};
```

## Conclusion

GhostChat follows a clean, unidirectional data flow pattern that makes the application predictable and maintainable. By understanding this data flow, developers can easily extend and modify the application to add new features or improve existing ones.
