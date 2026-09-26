import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict Mode runs effects twice in development, so the products page would
  // fetch inventory twice and consume both steps of the sellsOutDuringCheckout
  // response sequence before checkout. Production runs effects once.
  reactStrictMode: false,
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
