# Frequently Asked Questions (FAQ)

This document addresses common questions and issues you might encounter when working with GhostChat.

## Table of Contents

- [Authentication Issues](#authentication-issues)
- [Supabase Configuration](#supabase-configuration)
- [OpenAI API](#openai-api)
- [Styling and Customization](#styling-and-customization)
- [Performance](#performance)
- [Self-Hosting Supabase](#self-hosting-supabase)
- [Deployment](#deployment)
- [General Questions](#general-questions)

## Authentication Issues

### Q: Users can't sign up or sign in

**A:** This could be due to several reasons:

1. **Supabase Configuration**: Ensure your Supabase URL and anon key are correctly set in your `.env.local` file.

2. **Email Confirmation**: Check if email confirmation is enabled in your Supabase dashboard. If it is, users need to confirm their email before they can sign in.

3. **CORS Issues**: Make sure your application domain is added to the allowed origins in your Supabase dashboard.

4. **Site URL**: Verify that the Site URL in your Supabase Authentication settings matches your application URL.

### Q: "Invalid login credentials" error when credentials are correct

**A:** This could be due to:

1. **Email Confirmation**: The user might not have confirmed their email.

2. **Case Sensitivity**: Email addresses in Supabase are case-sensitive. Ensure the case matches.

3. **Whitespace**: Check for any leading or trailing whitespace in the email input.

### Q: Sessions are not persisting after page refresh

**A:** This could be due to:

1. **Cookies**: Make sure cookies are enabled in the browser.

2. **HTTPS**: In production, cookies require HTTPS. Ensure your application is served over HTTPS.

3. **Supabase Configuration**: Verify that your Supabase client is correctly configured.

```typescript
// Correct Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Supabase Configuration

### Q: How do I set up the required database tables?

**A:** Run the following SQL commands in your Supabase SQL Editor:

```sql
-- Create chats table
create table chats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  system_prompt text,
  created_at timestamp with time zone default now() not null
);

-- Add RLS policies for chats
alter table chats enable row level security;
create policy "Users can create their own chats" on chats for insert with check (auth.uid() = user_id);
create policy "Users can view their own chats" on chats for select using (auth.uid() = user_id);
create policy "Users can update their own chats" on chats for update using (auth.uid() = user_id);
create policy "Users can delete their own chats" on chats for delete using (auth.uid() = user_id);

-- Create messages table
create table messages (
  id uuid default uuid_generate_v4() primary key,
  chat_id uuid references chats(id) on delete cascade not null,
  role text not null,
  content text not null,
  created_at timestamp with time zone default now() not null
);

-- Add RLS policies for messages
alter table messages enable row level security;
create policy "Users can insert messages into their chats" on messages 
  for insert with check (
    auth.uid() = (select user_id from chats where id = chat_id)
  );
create policy "Users can view messages in their chats" on messages 
  for select using (
    auth.uid() = (select user_id from chats where id = chat_id)
  );
```

### Q: What are Row Level Security (RLS) policies and why are they important?

**A:** RLS policies control access to rows in database tables. They are important because they:

1. **Enforce Security**: Ensure users can only access their own data
2. **Prevent Data Leaks**: Block unauthorized access even if API endpoints are compromised
3. **Simplify Backend Code**: Security is enforced at the database level

### Q: How do I enable email authentication in Supabase?

**A:** Follow these steps:

1. Go to your Supabase dashboard
2. Navigate to Authentication → Providers
3. Ensure "Email" is enabled
4. Configure settings like "Confirm email" based on your requirements

## OpenAI API

### Q: I'm getting "API key not valid" errors

**A:** This could be due to:

1. **Invalid Key**: Verify your OpenAI API key is correct and active
2. **Environment Variable**: Ensure `OPENAI_API_KEY` is correctly set in your `.env.local` file
3. **Key Restrictions**: Check if your API key has any restrictions (e.g., IP restrictions)

### Q: How do I handle OpenAI rate limits?

**A:** Implement these strategies:

1. **Retry Logic**: Add exponential backoff retry for rate limit errors

```typescript
async function generateWithRetry(messages, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await generateChatCompletion(messages);
    } catch (error) {
      retries++;
      
      if (error.status === 429) {
        // Exponential backoff
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} retries`);
}
```

2. **Request Batching**: Combine multiple requests when possible
3. **Caching**: Cache responses for common queries
4. **User Quotas**: Implement user-level rate limiting

### Q: How can I reduce OpenAI API costs?

**A:** Consider these approaches:

1. **Use GPT-3.5-Turbo**: It's much cheaper than GPT-4
2. **Optimize Prompts**: More efficient prompts use fewer tokens
3. **Limit Context Size**: Only send necessary conversation history
4. **Implement Caching**: Cache common responses
5. **Set Usage Limits**: Monitor and cap usage per user

## Styling and Customization

### Q: How do I customize the application's appearance?

**A:** You can customize the appearance in several ways:

1. **Tailwind Configuration**: Edit `tailwind.config.ts` to change colors, fonts, etc.

```typescript
// Example tailwind.config.ts customization
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... other shades
          600: '#0284c7',
          700: '#0369a1',
        },
        // Add your custom colors
      },
      fontFamily: {
        sans: ['Your-Font', 'sans-serif'],
      },
    },
  },
};
```

2. **Global CSS**: Add custom styles in `src/app/globals.css`
3. **Component Styling**: Modify the Tailwind classes in component files

### Q: How do I add dark mode support?

**A:** Implement dark mode with Tailwind CSS:

1. Enable dark mode in `tailwind.config.ts`:

```typescript
module.exports = {
  darkMode: 'class', // or 'media' for system preference
  // rest of your config
};
```

2. Add a dark mode toggle component:

```tsx
function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <button onClick={() => setDarkMode(!darkMode)}>
      {darkMode ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}
```

3. Use dark mode variants in your components:

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Dark mode compatible content
</div>
```

## Performance

### Q: The application is slow. How can I improve performance?

**A:** Consider these optimizations:

1. **Code Splitting**: Use dynamic imports for large components
2. **Image Optimization**: Use Next.js Image component
3. **Pagination**: Implement pagination for large datasets
4. **Memoization**: Use `useMemo` and `useCallback` for expensive operations
5. **Server-Side Rendering**: Use SSR for initial page load
6. **API Optimization**: Optimize API calls and implement caching

### Q: How do I implement message pagination for large conversations?

**A:** Implement pagination with Supabase:

```typescript
const fetchMessages = async (chatId, page = 0, pageSize = 50) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .range(from, to);
    
  if (error) throw error;
  return data.reverse(); // Reverse to get chronological order
};
```

## Self-Hosting Supabase

### Q: How do I self-host Supabase?

**A:** Follow these steps to self-host Supabase:

1. **Prerequisites**:
   - Docker and Docker Compose
   - Git
   - 4GB+ RAM, 2+ CPU cores

2. **Clone the Supabase Repository**:
   ```bash
   git clone --depth 1 https://github.com/supabase/supabase
   cd supabase/docker
   ```

3. **Configure Environment**:
   - Copy the example env file: `cp .env.example .env`
   - Edit `.env` to set passwords and configuration

4. **Start Supabase**:
   ```bash
   docker-compose up -d
   ```

5. **Access the Dashboard**:
   - Studio will be available at `http://localhost:3000`
   - API endpoints will be at `http://localhost:8000`

6. **Update Your Application**:
   - Set `NEXT_PUBLIC_SUPABASE_URL` to your self-hosted URL
   - Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your anon key

### Q: What are the hardware requirements for self-hosting Supabase?

**A:** Minimum requirements:
- 2+ CPU cores
- 4GB+ RAM
- 20GB+ storage
- Linux-based OS (Ubuntu 20.04+ recommended)

Recommended for production:
- 4+ CPU cores
- 8GB+ RAM
- 100GB+ SSD storage
- Dedicated server or VM

### Q: How do I back up my self-hosted Supabase database?

**A:** Use PostgreSQL's built-in backup tools:

```bash
# Connect to the Docker container
docker exec -it supabase_db_1 bash

# Create a backup
pg_dump -U postgres -d postgres -f /var/lib/postgresql/data/backup.sql

# Copy the backup to the host
docker cp supabase_db_1:/var/lib/postgresql/data/backup.sql ./backup.sql
```

## Deployment

### Q: My deployment fails with "Build error"

**A:** Common causes include:

1. **Missing Dependencies**: Ensure all dependencies are correctly listed in `package.json`
2. **Environment Variables**: Check that all required environment variables are set
3. **Node.js Version**: Verify you're using a compatible Node.js version
4. **Build Script**: Make sure the build script in `package.json` is correct

### Q: How do I deploy to a subdirectory or subdomain?

**A:** For Next.js applications:

1. **Subdomain**: Simply point the subdomain to your deployment
2. **Subdirectory**: Use the `basePath` option in `next.config.ts`:

```typescript
module.exports = {
  basePath: '/ghostchat',
};
```

## General Questions

### Q: Can I use GhostChat for commercial purposes?

**A:** According to the Flame Public Use License v1.0, you need written permission from GodsIMiJ AI Solutions for commercial use. Contact godsimij902@gmail.com for permission.

### Q: How do I contribute to GhostChat?

**A:** Follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
5. Ensure you follow the contribution guidelines

### Q: Can I use a different AI provider instead of OpenAI?

**A:** Yes, you can integrate other AI providers by:

1. Creating a new client file (e.g., `src/lib/anthropic.ts`)
2. Implementing similar functions to generate responses
3. Updating the API route to use the new provider

See the [Customization Guide](customization/alternative-ai-providers.md) for detailed instructions.
