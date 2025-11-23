/**
 * Products API Route - Phase 2
 *
 * Fetches products from external API (json-server).
 * Demonstrates Scenarist intercepting the request and returning tier-based pricing
 * based on x-user-tier header matching.
 *
 * With Scenarist enabled: Returns mocked tier-specific prices
 * With Scenarist disabled: Returns actual json-server data
 */

import type { NextApiRequest, NextApiResponse} from 'next';
import type { ProductsResponse } from '../../types/product';
import { getScenaristHeaders } from '@scenarist/nextjs-adapter/pages';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProductsResponse | { error: string }>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user tier from request header (app-specific, not Scenarist infrastructure)
    const userTier = (req.headers['x-user-tier'] as string) || 'standard';

    // Fetch from json-server (external API)
    // Scenarist MSW will intercept this request and return mocked data based on scenario
    const response = await fetch('http://localhost:3001/products', {
      headers: {
        ...getScenaristHeaders(req),  // ✅ Scenarist infrastructure headers (x-test-id)
        'x-user-tier': userTier,       // ✅ Application-specific header
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();

    // json-server returns array directly, we need to wrap it in ProductsResponse shape
    const productsResponse: ProductsResponse = {
      products: Array.isArray(data) ? data : data.products,
    };

    return res.status(200).json(productsResponse);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch products',
    });
  }
}
