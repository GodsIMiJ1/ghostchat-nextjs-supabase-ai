# Authentication Flow

This document explains the authentication flow in GhostChat, providing a detailed overview of how user authentication is implemented using Supabase Auth.

## Overview

GhostChat uses Supabase Authentication to provide secure user authentication. The authentication flow includes:

1. **User Registration**: Users can sign up with email and password
2. **Email Verification**: (Optional) Users verify their email address
3. **User Login**: Users sign in with their credentials
4. **Session Management**: Active sessions are maintained using Supabase's session management
5. **Protected Routes**: Certain routes are protected and only accessible to authenticated users
6. **Sign Out**: Users can sign out to end their session

## Authentication Flow Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│             │         │             │         │             │
│    User     │ ──────> │  Auth Forms │ ──────> │  AuthContext│
│             │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
                                                       │
                                                       │
                                                       ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│             │         │             │         │             │
│  Protected  │ <────── │  User State │ <────── │  Supabase   │
│   Routes    │         │             │         │    Auth     │
│             │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
```

## Implementation Details

### Authentication Context

The authentication system is implemented using a React context provider in `src/components/AuthContext.tsx`. This context provides:

- Current user information
- Loading state
- Sign-in, sign-up, and sign-out functions

```tsx
// src/components/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, User } from '@/lib/supabaseClient';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session on mount
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking session:', error);
        setLoading(false);
        return;
      }
      
      if (data.session) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          setUser({
            id: userData.user.id,
            email: userData.user.email || '',
            created_at: userData.user.created_at || new Date().toISOString(),
          });
        }
      }
      
      setLoading(false);
    };

    checkSession();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session && event === 'SIGNED_IN') {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at || new Date().toISOString(),
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Authentication functions
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

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Authentication Forms

The sign-in and sign-up forms are implemented in `src/components/AuthForms.tsx`:

```tsx
// Example of SignInForm component
export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await signIn(email, password);
    } catch (err) {
      setError('Failed to sign in. Please check your credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Form JSX...
}
```

### Protected Routes

Routes that require authentication are protected using a client-side check:

```tsx
// Example of a protected route
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function ChatPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <ChatWindow chatId={params.id} />;
}
```

## Authentication Flows

### Sign-Up Flow

1. User navigates to the sign-up form
2. User enters email and password
3. Form validation checks the input
4. On form submission, `signUp` function is called
5. Supabase creates a new user account
6. If email confirmation is enabled, an email is sent to the user
7. User is notified to check their email
8. User clicks the confirmation link in the email
9. User is redirected to the application and signed in

### Sign-In Flow

1. User navigates to the sign-in form
2. User enters email and password
3. Form validation checks the input
4. On form submission, `signIn` function is called
5. Supabase authenticates the user
6. If successful, a session is created
7. The `AuthContext` updates the user state
8. User is redirected to the main application

### Session Management

1. When the application loads, `AuthContext` checks for an existing session
2. If a session exists, the user is automatically signed in
3. The `AuthContext` subscribes to authentication state changes
4. When the session expires or the user signs out, the user state is updated

### Sign-Out Flow

1. User clicks the sign-out button
2. The `signOut` function is called
3. Supabase ends the user's session
4. The `AuthContext` updates the user state to null
5. User is redirected to the sign-in page

## API Authentication

API routes are authenticated using the Supabase token stored in cookies:

```typescript
// Example of API route authentication
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
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

    // Continue with authenticated request...
  } catch (error) {
    // Error handling...
  }
}
```

## Row Level Security (RLS)

Supabase uses Row Level Security (RLS) to control access to data:

```sql
-- Example of RLS policy for chats table
create policy "Users can view their own chats" 
on chats for select 
using (auth.uid() = user_id);
```

This ensures that users can only access their own data, even if they try to manipulate API requests.

## Security Considerations

### Password Security

- Passwords are never stored in plain text
- Supabase handles password hashing and security
- Password requirements can be configured in Supabase

### Session Security

- Sessions are managed by Supabase
- Session tokens are stored in secure cookies
- Sessions have configurable expiration times

### HTTPS

- Always use HTTPS in production
- Secure cookies require HTTPS
- API requests should always use HTTPS

## Advanced Authentication Features

### Social Login

To add social login providers (like Google, GitHub, etc.):

1. Configure the provider in your Supabase dashboard
2. Add the social login button to your sign-in form
3. Call the appropriate Supabase auth method

```typescript
// Example of Google sign-in
const handleGoogleSignIn = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  
  if (error) {
    console.error('Error signing in with Google:', error);
  }
};
```

### Password Reset

To implement password reset:

1. Add a "Forgot Password" link to your sign-in form
2. Create a password reset form
3. Call the Supabase password reset method

```typescript
// Example of password reset
const handleResetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://yourdomain.com/reset-password',
  });
  
  if (error) {
    console.error('Error resetting password:', error);
    return false;
  }
  
  return true;
};
```

### Multi-Factor Authentication (MFA)

To implement MFA:

1. Enable MFA in your Supabase dashboard
2. Update your authentication flow to handle the MFA step

```typescript
// Example MFA implementation (simplified)
const handleSignIn = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Error signing in:', error);
    return;
  }
  
  if (data?.session?.user?.factors) {
    // Handle MFA challenge
    setShowMFAInput(true);
  }
};

const handleMFAVerify = async () => {
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: currentFactorId,
    code: mfaCode,
  });
  
  if (error) {
    console.error('Error verifying MFA:', error);
  }
};
```

## Troubleshooting

### Common Issues

1. **"User not found" errors**: Ensure the user exists in your Supabase database

2. **"Invalid login credentials" errors**: Check that the email and password are correct

3. **Session not persisting**: Make sure cookies are enabled in the browser

4. **CORS errors**: Verify that your Supabase project allows requests from your application domain

### Debugging Authentication

1. Check browser console for errors
2. Verify that environment variables are correctly set
3. Inspect network requests to identify issues
4. Check Supabase logs for authentication errors

## Best Practices

1. **Error Handling**: Provide clear error messages to users
2. **Loading States**: Show loading indicators during authentication operations
3. **Validation**: Validate user input before submitting to Supabase
4. **Security**: Follow security best practices for authentication
5. **Testing**: Test authentication flows thoroughly

## Conclusion

GhostChat implements a secure, user-friendly authentication system using Supabase Auth. By understanding this authentication flow, developers can easily extend and customize the authentication experience to meet their specific requirements.
