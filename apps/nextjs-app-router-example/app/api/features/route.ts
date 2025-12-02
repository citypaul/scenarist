/**
 * Features API Route (ADR-0019 State-Aware Mocking)
 *
 * Sets feature flags via external API.
 * MSW intercepts and captures feature state via captureState.
 */

import { NextRequest, NextResponse } from "next/server";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

const FEATURES_API_URL = "https://api.features.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.flag || body.enabled === undefined) {
      return NextResponse.json(
        { error: "Invalid request", message: "flag and enabled are required" },
        { status: 400 },
      );
    }

    const response = await fetch(`${FEATURES_API_URL}/features`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getScenaristHeaders(request),
      },
      body: JSON.stringify({ flag: body.flag, enabled: body.enabled }),
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to set feature flag",
      },
      { status: 500 },
    );
  }
}
