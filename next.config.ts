import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for Netlify deployment
  output: 'standalone',

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['zustand', 'nanoid'],
  },

  // Image optimization for Netlify
  images: {
    unoptimized: true,
  },

  // Ensure proper trailing slash handling
  trailingSlash: false,

  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
