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
  // Removed tracing root override to prevent Next.js bugs
  // Image optimization enabled
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
  },
  // Skip trailing slash redirect
  skipTrailingSlashRedirect: true,
  // Performance optimizations removed
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
  // Removed rewrites and headers as they are unsupported with output: export
};

module.exports = withBundleAnalyzer(nextConfig);

