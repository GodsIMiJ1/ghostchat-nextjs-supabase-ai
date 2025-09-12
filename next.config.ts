import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let Netlify handle everything automatically
  // Just keep essential optimizations

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['zustand', 'nanoid'],
  },

  // Image optimization for Netlify
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
