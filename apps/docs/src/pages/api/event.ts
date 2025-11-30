import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Proxy for Plausible analytics events.
 * Proxying through our domain helps avoid ad blockers.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();

    const response = await fetch("https://plausible.io/api/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": request.headers.get("User-Agent") ?? "",
        // CF-Connecting-IP is Cloudflare-specific header for client IP
        "X-Forwarded-For": request.headers.get("CF-Connecting-IP") ?? "",
      },
      body,
    });

    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Analytics unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
};
