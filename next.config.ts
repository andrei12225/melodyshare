import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,
  agentRules: false,
  // Migrations are read from disk at runtime by the instrumentation hook,
  // so they must be shipped with every serverless function (e.g. on Vercel)
  outputFileTracingIncludes: {
    "/**": ["./drizzle/**/*"],
  },
};

export default nextConfig;
