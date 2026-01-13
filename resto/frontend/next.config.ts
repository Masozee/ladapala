import type { NextConfig } from "next";
import path from "path";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  // Configure base path for nginx reverse proxy
  basePath: basePath,
  assetPrefix: basePath,

  // Set the workspace root to the resto directory to fix lockfile warning
  outputFileTracingRoot: path.join(__dirname),

  // Allow images from backend API
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.0.105',
        port: '8000',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
