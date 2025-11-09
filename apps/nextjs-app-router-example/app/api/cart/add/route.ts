/**
 * Cart Add API Route Handler - POST
 *
 * Adds item to cart via external API (json-server).
 * Demonstrates Scenarist state capture - productId is captured into cartItems[] array.
 *
 * State flow:
 * 1. POST /cart/add captures productId from request body
 * 2. State is stored in StateManager (per test ID)
 * 3. Subsequent GET /cart requests inject this state
 */

import { NextRequest, NextResponse } from 'next/server';
import { scenarist } from '../../../../lib/scenarist';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Fetch from json-server (external API)
    // Scenarist MSW will intercept and capture productId from body into state
    const response = await fetch('http://localhost:3001/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...scenarist.getHeaders(request),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();

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
