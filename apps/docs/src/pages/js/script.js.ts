import type { APIRoute } from "astro";

export const prerender = false;

// Mock script for testing - mimics real Plausible script structure
const MOCK_SCRIPT = `// Mock Plausible Analytics Script
(function() {
  'use strict';
  window.plausible = window.plausible || function() {
    (window.plausible.q = window.plausible.q || []).push(arguments);
  };
})();`;

export const GET: APIRoute = async ({ locals }) => {
  // In test mode, return mock response without calling external service
  const runtime = locals.runtime as
    | { env?: { MOCK_ANALYTICS?: string } }
    | undefined;
  if (runtime?.env?.MOCK_ANALYTICS === "true") {
    return new Response(MOCK_SCRIPT, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // Production: proxy to real Plausible
  try {
    const response = await fetch("https://plausible.io/js/script.js");

    if (!response.ok) {
      return new Response(MOCK_SCRIPT, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    const body = await response.text();

    return new Response(body, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control":
          response.headers.get("Cache-Control") ?? "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Analytics script proxy error:", error);
    return new Response(MOCK_SCRIPT, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=60",
      },
    });
  }
};
