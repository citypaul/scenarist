import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep every compiled route in memory during a dev session. With the
  // defaults (5 pages, 60s) routes are evicted and recompiled mid-way through
  // a parallel Playwright run, racing requests that read the rewritten
  // manifests and pushing webpack HMR updates into open pages.
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 1000,
  },
  // Point to workspace root to resolve lockfile warning
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
