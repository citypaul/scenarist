/**
 * Cart API Route Handler - GET
 *
 * Fetches current cart state from json-server REST API.
 * Demonstrates true production parity - same code path in all environments.
 *
 * Behavior (all environments use same code):
 * - Always GET from http://localhost:3001/cart
 * - Returns {items: [...]} from json-server
 *
 * In test/dev: MSW intercepts GET, injects state from StateManager
 * In production: Real json-server responds with actual cart data
 *
 * State flow (test/dev with Scenarist):
 * 1. POST /cart/add does GET-then-PATCH, PATCH captures full items array
 * 2. GET /cart injects cartItems from state (null → [] via ADR-0017)
 * 3. State persists across requests (per test ID)
 *
 * NO environment branching - routes always call real REST endpoints!
 */

import { NextRequest, NextResponse } from "next/server";

import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

const CART_BACKEND_URL = "http://localhost:3001/cart";

export async function GET(request: NextRequest) {
  try {
    // Always GET from json-server (MSW intercepts in test/dev, real json-server in production)
    const response = await fetch(CART_BACKEND_URL, {
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
        error: error instanceof Error ? error.message : "Failed to fetch cart",
      },
      { status: 500 },
    );
  }
}
