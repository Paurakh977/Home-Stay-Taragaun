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
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://devhomestay.sthaniyataha.com',
    NEXT_PUBLIC_SOCKET_PATH: '/api/socket',
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
  
  // Add necessary headers for Google Translate to work properly
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' * data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; style-src 'self' 'unsafe-inline' *; img-src 'self' data: blob: *; connect-src 'self' *; frame-src 'self' *; font-src 'self' data: *;"
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ];
  },

  // Ensure the browser doesn't cache translation cookies incorrectly
  async rewrites() {
    return [
      // Special handling for Google Translate resources
      {
        source: '/translate_a/:path*',
        destination: 'https://translate.googleapis.com/translate_a/:path*'
      },
      {
        source: '/translate_static/:path*',
        destination: 'https://translate.googleapis.com/translate_static/:path*'
      },
      {
        source: '/translate-pa/:path*',
        destination: 'https://translate-pa.googleapis.com/:path*'
      },
      {
        source: '/gen204',
        destination: 'https://translate.google.com/gen204'
      },
      {
        source: '/element/log',
        destination: 'https://translate.googleapis.com/element/log'
      }
    ];
  }
};

module.exports = nextConfig;