# Component Structure

This document explains the component structure of GhostChat, providing an overview of how the UI components are organized and how they interact with each other.

## Component Hierarchy

GhostChat follows a hierarchical component structure:

```
App
├── AuthProvider
│   ├── HomePage
│   │   ├── SignInForm / SignUpForm
│   │   └── ChatList
│   └── ChatPage
│       └── ChatWindow
│           ├── SystemPromptEditor
│           ├── MessageList
│           │   └── MessageBubble
│           └── MessageInput
```

## Core Components

### AuthProvider

**File**: `src/components/AuthContext.tsx`

The `AuthProvider` is a context provider that manages authentication state throughout the application.

**Responsibilities**:
- Manage user authentication state
- Provide sign-in, sign-up, and sign-out functionality
- Check for active sessions on mount
- Subscribe to authentication state changes

**Usage**:
```tsx
// In layout.tsx
<AuthProvider>
  {children}
</AuthProvider>

// In components
const { user, loading, signIn, signUp, signOut } = useAuth();
```

### SignInForm and SignUpForm

**File**: `src/components/AuthForms.tsx`

These components provide the user interface for authentication.

**Responsibilities**:
- Collect user credentials
- Handle form submission
- Display loading states and error messages
- Manage form validation

**Usage**:
```tsx
// In page.tsx
{authView === 'signin' ? (
  <SignInForm />
) : (
  <SignUpForm />
)}
```

### ChatWindow

**File**: `src/components/ChatWindow.tsx`

The `ChatWindow` is the main component for the chat interface.

**Responsibilities**:
- Display chat messages
- Handle message sending
- Fetch and subscribe to messages
- Manage loading and processing states

**Usage**:
```tsx
// In chat/[id]/page.tsx
<ChatWindow chatId={params.id} />
```

### MessageBubble

**File**: `src/components/MessageBubble.tsx`

The `MessageBubble` component renders individual chat messages.

**Responsibilities**:
- Display message content
- Style messages based on sender (user or AI)
- Show timestamp
- Handle different message formats

**Usage**:
```tsx
// In ChatWindow.tsx
{messages.map((message) => (
  <MessageBubble key={message.id} message={message} />
))}
```

### SystemPromptEditor

**File**: `src/components/SystemPromptEditor.tsx`

The `SystemPromptEditor` allows users to customize the AI's behavior.

**Responsibilities**:
- Display current system prompt
- Provide interface for editing the prompt
- Save changes to the database
- Toggle between view and edit modes

**Usage**:
```tsx
// In ChatWindow.tsx
<SystemPromptEditor
  initialPrompt={chat.system_prompt || 'You are a helpful assistant.'}
  onSave={handleUpdateSystemPrompt}
/>
```

## Component Interactions

### Authentication Flow

1. The `AuthProvider` wraps the entire application and provides authentication context
2. The home page displays either `SignInForm` or `SignUpForm` based on user state
3. When a user signs in, the `AuthProvider` updates the user state
4. Protected routes check the user state to determine access

```tsx
// Example of a protected route
useEffect(() => {
  if (!loading && !user) {
    router.push('/');
  }
}, [user, loading, router]);
```

### Chat Flow

1. The home page displays a list of the user's chats
2. When a user selects a chat, they navigate to the chat page
3. The `ChatWindow` component loads the chat history and subscribes to updates
4. The user can send messages using the message input
5. New messages are displayed in real-time using Supabase subscriptions

```tsx
// Example of real-time subscription
useEffect(() => {
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

  return () => {
    supabase.removeChannel(messagesSubscription);
  };
}, [chatId]);
```

## Component Props

### AuthProvider

```tsx
interface AuthProviderProps {
  children: ReactNode;
}
```

### SignInForm

No props required.

### SignUpForm

No props required.

### ChatWindow

```tsx
interface ChatWindowProps {
  chatId: string;
}
```

### MessageBubble

```tsx
interface MessageBubbleProps {
  message: Message;
}
```

### SystemPromptEditor

```tsx
interface SystemPromptEditorProps {
  initialPrompt: string;
  onSave: (prompt: string) => Promise<void>;
}
```

## State Management

GhostChat uses React's built-in state management with hooks:

1. **Local Component State**: For UI state specific to a component
2. **Context API**: For shared state like authentication
3. **URL Parameters**: For routing state like the current chat ID
4. **Database**: For persistent state like messages and chats

Example of local state:

```tsx
const [messages, setMessages] = useState<Message[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [newMessage, setNewMessage] = useState('');
```

Example of context state:

```tsx
const { user, loading } = useAuth();
```

## Component Lifecycle

GhostChat components follow typical React lifecycle patterns using hooks:

1. **Initialization**: Set up initial state and refs
2. **Data Fetching**: Use `useEffect` to fetch data on mount
3. **Subscriptions**: Set up real-time subscriptions
4. **Cleanup**: Unsubscribe from subscriptions on unmount

Example:

```tsx
useEffect(() => {
  // Fetch data on mount
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch data...
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();

  // Set up subscription
  const subscription = // ...

  // Cleanup on unmount
  return () => {
    subscription.unsubscribe();
  };
}, [dependencies]);
```

## Styling Approach

GhostChat uses Tailwind CSS for styling:

1. **Utility Classes**: Most styling is done with Tailwind utility classes
2. **Responsive Design**: Components use responsive classes for different screen sizes
3. **Dark Mode**: Support for dark mode can be added with Tailwind's dark mode classes
4. **Custom Styles**: Custom styles can be added in `globals.css` when needed

Example:

```tsx
<div className="flex items-center justify-between p-4 bg-white shadow-sm rounded-lg hover:bg-gray-50 transition-colors">
  <h2 className="text-lg font-medium text-gray-900">{title}</h2>
  <span className="text-sm text-gray-500">{formatDate(date)}</span>
</div>
```

## Best Practices

### Component Organization

1. **Single Responsibility**: Each component should have a single responsibility
2. **Composition**: Use composition over inheritance
3. **Reusability**: Create reusable components for common UI elements
4. **Separation of Concerns**: Separate UI, state, and business logic

### Performance Optimization

1. **Memoization**: Use `React.memo`, `useMemo`, and `useCallback` for expensive operations
2. **Virtualization**: Implement virtualized lists for large datasets
3. **Code Splitting**: Use dynamic imports for code splitting
4. **Lazy Loading**: Implement lazy loading for components not needed on initial render

### Accessibility

1. **Semantic HTML**: Use appropriate HTML elements
2. **ARIA Attributes**: Add ARIA attributes where necessary
3. **Keyboard Navigation**: Ensure components are keyboard accessible
4. **Focus Management**: Properly manage focus for interactive elements

## Extending the Component Structure

To add new components:

1. Create a new file in the `src/components` directory
2. Export the component as the default export
3. Import and use the component where needed

Example of a new component:

```tsx
// src/components/ChatSettings.tsx
'use client';

import { useState } from 'react';
import { Chat } from '@/lib/supabaseClient';

interface ChatSettingsProps {
  chat: Chat;
  onUpdate: (updates: Partial<Chat>) => Promise<void>;
}

export default function ChatSettings({ chat, onUpdate }: ChatSettingsProps) {
  const [title, setTitle] = useState(chat.title);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    await onUpdate({ title });
    setIsEditing(false);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      {isEditing ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <h3 className="font-medium">{chat.title}</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
```
