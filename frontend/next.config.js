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
  // Use standalone output for Docker/production deployment
  output: 'standalone',
  // Set output file tracing root for monorepo
  outputFileTracingRoot: path.resolve(__dirname),
  // Image optimization enabled
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },
  // Skip trailing slash redirect
  skipTrailingSlashRedirect: true,
  // Performance optimizations
  experimental: {
    forceSwcTransforms: true,
    optimizeCss: true,
    optimizePackageImports: ['@mantine/core', '@mantine/hooks', 'lucide-react', '@heroicons/react'],
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Custom webpack config for bundle optimization
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      // Split chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          mantine: {
            test: /[\\/]node_modules[\\/]@mantine[\\/]/,
            name: 'mantine',
            chunks: 'all',
          },
          charts: {
            test: /[\\/]node_modules[\\/](chart\.js|recharts|react-chartjs-2)[\\/]/,
            name: 'charts',
            chunks: 'all',
          },
        },
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

module.exports = withBundleAnalyzer(nextConfig);

