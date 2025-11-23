/**
 * Cart API Route - Phase 3
 *
 * Fetches cart items from external API (json-server).
 * Demonstrates Scenarist's stateful mocks - cart state is captured from
 * POST /cart/add requests and injected into GET /cart responses.
 *
 * With Scenarist enabled: Returns mocked cart with captured state
 * With Scenarist disabled: Returns actual json-server data
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getScenaristHeaders } from '@scenarist/nextjs-adapter/pages';

type CartItem = {
  readonly productId: number;
  readonly quantity: number;
};

type CartResponse = {
  readonly items: ReadonlyArray<CartItem>;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CartResponse | { error: string }>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch from json-server (external API)
    // Scenarist MSW will intercept this request and return mocked cart data
    const response = await fetch('http://localhost:3001/cart', {
      headers: getScenaristHeaders(req),  // ✅ Scenarist infrastructure headers (x-test-id)
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch cart',
    });
  }
}
