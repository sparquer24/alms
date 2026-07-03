/** @type {import('next').NextConfig} */
const { config } = require('dotenv');
const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Load root .env first
config({ path: path.resolve(__dirname, '../.env') });

const nextConfig = {
  reactStrictMode: true,
  // CRITICAL: Tell Next.js that THIS directory is the workspace root.
  // Without this, Next.js detects C:\Users\preml\package-lock.json and
  // incorrectly uses it as the monorepo root, confusing App Router
  // with Pages Router and causing "Cannot find module for page: /_document".
  outputFileTracingRoot: path.resolve(__dirname),
  // Image optimization
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
  },
  // Skip trailing slash redirect
  skipTrailingSlashRedirect: true,
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // TypeScript configuration for production builds
  typescript: {
    ignoreBuildErrors: false,
  },
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Custom webpack config
  webpack: (config) => {
    return config;
  },
  // Security headers (supported in non-export mode)
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
      ],
    }];
  },
  // API proxy rewrites to backend
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: '/api/:path*',
          destination: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/:path*`,
        },
      ],
    };
  },
};

module.exports = withBundleAnalyzer(nextConfig);
