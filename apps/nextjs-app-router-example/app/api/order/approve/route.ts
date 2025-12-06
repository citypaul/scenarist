/**
 * Order Approve API Route (Issue #332 - Conditional afterResponse)
 *
 * Approves an order via external API.
 * MSW intercepts and sets state via afterResponse.setState.
 */

import { NextRequest, NextResponse } from "next/server";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

const ORDERS_API_URL = "https://api.orders.com";

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${ORDERS_API_URL}/order/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
          error instanceof Error ? error.message : "Failed to approve order",
      },
      { status: 500 },
    );
  }
}
