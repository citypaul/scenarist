/**
 * Issue #335 Test API Route
 *
 * Fetches application status from external API (json-server).
 * Used to verify that switching to a scenario with a simple response
 * overrides the default scenario's sequence mock.
 *
 * @see https://github.com/citypaul/scenarist/issues/335
 */

import { NextRequest, NextResponse } from "next/server";

import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const response = await fetch(
      `http://localhost:3001/issue335/applications/${id}`,
      {
        headers: {
          ...getScenaristHeaders(request),
        },
      },
    );

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch application status",
      },
      { status: 500 },
    );
  }
}
