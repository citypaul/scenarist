/**
 * Products API Route - Phase 2
 *
 * Returns tier-based product pricing.
 * Demonstrates request matching by returning different prices based on x-user-tier header.
 *
 * NOTE: In a real application, this would fetch from an external API.
 * For this example, we return mock data directly to demonstrate the feature.
 */

import type { NextApiRequest, NextApiResponse} from 'next';

type Product = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly tier: string;
  readonly image: string;
};

type ProductsResponse = {
  readonly products: ReadonlyArray<Product>;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProductsResponse | { error: string }>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get user tier from request header (defaults to 'standard')
  const userTier = (req.headers['x-user-tier'] as string) || 'standard';

  // Return tier-based pricing
  const products: ReadonlyArray<Product> = userTier === 'premium'
    ? [
        {
          id: '1',
          name: 'Product A',
          description: 'High-quality product A',
          price: 99.99,
          tier: 'premium',
          image: '/images/product-a.jpg',
        },
        {
          id: '2',
          name: 'Product B',
          description: 'Premium product B',
          price: 149.99,
          tier: 'premium',
          image: '/images/product-b.jpg',
        },
        {
          id: '3',
          name: 'Product C',
          description: 'Essential product C',
          price: 79.99,
          tier: 'premium',
          image: '/images/product-c.jpg',
        },
      ]
    : [
        {
          id: '1',
          name: 'Product A',
          description: 'High-quality product A',
          price: 149.99,
          tier: 'standard',
          image: '/images/product-a.jpg',
        },
        {
          id: '2',
          name: 'Product B',
          description: 'Premium product B',
          price: 199.99,
          tier: 'standard',
          image: '/images/product-b.jpg',
        },
        {
          id: '3',
          name: 'Product C',
          description: 'Essential product C',
          price: 99.99,
          tier: 'standard',
          image: '/images/product-c.jpg',
        },
      ];

  return res.status(200).json({ products });
}
