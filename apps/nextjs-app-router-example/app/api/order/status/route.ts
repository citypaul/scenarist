/**
 * Order Status API Route (Issue #332 - Conditional afterResponse)
 *
 * Returns order status from external API.
 * MSW intercepts and returns state-dependent responses via stateResponse
 * with condition-level afterResponse support.
 */

import { NextRequest, NextResponse } from "next/server";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

const ORDERS_API_URL = "https://api.orders.com";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${ORDERS_API_URL}/order/status`, {
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
        error:
          error instanceof Error ? error.message : "Failed to get order status",
      },
      { status: 500 },
    );
  }
}
