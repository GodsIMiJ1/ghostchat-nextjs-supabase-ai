# Environment Setup

This guide explains how to set up the environment variables and external services required for GhostChat.

## Environment Variables

GhostChat requires several environment variables to function properly. Create a `.env.local` file in the root directory of your project with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

### Variable Descriptions

- `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous key for your Supabase project
- `OPENAI_API_KEY`: Your OpenAI API key for accessing the chat completion API

## Setting Up Supabase

### 1. Create a Supabase Account

If you don't already have one, create an account at [Supabase](https://supabase.io/).

### 2. Create a New Project

1. Log in to your Supabase account
2. Click "New Project"
3. Enter a name for your project
4. Set a secure database password
5. Choose a region close to your users
6. Click "Create new project"

### 3. Get Your Supabase Credentials

1. Once your project is created, go to the project dashboard
2. Click on the "Settings" icon in the sidebar
3. Select "API" from the settings menu
4. You'll find your `Project URL` and `anon public` key here
5. Copy these values to your `.env.local` file

### 4. Set Up Database Tables

1. Go to the "SQL Editor" in your Supabase dashboard
2. Create the necessary tables using the SQL commands provided in the [Installation Guide](installation.md)

### 5. Configure Authentication

1. Go to "Authentication" in the sidebar
2. Under "Settings", ensure Email auth is enabled
3. Configure any additional auth providers you want to use

## Setting Up OpenAI

### 1. Create an OpenAI Account

If you don't already have one, create an account at [OpenAI](https://openai.com/).

### 2. Get Your API Key

1. Log in to your OpenAI account
2. Go to the [API keys page](https://platform.openai.com/account/api-keys)
3. Click "Create new secret key"
4. Give your key a name (e.g., "GhostChat")
5. Copy the key (note: it will only be shown once)
6. Paste the key into your `.env.local` file

### 3. Set Up Billing (Optional for Higher Usage)

1. Go to the [Billing section](https://platform.openai.com/account/billing/overview)
2. Add a payment method
3. Set usage limits if desired

## Development Environment

### Node.js Version

GhostChat requires Node.js version 18.x or higher. You can check your Node.js version with:

```bash
node --version
```

If you need to manage multiple Node.js versions, consider using [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager).

### IDE Setup

For the best development experience, we recommend using Visual Studio Code with the following extensions:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

### Recommended VS Code Settings

Add these settings to your VS Code `settings.json` file:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Verifying Your Setup

To verify that your environment is set up correctly:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. You should see the GhostChat sign-in page

4. Try signing up for a new account to test the Supabase connection

5. After signing in, try creating a new chat to test the OpenAI integration

If you encounter any issues, check the console for error messages and refer to the troubleshooting section in the [Installation Guide](installation.md).
