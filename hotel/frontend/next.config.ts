import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel-optimized settings
  reactStrictMode: true,
  poweredByHeader: false,

  // Image optimization for Vercel
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.smkpariwisatamengwitani.com',
      },
    ],
  },

  // Exclude @react-pdf/renderer from server bundling (client-only)
  serverExternalPackages: ['@react-pdf/renderer'],

  // Turbopack configuration
  turbopack: {
    resolveAlias: {
      // Stub out @react-pdf/renderer on server to prevent SSR issues
      '@react-pdf/renderer': '@react-pdf/renderer',
    },
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'same-origin'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
