/**
 * Add to Cart API Route
 *
 * Adds an item to the cart via json-server REST API.
 * Demonstrates Scenarist's state capture and injection.
 *
 * Always calls real json-server REST endpoints:
 * - test/dev: MSW intercepts GET /cart and PATCH /cart
 * - production: Calls pass through to json-server
 *
 * No environment branching - same code everywhere for true production parity.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getScenaristHeaders } from '@scenarist/nextjs-adapter/pages';

type AddToCartRequest = {
  readonly productId: number;
};

type AddToCartResponse = {
  readonly success: boolean;
  readonly items: ReadonlyArray<number>;
};

// Always use real json-server endpoint (MSW intercepts in test/dev)
const CART_BACKEND_URL = 'http://localhost:3001/cart';

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

    // Always use GET-then-PATCH pattern
    // MSW intercepts in test/dev, json-server in production

    // GET current cart
    const getResponse = await fetch(CART_BACKEND_URL, {
      headers: getScenaristHeaders(req),
    });

    if (!getResponse.ok) {
      throw new Error(`GET cart failed: ${getResponse.status}`);
    }

    const currentCart = await getResponse.json();

    // Route handles accumulation logic
    // Store raw productIds array [1, 1, 2] - client-side aggregates into quantities
    const updatedItems: number[] = [
      ...(currentCart.items || []),
      body.productId,
    ];

    // PATCH cart with updated items array
    const patchResponse = await fetch(CART_BACKEND_URL, {
      method: 'PATCH',
      headers: {
        ...getScenaristHeaders(req),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: updatedItems }),
    });

    if (!patchResponse.ok) {
      throw new Error(`PATCH cart failed: ${patchResponse.status}`);
    }

    const data = await patchResponse.json();

    return res.status(200).json({ success: true, items: data.items });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to add to cart',
    });
  }
}
