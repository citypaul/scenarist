import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // In test mode, return mock response without calling external service
  const runtime = locals.runtime as
    | { env?: { MOCK_ANALYTICS?: string } }
    | undefined;
  if (runtime?.env?.MOCK_ANALYTICS === "true") {
    // Validate the request body structure for realistic testing
    try {
      const body = await request.text();

      // Empty body is invalid
      if (!body || body.trim() === "") {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const data = JSON.parse(body);

      // Must be an object, not a primitive (handles stringified strings)
      if (typeof data !== "object" || data === null) {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check for required Plausible event fields
      if (!data.n || !data.u || !data.d) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Valid event - return success
      return new Response("ok", {
        status: 202,
        headers: { "Content-Type": "text/plain" },
      });
    } catch {
      // Invalid JSON
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Production: proxy to real Plausible
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
    });

    const responseBody = await response.text();

    return new Response(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Analytics proxy error:", error);
    return new Response(JSON.stringify({ error: "Analytics unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
};
