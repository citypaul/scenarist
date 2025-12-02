/**
 * Pricing API Route (ADR-0019 State-Aware Mocking)
 *
 * Gets pricing information from external API.
 * MSW intercepts and selects mock via match.state based on feature flags.
 */

import { NextRequest, NextResponse } from "next/server";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

const PRICING_API_URL = "https://api.pricing.com";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${PRICING_API_URL}/pricing`, {
      headers: {
        ...getScenaristHeaders(request),
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get pricing",
      },
      { status: 500 },
    );
  }
}
