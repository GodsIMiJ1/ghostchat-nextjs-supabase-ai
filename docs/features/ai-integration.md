# AI Integration

GhostChat integrates with OpenAI's API to provide AI-powered chat functionality. This document explains how the AI integration works and how to customize it.

## OpenAI Integration Overview

GhostChat uses OpenAI's Chat Completions API to generate AI responses. The integration is implemented in:

- `src/lib/openai.ts`: Client configuration and helper functions
- `src/app/api/chat/route.ts`: API route that handles chat requests

## How It Works

### 1. OpenAI Client Setup

The OpenAI client is initialized in `src/lib/openai.ts`:

```typescript
import OpenAI from 'openai';

// Initialize the OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
});

export default openai;
```

### 2. Chat Completion Functions

Two main functions are provided for generating chat completions:

#### Standard Chat Completion

```typescript
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

#### Streaming Chat Completion

```typescript
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

### 3. API Route Implementation

The API route in `src/app/api/chat/route.ts` handles chat requests:

1. Receives messages and chat ID from the client
2. Verifies user authentication and chat ownership
3. Calls the OpenAI API to generate a response
4. Saves the AI response to the database
5. Returns a success response to the client

## Customization Options

### Changing the AI Model

You can change the AI model by modifying the default parameter in the `generateChatCompletion` function:

```typescript
export async function generateChatCompletion(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  model: string = 'gpt-4' // Change to a different model
) {
  // ...
}
```

Available models include:
- `gpt-3.5-turbo`: Faster and more cost-effective
- `gpt-4`: More capable but slower and more expensive
- `gpt-4-turbo`: Enhanced version of GPT-4

### Adjusting Generation Parameters

You can customize the AI's behavior by adjusting the parameters in the `openai.chat.completions.create` call:

```typescript
const completion = await openai.chat.completions.create({
  model,
  messages,
  temperature: 0.5, // Lower for more deterministic responses
  max_tokens: 2000, // Increase for longer responses
  top_p: 0.9, // Nucleus sampling parameter
  frequency_penalty: 0.5, // Reduce repetition
  presence_penalty: 0.5, // Encourage new topics
});
```

### System Prompts

System prompts are a powerful way to customize the AI's behavior. In GhostChat, system prompts are:

1. Stored in the database for each chat
2. Editable through the SystemPromptEditor component
3. Included in the messages array sent to OpenAI

Example system prompts:

```
You are a helpful assistant that provides concise, accurate information.
```

```
You are a creative writing assistant. Help the user brainstorm ideas and provide feedback on their writing.
```

```
You are a programming tutor specializing in JavaScript. Explain concepts clearly and provide code examples.
```

### Implementing Streaming Responses

To implement streaming responses:

1. Update the API route to use `generateStreamingChatCompletion`
2. Modify the route to return a streaming response:

```typescript
export async function POST(request: NextRequest) {
  try {
    const { messages, chatId } = await request.json();
    
    // Authentication checks...
    
    // Generate streaming response
    const stream = await generateStreamingChatCompletion(messages);
    
    // Return the stream
    return new Response(stream);
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

3. Update the client to handle the streaming response:

```typescript
const handleSendMessage = async () => {
  // ...
  
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      chatId,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get AI response');
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let aiResponse = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    aiResponse += chunk;
    
    // Update UI with partial response
    setPartialResponse(aiResponse);
  }
  
  // Save complete response to database
  // ...
};
```

## Error Handling

GhostChat implements error handling for AI requests:

1. **Rate Limiting**: Handles OpenAI API rate limits
2. **Token Limits**: Manages maximum token limits
3. **API Errors**: Catches and logs API errors
4. **Fallback Responses**: Provides fallback responses when the API fails

Example error handling:

```typescript
try {
  const aiResponse = await generateChatCompletion(messages);
  // Process response...
} catch (error) {
  console.error('Error generating AI response:', error);
  
  // Check for specific error types
  if (error.status === 429) {
    // Rate limit exceeded
    return "I'm receiving too many requests right now. Please try again in a moment.";
  } else if (error.status === 400 && error.message.includes('maximum context length')) {
    // Token limit exceeded
    return "This conversation is too long for me to process. Please start a new chat.";
  } else {
    // Generic error
    return "I apologize, but I was unable to generate a response. Please try again.";
  }
}
```

## Cost Management

To manage OpenAI API costs:

1. **Token Counting**: Implement token counting to estimate costs
2. **Rate Limiting**: Add rate limiting for user requests
3. **Model Selection**: Use cheaper models for less complex tasks
4. **Context Window Management**: Limit the number of messages sent to the API

Example token counting implementation:

```typescript
import { encode } from 'gpt-3-encoder';

function countTokens(text: string): number {
  const tokens = encode(text);
  return tokens.length;
}

function estimateCost(messages: any[], model: string): number {
  const totalTokens = messages.reduce((acc, message) => {
    return acc + countTokens(message.content);
  }, 0);
  
  // Approximate costs (as of 2023)
  const costPer1KTokens = model.includes('gpt-4') ? 0.06 : 0.002;
  
  return (totalTokens / 1000) * costPer1KTokens;
}
```

## Security Considerations

When implementing AI integration:

1. **API Key Security**: Never expose your OpenAI API key in client-side code
2. **Content Filtering**: Implement content filtering to prevent misuse
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **User Authentication**: Ensure only authenticated users can access the AI
5. **Data Privacy**: Be transparent about how user messages are processed

## Advanced Features

### Function Calling

You can implement OpenAI's function calling feature to enable the AI to perform actions:

```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages,
  functions: [
    {
      name: "get_weather",
      description: "Get the current weather in a location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g. San Francisco, CA",
          },
          unit: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
          },
        },
        required: ["location"],
      },
    },
  ],
  function_call: "auto",
});
```

### Fine-tuning

For specialized use cases, you can fine-tune a model:

1. Prepare a dataset of example conversations
2. Use OpenAI's fine-tuning API to create a custom model
3. Update your application to use the fine-tuned model

### Multi-modal Capabilities

To add image understanding capabilities:

```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4-vision-preview",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What's in this image?" },
        {
          type: "image_url",
          image_url: {
            url: "https://example.com/image.jpg",
          },
        },
      ],
    },
  ],
});
```
