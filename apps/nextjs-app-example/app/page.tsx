/**
 * Products Page - Phase 8.2
 *
 * Displays product catalog with tier-based pricing.
 * Demonstrates Scenarist's request matching feature.
 *
 * Client Component - Requires state and effects for data fetching.
 */

'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '../components/ProductCard';
import { TierSelector } from '../components/TierSelector';
import type { Product } from '../types/product';

export default function HomePage() {
  const [userTier, setUserTier] = useState<'premium' | 'standard'>('standard');
  const [products, setProducts] = useState<ReadonlyArray<Product>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products when tier changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch from API route with tier header
        const response = await fetch('/api/products', {
          headers: {
            'x-user-tier': userTier,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }

        const data = await response.json();
        setProducts(data.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [userTier]);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Scenarist - Next.js App Router Example</h1>
          <p className="text-gray-600">E-commerce demo showcasing all Scenarist features with tier-based pricing</p>
        </div>

        <TierSelector currentTier={userTier} onTierChange={setUserTier} />

        {loading && (
          <div className="mt-8 text-center text-gray-600">Loading products...</div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            Error: {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="mt-8 text-center text-gray-600">No products found.</div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
