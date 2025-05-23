# Theme Customization

This guide explains how to customize the visual appearance of GhostChat by creating and applying custom themes.

## Table of Contents

- [Understanding the Default Theme](#understanding-the-default-theme)
- [Tailwind CSS Configuration](#tailwind-css-configuration)
- [Creating a Custom Theme](#creating-a-custom-theme)
- [Dark Mode Support](#dark-mode-support)
- [Theme Switching](#theme-switching)
- [Advanced Theming](#advanced-theming)
- [Example Themes](#example-themes)

## Understanding the Default Theme

GhostChat uses Tailwind CSS for styling, with a default theme defined in `tailwind.config.ts`. The default theme includes:

- Color palette (primary, secondary, accent colors)
- Typography (font families, sizes, weights)
- Spacing and layout values
- Border radiuses and shadows
- Transition effects

The default theme is designed to be clean, modern, and accessible.

## Tailwind CSS Configuration

The Tailwind configuration file is located at `tailwind.config.ts`. This is the primary file you'll modify to change the theme.

Here's the default configuration:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Default color palette
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      // Other theme extensions
    },
  },
  plugins: [],
};

export default config;
```

## Creating a Custom Theme

### Step 1: Modify the Color Palette

To create a custom theme, start by modifying the color palette in `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#90cafc',
          400: '#5eacf9',
          500: '#3b8ef5',
          600: '#2570ea',
          700: '#1c59d6',
          800: '#1c49ae',
          900: '#1c3f8a',
          950: '#162754',
        },
        secondary: {
          50: '#f5f7fa',
          100: '#ebeef3',
          200: '#d2dae5',
          300: '#acbcce',
          400: '#8098b2',
          500: '#607d98',
          600: '#4c657e',
          700: '#3e5267',
          800: '#364656',
          900: '#313c49',
          950: '#1f2630',
        },
        accent: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
      },
      // Other theme extensions
    },
  },
  plugins: [],
};

export default config;
```

### Step 2: Customize Typography

Next, customize the typography by changing the font families:

```typescript
fontFamily: {
  sans: ['"Poppins"', 'sans-serif'],
  mono: ['"Fira Code"', 'monospace'],
  heading: ['"Montserrat"', 'sans-serif'],
},
```

To use custom fonts, you'll need to:

1. Add the fonts to your project (either locally or via a CDN like Google Fonts)
2. Import them in your layout file (`src/app/layout.tsx`)

Example with Google Fonts:

```tsx
// src/app/layout.tsx
import { Poppins, Montserrat, Fira_Code } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-montserrat',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${montserrat.variable} ${firaCode.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

### Step 3: Customize Other Theme Elements

You can customize other theme elements like spacing, border radius, and shadows:

```typescript
borderRadius: {
  'sm': '0.125rem',
  DEFAULT: '0.25rem',
  'md': '0.375rem',
  'lg': '0.5rem',
  'xl': '0.75rem',
  '2xl': '1rem',
  'full': '9999px',
},
boxShadow: {
  'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  'none': 'none',
},
```

## Dark Mode Support

### Step 1: Enable Dark Mode in Tailwind

Enable dark mode in your `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // or 'media' for system preference
  content: [
    // ...
  ],
  theme: {
    // ...
  },
  plugins: [],
};

export default config;
```

### Step 2: Create a Dark Mode Toggle Component

Create a component to toggle dark mode:

```tsx
// src/components/DarkModeToggle.tsx
'use client';

import { useState, useEffect } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved preference or system preference
    const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  );
}
```

### Step 3: Add Dark Mode Variants to Components

Update your components to use dark mode variants:

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
    GhostChat
  </h1>
  <p className="text-gray-600 dark:text-gray-300">
    A production-ready AI chat template
  </p>
</div>
```

## Theme Switching

For more advanced theming, you can implement a theme switching mechanism:

### Step 1: Create a Theme Context

```tsx
// src/components/ThemeContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system' | 'purple' | 'green' | 'blue';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-purple', 'theme-green', 'theme-blue');
    
    // Apply dark mode
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
      root.classList.add(`theme-${theme}`);
    }
    
    // Save theme
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

### Step 2: Create a Theme Switcher Component

```tsx
// src/components/ThemeSwitcher.tsx
'use client';

import { useTheme } from './ThemeContext';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as any)}
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-sm"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="purple">Purple</option>
        <option value="green">Green</option>
        <option value="blue">Blue</option>
      </select>
    </div>
  );
}
```

### Step 3: Add Theme-Specific CSS Variables

Create a CSS file for theme variables:

```css
/* src/app/themes.css */
:root {
  /* Default (light) theme */
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-accent: #ec4899;
  --color-background: #ffffff;
  --color-foreground: #1f2937;
}

.dark {
  /* Dark theme */
  --color-primary: #60a5fa;
  --color-secondary: #94a3b8;
  --color-accent: #f472b6;
  --color-background: #111827;
  --color-foreground: #f9fafb;
}

.theme-purple {
  --color-primary: #8b5cf6;
  --color-secondary: #a78bfa;
  --color-accent: #ec4899;
}

.theme-green {
  --color-primary: #10b981;
  --color-secondary: #6ee7b7;
  --color-accent: #f59e0b;
}

.theme-blue {
  --color-primary: #3b82f6;
  --color-secondary: #93c5fd;
  --color-accent: #f43f5e;
}
```

Import this file in your `globals.css`:

```css
@import './themes.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Use CSS variables in your custom classes */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.card {
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

## Advanced Theming

### Custom Components with Theme Support

Create reusable components that support theming:

```tsx
// src/components/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
}: ButtonProps) {
  const baseClasses = 'rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white focus:ring-secondary-500',
    accent: 'bg-accent-600 hover:bg-accent-700 text-white focus:ring-accent-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
}
```

## Example Themes

### Cyberpunk Theme

```typescript
// tailwind.config.ts (Cyberpunk theme)
colors: {
  primary: {
    50: '#f0fcff',
    100: '#e0faff',
    200: '#baf5ff',
    300: '#7df0ff',
    400: '#33e0ff',
    500: '#0cd6ff',
    600: '#00b6df',
    700: '#0092b4',
    800: '#007693',
    900: '#006278',
    950: '#00384a',
  },
  secondary: {
    50: '#fdf2ff',
    100: '#fae5ff',
    200: '#f5cbff',
    300: '#f0a1ff',
    400: '#e866ff',
    500: '#d633ff',
    600: '#b91fff',
    700: '#a100e9',
    800: '#8400bd',
    900: '#6c0099',
    950: '#4a006a',
  },
  accent: {
    50: '#fbff33',
    100: '#f5ff00',
    200: '#e1eb00',
    300: '#c2ca00',
    400: '#a3aa00',
    500: '#848a00',
    600: '#656a00',
    700: '#464a00',
    800: '#272a00',
    900: '#080a00',
    950: '#000000',
  },
},
```

### Nature Theme

```typescript
// tailwind.config.ts (Nature theme)
colors: {
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  secondary: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006',
  },
  accent: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
  },
},
```

### Corporate Theme

```typescript
// tailwind.config.ts (Corporate theme)
colors: {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  accent: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
},
```
