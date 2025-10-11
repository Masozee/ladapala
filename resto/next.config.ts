import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Set the workspace root to the resto directory to fix lockfile warning
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
