/**
 * SlowProducts - Async Server Component for Streaming Demo
 *
 * This component is wrapped in a Suspense boundary by the parent page.
 * It demonstrates:
 * - Async data fetching in React Server Components
 * - How Suspense enables streaming (fallback shows while this resolves)
 * - Scenarist integration via test ID headers
 *
 * The "slow" in the name refers to the fact that this is an async component
 * that could take time to resolve. In tests, Scenarist provides instant mock
 * responses, but the Suspense pattern is still demonstrated.
 */

import { headers } from "next/headers";
import type { ProductsResponse } from "@/types/product";
import { getScenaristHeadersFromReadonlyHeaders } from "@scenarist/nextjs-adapter/app";

type SlowProductsProps = {
  readonly tier: string;
};

async function fetchProducts(tier: string): Promise<ProductsResponse> {
  const headersList = await headers();

  const response = await fetch("http://localhost:3002/api/products", {
    headers: {
      ...getScenaristHeadersFromReadonlyHeaders(headersList),
      "x-user-tier": tier,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  return response.json();
}

export default async function SlowProducts({ tier }: SlowProductsProps) {
  const data = await fetchProducts(tier);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {data.products.map((product) => (
        <article
          key={product.id}
          className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-blue-600">
              £{product.price.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500 uppercase">
              {product.tier}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
