/**
 * ProductCard Component - Phase 8.2
 *
 * Displays a single product with pricing information.
 * Uses semantic HTML and accessible labels for Playwright testing best practices.
 *
 * Note: No 'use client' directive needed - inherits client behavior from parent page.tsx
 * Button is disabled as placeholder for Phase 8.3 cart functionality.
 */

import type { Product } from '../types/product';

export const ProductCard = ({ name, description, price, tier }: Product) => {
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
        disabled
        aria-label={`Add ${name} to cart`}
        className="w-full bg-gray-400 cursor-not-allowed text-white font-medium py-2 px-4 rounded"
      >
        Add to Cart (Coming in Phase 8.3)
      </button>
    </article>
  );
};
