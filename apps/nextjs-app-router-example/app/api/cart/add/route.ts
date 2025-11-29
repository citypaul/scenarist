/**
 * Cart Add API Route Handler - POST
 *
 * Adds item to cart via json-server REST API.
 * Demonstrates true production parity - same code path in all environments.
 *
 * Behavior (all environments use same code):
 * 1. GET current cart from http://localhost:3001/cart
 * 2. Route appends productId to items array
 * 3. PATCH updated cart back to http://localhost:3001/cart
 *
 * In test/dev: MSW intercepts GET and PATCH, manages state
 * In production: Real json-server responds to GET and PATCH
 *
 * NO environment branching - routes always call real REST endpoints!
 */

import { NextRequest, NextResponse } from "next/server";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/app";

const CART_BACKEND_URL = "http://localhost:3001/cart";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "productId is required",
        },
        { status: 400 },
      );
    }

    // Always GET current cart (MSW intercepts in test/dev, real json-server in production)
    const getResponse = await fetch(CART_BACKEND_URL, {
      headers: {
        ...getScenaristHeaders(request),
      },
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch cart: ${getResponse.status}`);
    }

    const currentCart = await getResponse.json();

    // Route handles accumulation logic
    // If items is null (ADR-0017), || [] handles it correctly
    const updatedItems = [...(currentCart.items || []), productId];

    // Always PATCH with updated array (MSW intercepts in test/dev, real json-server in production)
    const patchResponse = await fetch(CART_BACKEND_URL, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getScenaristHeaders(request),
      },
      body: JSON.stringify({
        items: updatedItems,
      }),
    });

    if (!patchResponse.ok) {
      throw new Error(`Failed to update cart: ${patchResponse.status}`);
    }

    const data = await patchResponse.json();
    return NextResponse.json({ success: true, items: data.items });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to add to cart",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
