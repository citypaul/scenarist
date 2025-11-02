/**
 * ProductCard Component - Phase 2
 *
 * Displays a single product with pricing information.
 * Uses data-testid attributes for Playwright testing.
 */

import type { Product } from '../types/product';

type ProductCardProps = Product & {
  readonly onAddToCart?: () => void;
};

export const ProductCard = ({ id, name, description, price, tier, onAddToCart }: ProductCardProps) => {
  return (
    <div data-testid="product-card" className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">
        <h3 data-testid="product-name" className="text-lg font-semibold mb-2">
          {name}
        </h3>
        <p data-testid="product-description" className="text-gray-600 text-sm mb-4">
          {description}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span data-testid="product-price" className="text-2xl font-bold text-blue-600">
          £{price.toFixed(2)}
        </span>
        <span data-testid="product-tier" className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
          {tier}
        </span>
      </div>

      <button
        data-testid={`add-to-cart-${id}`}
        onClick={onAddToCart}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
      >
        Add to Cart
      </button>
    </div>
  );
};
