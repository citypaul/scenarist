import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Proxy for Plausible analytics script.
 * Proxying through our domain helps avoid ad blockers.
 */
export const GET: APIRoute = async () => {
  try {
    const response = await fetch("https://plausible.io/js/script.js");

    if (!response.ok) {
      // Return empty no-op script if Plausible is unavailable
      return new Response("// Analytics unavailable", {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    return new Response(await response.text(), {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control":
          response.headers.get("Cache-Control") ?? "public, max-age=86400",
      },
    });
  } catch {
    return new Response("// Analytics unavailable", {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=60",
      },
    });
  }
};
