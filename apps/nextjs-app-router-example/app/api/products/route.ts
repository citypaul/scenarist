/**
 * Products API Route Handler - Phase 8.2
 *
 * Fetches products from external API (json-server).
 * Demonstrates Scenarist intercepting the request and returning tier-based pricing
 * based on x-user-tier header matching.
 *
 * With Scenarist enabled: Returns mocked tier-specific prices
 * With Scenarist disabled: Returns actual json-server data
 *
 * App Router Route Handler - Uses Web Request/Response API
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ProductsResponse } from '../../../types/product';
import { scenarist } from '../../../lib/scenarist';

export async function GET(request: NextRequest) {
  try {
    // Get user tier from request header (app-specific, not Scenarist infrastructure)
    const userTier = request.headers.get('x-user-tier') || 'standard';

    // Fetch from json-server (external API)
    // Scenarist MSW will intercept this request and return mocked data based on scenario
    const fetchHeaders = {
      ...scenarist.getHeaders(request),  // ✅ Scenarist infrastructure headers (x-test-id)
      'x-user-tier': userTier,                      // ✅ Application-specific header
    };

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
