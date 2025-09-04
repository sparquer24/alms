/** @type {import('next').NextConfig} */
const { config } = require('dotenv');
const path = require('path');

// Load root .env first
config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  reactStrictMode: true,
  experimental: {
    forceSwcTransforms: true // This forces Next.js to use SWC even with custom Babel config
  },
  env: {
    // Expose only the variables you want available on client if needed
    // Example: API_BASE_URL: process.env.API_BASE_URL
  },
};

