import type { Request, Response, Router } from 'express';

/**
 * Shopping cart routes - demonstrates stateful mock with capture and injection
 *
 * In tests: Scenarist/MSW intercepts and uses stateful mocking
 * In production: Requests go through to json-server (real backend)
 */
export const setupCartRoutes = (router: Router): void => {
  router.post('/api/cart/add', async (req: Request, res: Response) => {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'productId is required',
      });
    }

    try {
      // In production: Use json-server's PATCH to update the cart
      // In tests: Scenarist/MSW intercepts and uses stateful mocking

      // First, GET current cart
      const getResponse = await fetch('http://localhost:3001/cart');

      if (!getResponse.ok) {
        throw new Error(`Failed to fetch cart: ${getResponse.status}`);
      }

      const currentCart = await getResponse.json();
      const currentItems = currentCart.items || [];

      // Add the new productId to the items array
      const updatedItems = [...currentItems, productId];

      // PATCH the cart with updated items
      const patchResponse = await fetch('http://localhost:3001/cart', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: updatedItems }),
      });

      if (!patchResponse.ok) {
        throw new Error(`Failed to update cart: ${patchResponse.status}`);
      }

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to add item to cart',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/api/cart', async (_req: Request, res: Response) => {
    try {
      // Call json-server (real backend)
      // In tests: MSW intercepts with mock scenarios
      // In production: Goes through to json-server
      const response = await fetch('http://localhost:3001/cart');

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
