import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  eslint: {
    // Allow builds to continue with ESLint warnings (not errors)
    ignoreDuringBuilds: true,
  },
  // Set the workspace root to the hotel directory to fix lockfile warning
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
