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
  // Skip generating static 404/500 pages during build
  // They'll be handled dynamically at runtime
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ],
      },
    ]
  },
};

