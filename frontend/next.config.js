/** @type {import('next').NextConfig} */
const { config } = require('dotenv');
const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Load root .env first
config({ path: path.resolve(__dirname, '../.env') });

const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  // Tell Next.js the tracing root is this frontend directory, not the monorepo root.
  // This prevents it from misreading the root package-lock.json and confusing App Router with Pages Router.
  outputFileTracingRoot: path.resolve(__dirname),
  // Image optimization enabled
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
  },
  // Skip trailing slash redirect
  skipTrailingSlashRedirect: true,
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks', 'lucide-react', '@heroicons/react'],
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // TypeScript configuration for production builds
  typescript: {
    // We fixed all type errors! Do not ignore them anymore!
    ignoreBuildErrors: false,
  },
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Custom webpack config for bundle optimization
  // NOTE: Do NOT override splitChunks here — Next.js manages chunk splitting internally.
  // Overriding it breaks webpack-runtime chunk references (e.g., "Cannot find module './XXXX.js'").
  webpack: (config, { isServer, dev }) => {
    return config;
  },
  // Disable static generation for specific pages
  async generateBuildId() {
    return 'build-' + Date.now();
  },
  // Proxy /api/* requests to the backend server
  // Set BACKEND_URL env var at runtime (e.g., http://host.docker.internal:3001)
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
  // Add security headers
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
  }
};

module.exports = withBundleAnalyzer(nextConfig);

