/**
 * ProductCard Component - Phase 8.3
 *
 * Displays a single product with pricing information.
 * Uses semantic HTML and accessible labels for Playwright testing best practices.
 *
 * Note: No 'use client' directive needed - inherits client behavior from parent page.tsx
 */

import type { Product } from '../types/product';

type ProductCardProps = Product & {
  readonly onAddToCart?: () => void;
};

export const ProductCard = ({ name, description, price, tier, onAddToCart }: ProductCardProps) => {
  return (
    <article className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">
          {name}
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          {description}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl font-bold text-blue-600">
          £{price.toFixed(2)}
        </span>
        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
          {tier}
        </span>
      </div>

      <button
        onClick={onAddToCart}
        aria-label={`Add ${name} to cart`}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
      >
        Add to Cart
      </button>
    </article>
  );
};
