/** @type {import('next').NextConfig} */
const { config } = require('dotenv');
const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Load root .env first
config({ path: path.resolve(__dirname, '../.env') });

// ── Build-time guard rails ──────────────────────────────────────────────────
// NEXT_PUBLIC_API_URL must end with "/api" (the backend's global prefix).
// A missing suffix silently breaks every API call (404s), so fail the build loudly.
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (apiUrl && !/\/api$/.test(String(apiUrl).replace(/\/+$/, ''))) {
  throw new Error(
    `[next.config.js] NEXT_PUBLIC_API_URL="${apiUrl}" must end with "/api" ` +
      `(e.g. "http://localhost:3001/api" or "/api"). Fix your .env / build args and rebuild.`
  );
}

// BACKEND_URL is the bare origin (no "/api") - the rewrite appends /api/:path* itself.
// A trailing "/api" would cause a double prefix (e.g. .../api/api/health).
const backendUrl = process.env.BACKEND_URL;
if (backendUrl && /\/api$/.test(String(backendUrl).replace(/\/+$/, ''))) {
  throw new Error(
    `[next.config.js] BACKEND_URL="${backendUrl}" must NOT end with "/api" ` +
      `(use the bare origin, e.g. "http://backend-prod:3001"). The Next.js rewrite appends /api/:path* itself.`
  );
}

const { execSync } = require('child_process');

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Tell Next.js the tracing root is this frontend directory, not the monorepo root.
  // This prevents it from misreading the root package-lock.json and confusing App Router with Pages Router.
  outputFileTracingRoot: path.resolve(__dirname),
  // Image optimization (standalone/server mode supports Next.js image optimization)
  images: {
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
    if (isServer) {
      config.output.chunkFilename = 'chunks/[id].js';
    }
    return config;
  },
  // Stable build ID derived from git commit to avoid cache mismatches on redeploy.
  // Falls back to BUILD_ID env var or a static string when git is unavailable.
  generateBuildId() {
    try {
      return execSync('git rev-parse --short HEAD', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();
    } catch {
      return process.env.BUILD_ID || 'build';
    }
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

