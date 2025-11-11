/**
 * Products Page - Phase 2
 *
 * Displays product catalog with tier-based pricing.
 * Demonstrates Scenarist's request matching feature.
 */

import { useState, useEffect } from 'react';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { ProductCard } from '../components/ProductCard';
import { TierSelector } from '../components/TierSelector';
import type { Product } from '../types/product';
import { scenarist } from '../lib/scenarist';

type HomeProps = {
  readonly initialProducts?: ReadonlyArray<Product>;
  readonly initialTier?: string;
};

export default function Home({ initialProducts = [], initialTier = 'standard' }: HomeProps) {
  const [userTier, setUserTier] = useState<'premium' | 'standard'>(
    initialTier as 'premium' | 'standard'
  );
  const [products, setProducts] = useState<ReadonlyArray<Product>>(initialProducts);
  // Start loading as false if we have initial products (SSR)
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);

  // Fetch cart count on mount
  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const response = await fetch('/api/cart');
        if (response.ok) {
          const data = await response.json();
          // Handle case where items might be template string (before any state captured)
          const items = Array.isArray(data.items) ? data.items : [];
          setCartCount(items.length);
        }
      } catch {
        // Silent fail - cart count not critical
      }
    };

    fetchCartCount();
  }, []);

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

  const handleAddToCart = async (productId: number) => {
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        setCartCount((prev) => prev + 1);
      }
    } catch {
      // Silent fail for now
    }
  };

  return (
    <>
      <Head>
        <title>Scenarist E-commerce Example</title>
        <meta name="description" content="E-commerce example using Scenarist for testing" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-gray-900">Scenarist E-commerce Example</h1>
              <p className="text-gray-600">Demonstrating request matching with tier-based pricing</p>
            </div>
            <div role="region" aria-label="Shopping cart summary" className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 shadow-sm">
              <span className="text-gray-700">Cart:</span>
              <output aria-label="Cart item count" className="font-bold text-blue-600">
                {cartCount}
              </output>
            </div>
          </div>

          <nav aria-label="Main navigation" className="mb-8">
            <ul className="flex gap-4">
              <li>
                <span className="text-blue-600 font-semibold">Products</span>
              </li>
              <li>
                <Link href="/cart" className="text-blue-600 hover:text-blue-700 underline">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/sequences" className="text-blue-600 hover:text-blue-700 underline">
                  Sequences Demo
                </Link>
              </li>
            </ul>
          </nav>

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
                  onAddToCart={() => handleAddToCart(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Extract tier from query param or default to 'standard'
  // Query params can be string | string[] | undefined
  const tierParam = context.query.tier;
  const tier = Array.isArray(tierParam) ? tierParam[0] : tierParam || 'standard';

  try {
    // Fetch products server-side with tier header
    // This demonstrates Scenarist working during getServerSideProps
    // Call internal Next.js API route (which then calls external json-server)
    const response = await fetch('http://localhost:3000/api/products', {
      headers: {
        ...scenarist.getHeaders(context.req),
        'x-user-tier': tier,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const data = await response.json();

    return {
      props: {
        initialProducts: data.products,
        initialTier: tier,
      },
    };
  } catch (error) {
    console.error('SSR fetch error:', error);
    return {
      props: {
        initialProducts: [],
        initialTier: tier,
      },
    };
  }
};
