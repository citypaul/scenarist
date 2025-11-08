/**
 * Checkout Shipping API Route - Phase 8.4 Composition Demo
 *
 * Proxies shipping calculation requests to json-server (localhost:3001)
 * where MSW intercepts them.
 *
 * Demonstrates request matching on country field to return different
 * shipping costs while simultaneously capturing address via state.
 */

import { NextResponse } from 'next/server';
import { getScenaristHeaders } from '@scenarist/nextjs-adapter/app';
import { scenarist } from '../../../../lib/scenarist';

type ShippingRequest = {
  readonly country: string;
  readonly address: string;
  readonly city: string;
  readonly postcode: string;
};

type ShippingResponse = {
  readonly country: string;
  readonly shippingCost: number;
};

export async function POST(request: Request) {
  try {
    const body: ShippingRequest = await request.json();

    // Proxy to json-server (MSW will intercept on server-side)
    const response = await fetch('http://localhost:3001/checkout/shipping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getScenaristHeaders(request, scenarist), // ✅ Pass test ID to MSW
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data: ShippingResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to calculate shipping',
      },
      { status: 500 }
    );
  }
}
