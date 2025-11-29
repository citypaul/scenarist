/**
 * Product Catalog Data
 *
 * Single source of truth for product catalog structure and pricing.
 * Used by both API routes and test scenarios to ensure consistency.
 */

import type { Product } from "../types/product";

type ProductBase = Omit<Product, "price" | "tier">;

const baseProducts: ReadonlyArray<ProductBase> = [
  {
    id: 1,
    name: "Product A",
    description: "High-quality product A",
    image: "/images/product-a.jpg",
  },
  {
    id: 2,
    name: "Product B",
    description: "Premium product B",
    image: "/images/product-b.jpg",
  },
  {
    id: 3,
    name: "Product C",
    description: "Essential product C",
    image: "/images/product-c.jpg",
  },
] as const;

export const PREMIUM_PRICES: Record<number, number> = {
  1: 99.99,
  2: 149.99,
  3: 79.99,
} as const;

export const STANDARD_PRICES: Record<number, number> = {
  1: 149.99,
  2: 199.99,
  3: 99.99,
} as const;

/**
 * Build product list with tier-specific pricing
 */
export const buildProducts = (
  tier: "premium" | "standard",
): ReadonlyArray<Product> => {
  const prices = tier === "premium" ? PREMIUM_PRICES : STANDARD_PRICES;

  return baseProducts.map((product) => ({
    ...product,
    price: prices[product.id] ?? 0,
    tier,
  }));
};
