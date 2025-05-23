# Authentication

GhostChat uses Supabase Authentication to provide secure user authentication. This document explains how authentication is implemented and how to customize it.

## Authentication Flow

1. **User Registration**: Users can sign up with email and password
2. **Email Verification**: (Optional) Users verify their email address
3. **User Login**: Users sign in with their credentials
4. **Session Management**: Active sessions are maintained using Supabase's session management
5. **Protected Routes**: Certain routes are protected and only accessible to authenticated users

## Implementation Details

### Authentication Context

The authentication system is implemented using a React context provider in `src/components/AuthContext.tsx`. This context provides:

- Current user information
- Loading state
- Sign-in, sign-up, and sign-out functions

```tsx
// Example usage of the AuthContext
import { useAuth } from '@/components/AuthContext';

function MyComponent() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  
  // Use these values and functions in your component
}
```

### Authentication Forms

The sign-in and sign-up forms are implemented in `src/components/AuthForms.tsx`. These components:

- Handle form submission
- Validate user input
- Display error messages
- Manage loading states

### Protected Routes

Routes that require authentication are protected using a client-side check in the page component:

```tsx
// Example of a protected route
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function ProtectedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <LoadingSpinner />;
  }

  return <YourProtectedContent />;
}
```

## Supabase Configuration

GhostChat uses Supabase for authentication. The Supabase client is configured in `src/lib/supabaseClient.ts`:

```tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Customizing Authentication

### Adding Social Login Providers

To add social login providers (like Google, GitHub, etc.):

1. Configure the provider in your Supabase dashboard:
   - Go to Authentication → Providers
   - Enable and configure the desired providers

2. Update the sign-in component to include the social login buttons:

```tsx
// Example of adding a Google login button
const handleGoogleSignIn = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  
  if (error) {
    console.error('Error signing in with Google:', error);
  }
};

// In your component JSX
<button onClick={handleGoogleSignIn}>
  Sign in with Google
</button>
```

### Customizing Email Templates

You can customize the email templates used for authentication:

1. Go to your Supabase dashboard
2. Navigate to Authentication → Email Templates
3. Customize the templates for:
   - Confirmation emails
   - Invitation emails
   - Magic link emails
   - Reset password emails

### Adding Multi-Factor Authentication (MFA)

To implement MFA:

1. Enable MFA in your Supabase dashboard:
   - Go to Authentication → Settings
   - Enable Multi-Factor Authentication

2. Update your authentication flow to handle the MFA step:

```tsx
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

## Security Considerations

- **HTTPS**: Always use HTTPS in production to protect authentication data
- **Session Expiry**: Configure appropriate session expiry times in Supabase
- **Password Policies**: Implement strong password requirements
- **Rate Limiting**: Enable rate limiting for authentication endpoints
- **Secure Storage**: Use secure storage for tokens (Supabase handles this automatically)

## Troubleshooting

### Common Issues

1. **"User not found" errors**: Ensure the user exists in your Supabase database

2. **"Invalid login credentials" errors**: Check that the email and password are correct

3. **Session not persisting**: Make sure cookies are enabled in the browser

4. **CORS errors**: Verify that your Supabase project allows requests from your application domain

For more help, refer to the [Supabase Authentication documentation](https://supabase.io/docs/guides/auth).
