import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // MSW and interceptors need to be external to avoid bundling issues
  // This prevents Next.js from bundling these packages, using native Node.js resolution instead
  serverExternalPackages: [
    "msw",
    "@mswjs/interceptors",
    "@scenarist/nextjs-adapter",
    "@scenarist/core",
  ],
};

export default nextConfig;
