/**
 * Products Page - Phase 8.3
 *
 * Displays product catalog with tier-based pricing and shopping cart.
 * Demonstrates Scenarist's request matching and stateful mocks features.
 *
 * Client Component - Requires state and effects for data fetching and cart management.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProductCard } from "../components/ProductCard";
import { TierSelector } from "../components/TierSelector";
import type { Product } from "../types/product";

export default function HomePage() {
  const [userTier, setUserTier] = useState<"premium" | "standard">("standard");
  const [products, setProducts] = useState<ReadonlyArray<Product>>([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products when tier changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch from API route with tier header
        const response = await fetch("/api/products", {
          headers: {
            "x-user-tier": userTier,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }

        const data = await response.json();
        setProducts(data.products);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch products",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [userTier]);

  // Fetch cart count on mount
  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const response = await fetch("/api/cart");
        if (response.ok) {
          const data = await response.json();
          const items = data.items ?? [];
          setCartCount(Array.isArray(items) ? items.length : 0);
        }
      } catch {
        // Silently fail - cart count is not critical
      }
    };

    fetchCartCount();
  }, []);

  // Handle adding product to cart
  const handleAddToCart = async (productId: number) => {
    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add to cart: ${response.status}`);
      }

      // Increment cart count
      setCartCount((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">
            Scenarist - Next.js App Router Example
          </h1>
          <p className="text-gray-600">
            E-commerce demo showcasing all Scenarist features with tier-based
            pricing
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <TierSelector currentTier={userTier} onTierChange={setUserTier} />

          <Link
            href="/cart"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>🛒</span>
            <span>Cart</span>
            <span
              aria-label="Cart item count"
              className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full"
            >
              {cartCount}
            </span>
          </Link>
        </div>

        {loading && (
          <div className="mt-8 text-center text-gray-600">
            Loading products...
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            Error: {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="mt-8 text-center text-gray-600">
            No products found.
          </div>
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
  );
}
