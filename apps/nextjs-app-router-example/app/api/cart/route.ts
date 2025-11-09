/**
 * Cart API Route Handler - GET
 *
 * Fetches current cart state from external API (json-server).
 * Demonstrates Scenarist stateful mocks - cart items are injected from captured state.
 *
 * State flow:
 * 1. POST /cart/add captures productId into cartItems[] array
 * 2. GET /cart injects cartItems from state into response
 * 3. State persists across requests (per test ID)
 */

import { NextRequest, NextResponse } from 'next/server';
import { scenarist } from '../../../lib/scenarist';

export async function GET(request: NextRequest) {
  try {
    // Fetch from json-server (external API)
    // Scenarist MSW will intercept and inject state into response
    const response = await fetch('http://localhost:3001/cart', {
      headers: {
        ...scenarist.getHeaders(request),
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
        error: error instanceof Error ? error.message : 'Failed to fetch cart',
      },
      { status: 500 }
    );
  }
}
