/// <reference types="astro/client" />

// Type the Cloudflare runtime for API routes
// See: https://docs.astro.build/en/guides/integrations-guide/cloudflare/
declare namespace App {
  interface Locals {
    runtime: {
      env: {
        MOCK_ANALYTICS?: string;
      };
    };
  }
}
