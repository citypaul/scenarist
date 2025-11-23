import type { Request, Response, Router } from 'express';

/**
 * Shopping cart routes - demonstrates stateful mock with capture and injection
 *
 * Behavior by environment:
 * - test/dev: Calls api.store.com (mocked by Scenarist/MSW)
 * - production: Calls localhost:3001 (real json-server backend)
 */

// Backend URL changes based on environment
const CART_BACKEND_URL =
  process.env.NODE_ENV === 'production'
    ? 'http://localhost:3001/cart'
    : 'https://api.store.com/cart';

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
      // In production: GET-then-PATCH pattern for json-server
      // In test: POST to mocked endpoint
      if (process.env.NODE_ENV === 'production') {
        // GET current cart
        const getResponse = await fetch(CART_BACKEND_URL);
        const currentCart = await getResponse.json();

        // PATCH to add new item
        const patchResponse = await fetch(CART_BACKEND_URL, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [...(currentCart.items || []), item],
          }),
        });

        const data = await patchResponse.json();
        return res.json({ success: true, items: data.items });
      } else {
        // Test/dev: call mocked endpoint
        const response = await fetch(`${CART_BACKEND_URL}/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item }),
        });

        const data = await response.json();

        if (!response.ok) {
          return res.status(response.status).json(data);
        }

        return res.json(data);
      }
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
