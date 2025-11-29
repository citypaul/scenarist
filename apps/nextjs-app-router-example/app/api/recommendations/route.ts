/**
 * Recommendations API Route - Proxies external recommendation service
 *
 * This demonstrates a common pattern: wrapping external APIs behind
 * your own API routes for consistent error handling and caching.
 *
 * Scenarist mocks this to test different recommendation responses.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const tier = request.headers.get("x-user-tier") || "standard";

  // Forward test ID header for scenario isolation
  const testId = request.headers.get("x-scenarist-test-id");
  const headers: Record<string, string> = {
    "x-user-tier": tier,
  };
  if (testId) {
    headers["x-scenarist-test-id"] = testId;
  }

  // Call external recommendation service (Scenarist intercepts this)
  const response = await fetch("http://localhost:3001/api/recommendations", {
    headers,
  });

  return NextResponse.json(await response.json());
}
