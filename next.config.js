/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
    domains: ['localhost'],
    unoptimized: true, // Disable the built-in image optimizer to use our API route
  },
  // Add env variables to be accessible in client-side code
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  // Disable ESLint during builds
  eslint: {
    // Ignore ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript checking during builds
  typescript: {
    // Ignore TypeScript errors during production builds
    ignoreBuildErrors: true,
  },
  // Configure experimental features
  experimental: {
    // Set the maximum request body size for API routes (10MB)
    largePageDataBytes: 10 * 1024 * 1024, // 10MB
  },
  // Add the updated key here
  serverExternalPackages: [],
};

module.exports = nextConfig; 