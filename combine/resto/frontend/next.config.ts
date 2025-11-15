import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Set the workspace root to the resto directory to fix lockfile warning
  outputFileTracingRoot: path.join(__dirname),

  // Enable ESLint during production build
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Allow images from backend API
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
