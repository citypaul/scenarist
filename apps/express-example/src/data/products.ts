/**
 * Product data builder for repository pattern tests.
 *
 * Builds product arrays with tier-based pricing:
 * - Premium tier: Lower prices (discounted)
 * - Standard tier: Regular prices
 */

export type Product = {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly tier: string;
};

const premiumProducts: ReadonlyArray<Product> = [
  {
    id: 1,
    name: "Product A",
    description: "Premium tier product",
    price: 99.99,
    tier: "premium",
  },
  {
    id: 2,
    name: "Product B",
    description: "Premium tier product",
    price: 149.99,
    tier: "premium",
  },
  {
    id: 3,
    name: "Product C",
    description: "Premium tier product",
    price: 79.99,
    tier: "premium",
  },
];

const standardProducts: ReadonlyArray<Product> = [
  {
    id: 1,
    name: "Product A",
    description: "Standard tier product",
    price: 149.99,
    tier: "standard",
  },
  {
    id: 2,
    name: "Product B",
    description: "Standard tier product",
    price: 199.99,
    tier: "standard",
  },
  {
    id: 3,
    name: "Product C",
    description: "Standard tier product",
    price: 99.99,
    tier: "standard",
  },
];

export const buildProducts = (tier: "premium" | "standard"): ReadonlyArray<Product> => {
  return tier === "premium" ? premiumProducts : standardProducts;
};
