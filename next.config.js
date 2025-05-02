/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Ensure images work
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
    domains: ['localhost', 'devhomestay.sthaniyataha.com'],
    unoptimized: true, // Disable the built-in image optimizer to use our API route
  },
  //  env variables to be accessible in client-side code
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://devhomestay.sthaniyataha.com',
  },
  // Disable ESLint during builds
  eslint: {
    // Ignore ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript checking 
  typescript: {
    // Ignore TypeScript errors during  builds
    ignoreBuildErrors: true,
  },
  //  experimental features
  experimental: {
    // Set the maximum request body size for API routes (10MB)
    largePageDataBytes: 10 * 1024 * 1024, 
  },
  // External packages
  serverExternalPackages: [],
  
  // CRITICAL FIX FOR CSS LOADING
  basePath: '',
  
  // Use standalone for API support
  output: 'standalone',
  
  // Disable using trailing slash
  trailingSlash: false,
};

module.exports = nextConfig; 