/**
 * Products API Route Handler
 *
 * Fetches products from external API (json-server simulating Stripe/etc).
 *
 * Production: External API needs user tier to return correct tier-based pricing
 * Testing: Same code runs, MSW intercepts based on tier header, returns tier-specific mocks
 *
 * The tier header is production logic - external APIs often need user context!
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ProductsResponse } from '../../../types/product';

import { getScenaristHeaders } from '@scenarist/nextjs-adapter/app';

export async function GET(request: NextRequest) {
  try {
    // Get user tier from request header (application context)
    const userTier = request.headers.get('x-user-tier') || 'standard';

    // Extract campaign from query parameter for regex matching
    const campaign = request.nextUrl.searchParams.get('campaign');

    // Fetch from external API (json-server simulating Stripe)
    // External API needs tier context to return correct pricing
    const fetchHeaders: Record<string, string> = {
      ...getScenaristHeaders(request),  // Scenarist infrastructure (x-test-id)
      'x-user-tier': userTier,           // Application context (API needs this!)
    };

    // Add campaign header if present (external API uses for promotions)
    if (campaign) {
      fetchHeaders['x-campaign'] = campaign;
    }

    const response = await fetch('http://localhost:3001/products', {
      headers: fetchHeaders,
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();

    // json-server returns array directly, we need to wrap it in ProductsResponse shape
    const productsResponse: ProductsResponse = {
      products: Array.isArray(data) ? data : data.products,
    };

    return NextResponse.json(productsResponse);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch products',
      },
      { status: 500 }
    );
  }
}
