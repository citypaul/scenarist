/**
 * Add to Cart API Route - Phase 8.3
 *
 * Adds an item to the cart via external API (json-server).
 * Demonstrates Scenarist's state capture - the productId from the request
 * is captured and added to the cart state, which is then injected into
 * subsequent GET /cart responses.
 *
 * With Scenarist enabled: Captures productId and updates cart state
 * With Scenarist disabled: Sends actual POST to json-server
 */

import { NextResponse } from 'next/server';
import { getScenaristHeaders } from '@scenarist/nextjs-adapter/app';
import { scenarist } from '../../../../lib/scenarist';

type AddToCartRequest = {
  readonly productId: number;
};

type AddToCartResponse = {
  readonly success: boolean;
};

export async function POST(request: Request) {
  try {
    const body: AddToCartRequest = await request.json();

    // Validate request body
    if (!body.productId || typeof body.productId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid productId' },
        { status: 400 }
      );
    }

    // POST to json-server (external API)
    // Scenarist MSW will intercept this request, capture the productId,
    // and update the cart state
    const response = await fetch('http://localhost:3001/cart/add', {
      method: 'POST',
      headers: {
        ...getScenaristHeaders(request, scenarist),  // ✅ Scenarist infrastructure headers (x-test-id)
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data: AddToCartResponse = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to add to cart',
      },
      { status: 500 }
    );
  }
}
