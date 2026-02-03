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

  // Handle @react-pdf/renderer for SSR (client-only component)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-pdf/renderer': false,
      };
    }
    return config;
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
