import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,
  agentRules: false,
};

export default nextConfig;
