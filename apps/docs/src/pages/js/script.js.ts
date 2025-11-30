import type { APIRoute } from "astro";

export const prerender = false;

const FALLBACK_SCRIPT =
  "// Analytics unavailable\nwindow.plausible = function() {};";

// 5 second timeout to prevent hanging in CI when external service is unreachable
const FETCH_TIMEOUT_MS = 5000;

export const GET: APIRoute = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch("https://plausible.io/js/script.js", {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(FALLBACK_SCRIPT, {
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
    clearTimeout(timeoutId);
    console.error("Analytics script proxy error:", error);
    return new Response(FALLBACK_SCRIPT, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=60",
      },
    });
  }
};
