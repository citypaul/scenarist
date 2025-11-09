/**
 * Products Page - React Server Component
 *
 * This demonstrates testing React Server Components with Scenarist:
 * - Async server component (runs on server only)
 * - Fetches data from external API (mocked by Scenarist)
 * - NO Jest needed - tested with Playwright + Scenarist
 * - Proves Scenarist solves the RSC testing pain point
 *
 * From Next.js docs:
 * > "Since async Server Components are new to the React ecosystem, some tools
 * > do not fully support them. In the meantime, we recommend using End-to-End
 * > Testing over Unit Testing for async components."
 *
 * Traditional approach: ❌ Jest doesn't support RSC
 * Scenarist approach: ✅ Playwright + scenario switching
 */

import { headers } from 'next/headers';
import type { ProductsResponse } from '@/types/product';

type ProductsPageProps = {
  searchParams: Promise<{ tier?: string }>;
};

async function fetchProducts(tier: string = 'standard'): Promise<ProductsResponse> {
  // Get test ID from incoming page request headers
  // Playwright sets this header when navigating to the page
  const headersList = await headers();
  const testId = headersList.get('x-test-id');

  // Fetch from local API route, passing through test ID for Scenarist
  const fetchHeaders: HeadersInit = {
    'x-user-tier': tier, // Application header for tier-based matching
  };

  // Include test ID if present (from Playwright test)
  if (testId) {
    fetchHeaders['x-test-id'] = testId;
  }

  const response = await fetch('http://localhost:3002/api/products', {
    headers: fetchHeaders,
    cache: 'no-store', // Disable Next.js caching for demo
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  return response.json();
}

/**
 * React Server Component
 *
 * This is an ASYNC component that runs ONLY on the server.
 * Jest cannot test this - throws: "Objects are not valid as a React child"
 * Scenarist + Playwright CAN test this - works perfectly!
 */
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { tier = 'standard' } = await searchParams;
  const data = await fetchProducts(tier);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Products (React Server Component)
        </h1>
        <p className="text-gray-600 mb-4">
          This page demonstrates testing React Server Components with Scenarist.
          The data is fetched on the server and mocked by Scenarist scenarios.
        </p>
        <div className="flex gap-4 mb-4">
          <a
            href="/products?tier=premium"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Premium Tier
          </a>
          <a
            href="/products?tier=standard"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Standard Tier
          </a>
        </div>
        <p className="text-sm text-gray-500">
          <strong>Current tier:</strong> {tier}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.products.map((product) => (
          <div
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
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Testing RSC with Scenarist</h2>
        <div className="space-y-2 text-sm">
          <p>
            <strong>❌ Traditional (Jest):</strong>
            <code className="ml-2 bg-gray-200 px-2 py-1 rounded">
              render(&lt;ProductsPage /&gt;) // Error: Objects are not valid as a React child
            </code>
          </p>
          <p>
            <strong>✅ Scenarist (Playwright):</strong>
            <code className="ml-2 bg-gray-200 px-2 py-1 rounded">
              await setScenario('premiumUser'); await page.goto('/products?tier=premium');
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
