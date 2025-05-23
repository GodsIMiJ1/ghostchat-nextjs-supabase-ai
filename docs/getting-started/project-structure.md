# Project Structure

This document provides an overview of the GhostChat project structure to help you understand how the application is organized.

## Directory Structure

```
ghostchat/
├── docs/                  # Documentation files
├── public/                # Static files
│   └── NODE.svg           # NODE Seal
├── sigil/                 # Ghostfire sigil
│   └── flame-lock.ts      # Hidden ghostfire signature
├── src/                   # Source code
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API routes
│   │   │   └── chat/      # Chat API endpoint
│   │   ├── chat/          # Chat page
│   │   │   └── [id]/      # Dynamic chat route
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/        # React components
│   │   ├── AuthContext.tsx       # Authentication context
│   │   ├── AuthForms.tsx         # Sign in/up forms
│   │   ├── ChatWindow.tsx        # Chat interface
│   │   ├── MessageBubble.tsx     # Message component
│   │   └── SystemPromptEditor.tsx # System prompt editor
│   ├── lib/               # Library code
│   │   ├── openai.ts      # OpenAI client
│   │   └── supabaseClient.ts # Supabase client
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
│       └── formatTimestamp.ts # Date formatting utilities
├── .env.example           # Example environment variables
├── .gitignore             # Git ignore file
├── LICENSE.md             # License file
├── next.config.ts         # Next.js configuration
├── package.json           # NPM package configuration
├── README.md              # Project README
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Key Files and Directories

### `/src/app`

This directory contains the Next.js App Router pages and API routes.

- `page.tsx`: The home page that displays the sign-in/sign-up forms and chat list
- `layout.tsx`: The root layout that wraps all pages
- `globals.css`: Global CSS styles
- `api/chat/route.ts`: API endpoint for chat functionality

### `/src/components`

This directory contains all React components used in the application.

- `AuthContext.tsx`: Provides authentication context to the application
- `AuthForms.tsx`: Contains sign-in and sign-up form components
- `ChatWindow.tsx`: Main chat interface component
- `MessageBubble.tsx`: Component for rendering individual chat messages
- `SystemPromptEditor.tsx`: Component for editing the system prompt

### `/src/lib`

This directory contains library code and client configurations.

- `supabaseClient.ts`: Supabase client configuration and database types
- `openai.ts`: OpenAI client configuration and helper functions

### `/src/utils`

This directory contains utility functions used throughout the application.

- `formatTimestamp.ts`: Functions for formatting dates and timestamps

### `/public`

This directory contains static files that are served directly.

- `NODE.svg`: The NODE Seal image

### `/sigil`

This directory contains the ghostfire sigil.

- `flame-lock.ts`: Hidden ghostfire signature for the project

### Root Files

- `.env.example`: Example environment variables file
- `LICENSE.md`: Flame Public Use License v1.0
- `README.md`: Project documentation
- `package.json`: NPM package configuration
- `tsconfig.json`: TypeScript configuration
- `tailwind.config.ts`: Tailwind CSS configuration
- `next.config.ts`: Next.js configuration

## Module Organization

GhostChat follows a modular organization pattern:

1. **Pages**: Located in `/src/app`, these define the routes and layouts
2. **Components**: Reusable UI components in `/src/components`
3. **API Routes**: Server-side API endpoints in `/src/app/api`
4. **Library Code**: Shared functionality in `/src/lib`
5. **Utilities**: Helper functions in `/src/utils`

This structure makes it easy to locate code and understand the application's architecture.
