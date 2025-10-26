import type { Request, Response, Router } from 'express';

/**
 * Shopping cart routes - demonstrates stateful mock with capture and injection
 */
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
      // Call external cart API (will be mocked by Scenarist with state capture)
      const response = await fetch('https://api.store.com/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item }),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.json(data);
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to add item to cart',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/api/cart', async (_req: Request, res: Response) => {
    try {
      // Call external cart API (will be mocked by Scenarist with state injection)
      const response = await fetch('https://api.store.com/cart');

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
