/**
 * Product Type Definitions
 *
 * Shared types for product domain entities.
 * Single source of truth for product structure across the application.
 */

export type Product = {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly tier: string;
  readonly image: string;
};

export type ProductsResponse = {
  readonly products: ReadonlyArray<Product>;
};
