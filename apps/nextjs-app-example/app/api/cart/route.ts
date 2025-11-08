/**
 * Cart API Route - Phase 8.3
 *
 * Fetches cart items from external API (json-server).
 * Demonstrates Scenarist's stateful mocks - cart state is captured from
 * POST /cart/add requests and injected into GET /cart responses.
 *
 * With Scenarist enabled: Returns mocked cart with captured state
 * With Scenarist disabled: Returns actual json-server data
 */

import { NextResponse } from 'next/server';
import { getScenaristHeaders } from '@scenarist/nextjs-adapter/app';
import { scenarist } from '../../../lib/scenarist';

type CartItem = {
  readonly productId: number;
  readonly quantity: number;
};

type CartResponse = {
  readonly items: ReadonlyArray<CartItem>;
};

export async function GET(request: Request) {
  try {
    // Fetch from json-server (external API)
    // Scenarist MSW will intercept this request and return mocked cart data
    const response = await fetch('http://localhost:3001/cart', {
      headers: {
        ...getScenaristHeaders(request, scenarist),  // ✅ Scenarist infrastructure headers (x-test-id)
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data: CartResponse = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch cart',
      },
      { status: 500 }
    );
  }
}
