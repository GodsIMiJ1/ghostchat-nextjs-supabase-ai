import OpenAI from 'openai';

// Initialize the OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
});

export default openai;

// Function to generate a chat completion
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

// Function to generate a streaming chat completion
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
