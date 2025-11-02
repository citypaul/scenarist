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
import type { ProductsResponse } from '../../types/product';
import { buildProducts } from '../../data/products';

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

  // Build products with tier-specific pricing
  const products = buildProducts(userTier as 'premium' | 'standard');

  return res.status(200).json({ products });
}
