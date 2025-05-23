# OpenAI Integration API

GhostChat integrates with OpenAI's API to provide AI-powered chat functionality. This document explains the OpenAI integration API and how to use it.

## Client Configuration

The OpenAI client is configured in `src/lib/openai.ts`:

```typescript
import OpenAI from 'openai';

// Initialize the OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
});

export default openai;
```

## API Functions

### Generate Chat Completion

The `generateChatCompletion` function is used to generate a response from the OpenAI API:

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

### Generate Streaming Chat Completion

The `generateStreamingChatCompletion` function is used to generate a streaming response:

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

## Usage Examples

### Basic Usage

```typescript
import { generateChatCompletion } from '@/lib/openai';

async function getAIResponse(userMessage: string, systemPrompt: string) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];
  
  try {
    const response = await generateChatCompletion(messages);
    return response;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return 'Sorry, I was unable to generate a response.';
  }
}
```

### Conversation History

```typescript
import { generateChatCompletion } from '@/lib/openai';

async function getChatResponse(conversationHistory: Message[], systemPrompt: string) {
  // Format the conversation history for OpenAI
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))
  ];
  
  try {
    const response = await generateChatCompletion(messages);
    return response;
  } catch (error) {
    console.error('Error getting chat response:', error);
    return 'Sorry, I was unable to generate a response.';
  }
}
```

### Streaming Response

```typescript
import { generateStreamingChatCompletion } from '@/lib/openai';

async function handleStreamingResponse(messages: any[], onChunk: (chunk: string) => void) {
  try {
    const stream = await generateStreamingChatCompletion(messages);
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        onChunk(content);
      }
    }
  } catch (error) {
    console.error('Error with streaming response:', error);
    onChunk('Sorry, there was an error generating the response.');
  }
}

// Example usage in a React component
function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  
  const handleSendMessage = async (userMessage) => {
    // Add user message to state
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    
    // Start with empty response
    setCurrentResponse('');
    
    // Stream the response
    await handleStreamingResponse(
      newMessages.map(m => ({ role: m.role, content: m.content })),
      (chunk) => {
        setCurrentResponse(prev => prev + chunk);
      }
    );
    
    // Add the complete response to messages
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: currentResponse }
    ]);
  };
  
  // Component JSX...
}
```

## API Parameters

### Common Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `model` | string | The model to use (e.g., 'gpt-3.5-turbo', 'gpt-4') |
| `messages` | array | Array of message objects with 'role' and 'content' |
| `temperature` | number | Controls randomness (0-2, default: 0.7) |
| `max_tokens` | number | Maximum tokens in the response (default: 1000) |

### Additional Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `top_p` | number | Nucleus sampling parameter (0-1, default: 1) |
| `frequency_penalty` | number | Penalizes repeated tokens (-2 to 2, default: 0) |
| `presence_penalty` | number | Penalizes repeated topics (-2 to 2, default: 0) |
| `stop` | string[] | Sequences where the API will stop generating |
| `stream` | boolean | Whether to stream the response (default: false) |

## Message Format

Messages must be formatted as an array of objects with the following structure:

```typescript
type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};
```

- `system`: Instructions for the AI
- `user`: Messages from the user
- `assistant`: Previous responses from the AI

## Error Handling

The OpenAI API can return various errors. Here's how to handle them:

```typescript
try {
  const response = await generateChatCompletion(messages);
  // Process response...
} catch (error) {
  console.error('OpenAI API error:', error);
  
  // Check for specific error types
  if (error.status === 429) {
    // Rate limit exceeded
    return "I'm receiving too many requests right now. Please try again in a moment.";
  } else if (error.status === 400 && error.message.includes('maximum context length')) {
    // Token limit exceeded
    return "This conversation is too long for me to process. Please start a new chat.";
  } else if (error.status === 401) {
    // Authentication error
    console.error('Invalid API key');
    return "There's an issue with the AI service configuration. Please contact support.";
  } else {
    // Generic error
    return "I apologize, but I was unable to generate a response. Please try again.";
  }
}
```

## Advanced Features

### Function Calling

OpenAI models can call functions that you define:

```typescript
const functionDefinitions = [
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
];

async function generateFunctionCallingResponse(messages) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      functions: functionDefinitions,
      function_call: "auto",
    });
    
    const responseMessage = response.choices[0].message;
    
    // Check if the model wants to call a function
    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);
      
      // Call the appropriate function
      let functionResponse;
      if (functionName === "get_weather") {
        functionResponse = await getWeather(functionArgs.location, functionArgs.unit);
      }
      
      // Add the function response to the messages
      messages.push({
        role: "function",
        name: functionName,
        content: JSON.stringify(functionResponse),
      });
      
      // Get a new response from the model
      const newResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages,
      });
      
      return newResponse.choices[0].message.content;
    }
    
    return responseMessage.content;
  } catch (error) {
    console.error('Error with function calling:', error);
    throw error;
  }
}
```

### Vision Capabilities

For models that support image understanding:

```typescript
async function generateImageResponse(userPrompt, imageUrl) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating image response:', error);
    throw error;
  }
}
```

## Cost Management

### Token Counting

To estimate costs, you can count tokens:

```typescript
import { encode } from 'gpt-3-encoder';

function countTokens(text) {
  return encode(text).length;
}

function estimateCost(messages, model = 'gpt-3.5-turbo') {
  let totalTokens = 0;
  
  for (const message of messages) {
    totalTokens += countTokens(message.content);
    // Add 4 tokens for message metadata
    totalTokens += 4;
  }
  
  // Add 2 tokens for conversation metadata
  totalTokens += 2;
  
  // Approximate costs (as of 2023)
  const costPer1KTokens = model.includes('gpt-4') ? 0.06 : 0.002;
  
  return {
    tokens: totalTokens,
    estimatedCost: (totalTokens / 1000) * costPer1KTokens,
  };
}
```

### Rate Limiting

Implement rate limiting to control API usage:

```typescript
const userRateLimits = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = userRateLimits.get(userId) || { count: 0, resetTime: now + 60000 };
  
  if (now > userLimit.resetTime) {
    // Reset the counter if the time window has passed
    userLimit.count = 1;
    userLimit.resetTime = now + 60000;
    userRateLimits.set(userId, userLimit);
    return true;
  }
  
  if (userLimit.count >= 10) {
    // User has exceeded the rate limit
    return false;
  }
  
  // Increment the counter
  userLimit.count += 1;
  userRateLimits.set(userId, userLimit);
  return true;
}
```

## Best Practices

### 1. Use System Messages Effectively

System messages are powerful for setting the tone and behavior of the AI:

```typescript
const systemPrompt = `You are a helpful assistant that provides concise, accurate information. 
Your responses should be friendly, informative, and to the point. 
If you don't know something, admit it rather than making up information.`;
```

### 2. Manage Context Length

Be mindful of the token limits for different models:

```typescript
function truncateConversation(messages, maxTokens = 4000) {
  let totalTokens = 0;
  const truncatedMessages = [];
  
  // Always keep the system message
  if (messages[0].role === 'system') {
    truncatedMessages.push(messages[0]);
    totalTokens += countTokens(messages[0].content) + 4;
  }
  
  // Add messages from newest to oldest until we approach the limit
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'system') continue; // Skip system message (already added)
    
    const messageTokens = countTokens(messages[i].content) + 4;
    
    if (totalTokens + messageTokens > maxTokens) {
      break;
    }
    
    truncatedMessages.unshift(messages[i]);
    totalTokens += messageTokens;
  }
  
  return truncatedMessages;
}
```

### 3. Implement Retry Logic

Add retry logic for transient errors:

```typescript
async function generateWithRetry(messages, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await generateChatCompletion(messages);
    } catch (error) {
      retries++;
      
      if (error.status === 429 || error.status === 500) {
        // Exponential backoff
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // For other errors, don't retry
        throw error;
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} retries`);
}
```

### 4. Implement Content Filtering

Add content filtering to prevent misuse:

```typescript
function containsSensitiveContent(text) {
  // Implement your content filtering logic
  const sensitivePatterns = [
    /violence/i,
    /hate speech/i,
    // Add more patterns as needed
  ];
  
  return sensitivePatterns.some(pattern => pattern.test(text));
}

async function generateSafeResponse(messages) {
  // Check user input
  if (containsSensitiveContent(messages[messages.length - 1].content)) {
    return "I'm sorry, but I cannot respond to that request as it may contain sensitive content.";
  }
  
  // Generate response
  const response = await generateChatCompletion(messages);
  
  // Check AI output (as a safeguard)
  if (containsSensitiveContent(response)) {
    return "I apologize, but I cannot provide the generated response as it may contain sensitive content.";
  }
  
  return response;
}
```
