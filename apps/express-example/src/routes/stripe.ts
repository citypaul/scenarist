import type { Request, Response, Router } from 'express';

/**
 * Stripe routes - demonstrates calling external Stripe API
 */
export const setupStripeRoutes = (router: Router): void => {
  router.post('/api/payment', async (req: Request, res: Response) => {
    const { amount, currency = 'usd' } = req.body;

    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Amount is required and must be a number',
      });
    }

    try {
      // Call external Stripe API (will be mocked by Scenarist)
      const response = await fetch('https://api.stripe.com/v1/charges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, currency }),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.json(data);
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to process payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
