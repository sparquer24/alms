/** @type {import('next').NextConfig} */
const { config } = require('dotenv');
const path = require('path');

// Load root .env first
config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  reactStrictMode: true,
  // Use standalone output for Docker/production deployment
  output: 'standalone',
  // Set output file tracing root for monorepo
  outputFileTracingRoot: path.resolve(__dirname),
  // Disable image optimization for static export
  images: {
    unoptimized: false,
  },
  // Skip trailing slash redirect
  skipTrailingSlashRedirect: true,
  // Disable static optimization to avoid build-time rendering issues
  experimental: {
    forceSwcTransforms: true,
  },
  // Add empty turbopack config to work with Next.js 16 Turbopack default
  turbopack: {},
  // Custom webpack config to skip error page static generation
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Skip static generation of error pages during build
      config.resolve.alias = {
        ...config.resolve.alias,
        // Prevent static generation issues
      };
    }
    return config;
  },
  // Disable static generation for specific pages
  async generateBuildId() {
    return 'build-' + Date.now();
  },
  // Disable prerendering for error pages
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: []
    };
  }
};

