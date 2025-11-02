/**
 * Products Page - Phase 2
 *
 * Displays product catalog with tier-based pricing.
 * Demonstrates Scenarist's request matching feature.
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { ProductCard } from '../components/ProductCard';
import { TierSelector } from '../components/TierSelector';

type Product = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly tier: string;
  readonly image: string;
};

export default function Home() {
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
    <>
      <Head>
        <title>Scenarist E-commerce Example</title>
        <meta name="description" content="E-commerce example using Scenarist for testing" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Scenarist E-commerce Example</h1>
          <p className="text-gray-600 mb-8">Demonstrating request matching with tier-based pricing</p>

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
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
