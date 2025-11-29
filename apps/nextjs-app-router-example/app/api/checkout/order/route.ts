/**
 * Checkout Order API Route - Phase 8.4 Composition Demo
 *
 * Proxies order placement requests to json-server (localhost:3001)
 * where MSW intercepts them.
 *
 * Demonstrates stateful mocks - the response includes the shipping
 * address that was captured during the shipping calculation step.
 */

import { NextResponse } from "next/server";

import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

type OrderRequest = {
  readonly orderId: string;
};

type OrderResponse = {
  readonly orderId: string;
  readonly shippingAddress: {
    readonly country: string;
    readonly address: string;
    readonly city: string;
    readonly postcode: string;
  };
};

export async function POST(request: Request) {
  try {
    const body: OrderRequest = await request.json();

    // Proxy to json-server (MSW will intercept on server-side)
    const response = await fetch("http://localhost:3001/checkout/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getScenaristHeaders(request), // ✅ Pass test ID to MSW
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data: OrderResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to place order",
      },
      { status: 500 },
    );
  }
}
