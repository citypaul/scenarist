import type { APIRoute } from "astro";

export const prerender = false;

// 5 second timeout to prevent hanging in CI when external service is unreachable
const FETCH_TIMEOUT_MS = 5000;

export const POST: APIRoute = async ({ request }) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const body = await request.text();

    const response = await fetch("https://plausible.io/api/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": request.headers.get("User-Agent") ?? "",
        // CF-Connecting-IP is Cloudflare-specific header for client IP (used on Cloudflare Pages)
        "X-Forwarded-For": request.headers.get("CF-Connecting-IP") ?? "",
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text();

    return new Response(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Analytics proxy error:", error);
    return new Response(JSON.stringify({ error: "Analytics unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
};
