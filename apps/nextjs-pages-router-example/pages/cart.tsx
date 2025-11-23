/**
 * Cart Page - Phase 3
 *
 * Displays shopping cart contents with product details and quantities.
 * Demonstrates Scenarist's state injection feature - cart items are captured
 * from POST /cart/add requests and injected into GET /cart responses.
 */

import { useState, useEffect } from 'react';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import type { Product } from '../types/product';
import { getScenaristHeaders } from '@scenarist/nextjs-adapter/pages';

type CartItem = {
  readonly productId: number;
  readonly quantity: number;
  readonly product?: Product;
};

// Aggregate raw productIds array into items with quantities
const aggregateCartItems = (productIds: ReadonlyArray<number>): ReadonlyArray<CartItem> => {
  const counts = productIds.reduce((acc, productId) => {
    return { ...acc, [productId]: (acc[productId] ?? 0) + 1 };
  }, {} as Record<number, number>);

  return Object.entries(counts).map(([productId, quantity]) => ({
    productId: Number(productId),
    quantity,
  }));
};

type CartProps = {
  readonly initialCartItems?: ReadonlyArray<CartItem>;
};

export default function Cart({ initialCartItems = [] }: CartProps) {
  const [cartItems, setCartItems] = useState<ReadonlyArray<CartItem>>(initialCartItems);
  // Start loading as false if we have initial cart items (SSR)
  const [loading, setLoading] = useState(initialCartItems.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/cart');

        if (!response.ok) {
          throw new Error(`Failed to fetch cart: ${response.status}`);
        }

        const data = await response.json();

        // State from Scenarist is raw array of productIds: [1, 1, 2]
        // Aggregate into items with quantities: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }]
        const rawItems = data.items ?? [];
        const aggregated = Array.isArray(rawItems) && rawItems.length > 0
          ? aggregateCartItems(rawItems)
          : [];

        setCartItems(aggregated);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch cart');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  return (
    <>
      <Head>
        <title>Shopping Cart - Scenarist Example</title>
        <meta name="description" content="Shopping cart demonstrating stateful mocks" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shopping Cart</h1>

          <nav aria-label="Main navigation" className="mb-8">
            <ul className="flex gap-4">
              <li>
                <Link href="/" className="text-blue-600 hover:text-blue-700 underline">
                  Products
                </Link>
              </li>
              <li>
                <span className="text-blue-600 font-semibold">Shopping Cart</span>
              </li>
              <li>
                <Link href="/sequences" className="text-blue-600 hover:text-blue-700 underline">
                  Sequences Demo
                </Link>
              </li>
            </ul>
          </nav>

          {loading && (
            <div className="text-center text-gray-600">Loading cart...</div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              Error: {error}
            </div>
          )}

          {!loading && !error && cartItems.length === 0 && (
            <div className="text-center text-gray-600">
              <p className="text-xl mb-4">Your cart is empty</p>
              <Link href="/" className="text-blue-600 hover:text-blue-700 underline">
                Continue Shopping
              </Link>
            </div>
          )}

          {!loading && !error && cartItems.length > 0 && (
            <>
              <ul className="space-y-4" aria-label="Shopping cart items">
                {cartItems.map((item, index) => (
                  <li
                    key={index}
                    className="bg-white border rounded-lg p-6 shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">
                          Product #{item.productId}
                        </h3>
                        {item.product && (
                          <>
                            <p className="text-gray-600 text-sm mb-2">{item.product.name}</p>
                            <p className="text-xl font-bold text-blue-600">
                              £{item.product.price.toFixed(2)}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">Quantity</div>
                        <output
                          aria-label="Item quantity"
                          className="text-2xl font-bold text-gray-900 block"
                        >
                          {item.quantity}
                        </output>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Items:</span>
                  <output
                    aria-label="Total items in cart"
                    className="text-2xl font-bold text-blue-600"
                  >
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </output>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Fetch cart data server-side
    // This demonstrates Scenarist intercepting EXTERNAL API calls directly from getServerSideProps
    // No API route in between - direct external call that MSW intercepts
    const response = await fetch('http://localhost:3001/cart', {
      headers: getScenaristHeaders(context.req),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cart: ${response.status}`);
    }

    const data = await response.json();

    // Aggregate cart items from raw productIds array
    const rawItems = data.items ?? [];
    const cartItems = Array.isArray(rawItems) && rawItems.length > 0
      ? aggregateCartItems(rawItems)
      : [];

    return {
      props: {
        initialCartItems: cartItems,
      },
    };
  } catch (error) {
    console.error('SSR cart fetch error:', error);
    return {
      props: {
        initialCartItems: [],
      },
    };
  }
};
