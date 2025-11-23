import type { Request, Response, Router } from 'express';

/**
 * Shopping cart routes - demonstrates stateful mock with capture and injection
 *
 * Always calls real json-server REST endpoints:
 * - test/dev: MSW intercepts GET /cart and PATCH /cart
 * - production: Calls pass through to json-server
 *
 * No environment branching - same code everywhere for true production parity.
 */

// Always use real json-server endpoint (MSW intercepts in test/dev)
const CART_BACKEND_URL = 'http://localhost:3001/cart';

export const setupCartRoutes = (router: Router): void => {
  router.post('/api/cart/add', async (req: Request, res: Response) => {
    const { item } = req.body;

    if (!item) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Item is required',
      });
    }

    try {
      // Always use GET-then-PATCH pattern
      // MSW intercepts in test/dev, json-server in production

      // GET current cart
      const getResponse = await fetch(CART_BACKEND_URL);
      const currentCart = await getResponse.json();

      // Route handles accumulation logic
      const updatedItems = [...(currentCart.items || []), item];

      // PATCH cart with updated items array
      const patchResponse = await fetch(CART_BACKEND_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems }),
      });

      const data = await patchResponse.json();
      return res.json({ success: true, items: data.items });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to add item to cart',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/api/cart', async (_req: Request, res: Response) => {
    try {
      // Both envs: GET cart
      const response = await fetch(CART_BACKEND_URL);
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.json(data);
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to get cart',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
