# Chat Interface

GhostChat provides a clean, intuitive chat interface for interacting with AI. This document explains the chat interface components, functionality, and customization options.

## Chat Interface Components

The chat interface consists of several key components:

### 1. ChatWindow Component

The main component that orchestrates the chat experience is `ChatWindow.tsx`. This component:

- Fetches and displays chat messages
- Handles message sending
- Manages loading states
- Subscribes to real-time updates

### 2. MessageBubble Component

The `MessageBubble.tsx` component renders individual chat messages with:

- Different styling for user and AI messages
- Timestamp display
- Support for markdown formatting (can be extended)

### 3. SystemPromptEditor Component

The `SystemPromptEditor.tsx` component allows users to:

- View the current system prompt
- Edit the system prompt to customize AI behavior
- Save changes to the system prompt

## Chat Functionality

### Message Flow

1. **User Input**: User types a message and clicks send
2. **Client-Side Processing**: The message is added to the UI and sent to the server
3. **Server-Side Processing**: The message is processed by the API route
4. **AI Response**: The OpenAI API generates a response
5. **Database Storage**: Both the user message and AI response are stored in the database
6. **Real-Time Update**: The UI updates with the new messages via Supabase real-time subscriptions

### Real-Time Updates

GhostChat uses Supabase's real-time functionality to update the chat interface when new messages are added:

```tsx
// Example of real-time subscription in ChatWindow.tsx
useEffect(() => {
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

  return () => {
    supabase.removeChannel(messagesSubscription);
  };
}, [chatId]);
```

### System Prompts

System prompts allow users to customize the AI's behavior. The system prompt is:

- Stored in the `chats` table in the `system_prompt` field
- Editable through the SystemPromptEditor component
- Sent with each API request to OpenAI

## UI/UX Design

### Message Styling

Messages are styled differently based on the sender:

- **User Messages**: Right-aligned with a blue background
- **AI Messages**: Left-aligned with a gray background
- **Timestamps**: Displayed below each message in a smaller font

### Responsive Design

The chat interface is fully responsive and works well on:

- Desktop browsers
- Tablets
- Mobile devices

The layout adjusts automatically based on screen size using Tailwind CSS responsive classes.

### Loading States

The interface provides visual feedback during loading:

- Spinner animation when fetching chat history
- Disabled input during message processing
- Loading indicator when sending messages

## Customization Options

### Styling

You can customize the appearance of the chat interface by:

1. Modifying the Tailwind classes in the component files
2. Updating the color scheme in `tailwind.config.ts`
3. Adding custom CSS in `globals.css`

### Message Rendering

To customize how messages are rendered:

1. Modify the `MessageBubble.tsx` component
2. Add support for additional content types (images, code blocks, etc.)
3. Implement markdown or rich text formatting

### Chat Features

You can extend the chat functionality by:

1. Adding typing indicators
2. Implementing read receipts
3. Adding file upload capabilities
4. Enabling message reactions

## Accessibility

The chat interface follows accessibility best practices:

- Proper semantic HTML elements
- ARIA attributes where necessary
- Keyboard navigation support
- Sufficient color contrast
- Screen reader compatibility

## Performance Considerations

For optimal performance:

- Messages are loaded in batches
- Real-time updates use efficient change subscriptions
- The message list uses a virtual scroll for large conversations
- Images and media are lazy-loaded

## Example: Adding Typing Indicators

Here's an example of how to add typing indicators to the chat interface:

```tsx
// In ChatWindow.tsx
const [isTyping, setIsTyping] = useState(false);

// Add this before sending a message
const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newMessage.trim() || !user || !chatId || isProcessing) return;

  setIsProcessing(true);
  setIsTyping(true); // Show typing indicator
  
  // ... existing code ...
  
  // In the finally block
  finally {
    setIsProcessing(false);
    setIsTyping(false); // Hide typing indicator
  }
};

// Add this to your JSX
{isTyping && (
  <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg max-w-[80%]">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
)}
```

This will add a simple typing indicator that appears while the AI is generating a response.
