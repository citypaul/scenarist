/**
 * Add to Cart API Route - Phase 3
 *
 * Adds an item to the cart via external API (json-server).
 * Demonstrates Scenarist's state capture - the productId from the request
 * is captured and added to the cart state, which is then injected into
 * subsequent GET /cart responses.
 *
 * With Scenarist enabled: Captures productId and updates cart state
 * With Scenarist disabled: Sends actual POST to json-server
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getScenaristHeaders } from '@scenarist/nextjs-adapter/pages';
import { scenarist } from '../../../lib/scenarist';

type AddToCartRequest = {
  readonly productId: number;
};

type AddToCartResponse = {
  readonly success: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AddToCartResponse | { error: string }>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body: AddToCartRequest = req.body;

    // Validate request body
    if (!body.productId || typeof body.productId !== 'number') {
      return res.status(400).json({ error: 'Invalid productId' });
    }

    // POST to json-server (external API)
    // Scenarist MSW will intercept this request, capture the productId,
    // and update the cart state
    const response = await fetch('http://localhost:3001/cart/add', {
      method: 'POST',
      headers: {
        ...getScenaristHeaders(req, scenarist),  // ✅ Scenarist infrastructure headers (x-test-id)
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to add to cart',
    });
  }
}
