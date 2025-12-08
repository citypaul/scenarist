/**
 * Streaming Page - React Server Components with Suspense
 *
 * This page demonstrates testing React Server Components that use Suspense
 * for streaming. The key features:
 *
 * 1. Suspense boundary wraps async server component
 * 2. Fallback UI streams immediately to the client
 * 3. Async component streams when ready, replacing fallback
 * 4. Scenarist mocks the API for predictable testing
 *
 * Architecture:
 * - page.tsx: Synchronous shell with Suspense boundary
 * - slow-products.tsx: Async RSC that fetches data
 *
 * Testing with Scenarist:
 * - switchScenario('streaming') activates mocks
 * - Tests can verify fallback shows initially
 * - Tests can verify products render after Suspense resolves
 */

import { Suspense } from "react";
import SlowProducts from "./slow-products";

type StreamingPageProps = {
  searchParams: Promise<{ tier?: string }>;
};

function ProductsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
      aria-label="Loading products"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-6 shadow-sm animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-3/4" />
          <div className="h-4 bg-gray-200 rounded mb-2" />
          <div className="h-4 bg-gray-200 rounded mb-4 w-5/6" />
          <div className="flex justify-between items-center">
            <div className="h-8 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function StreamingPage({
  searchParams,
}: StreamingPageProps) {
  const { tier = "standard" } = await searchParams;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Streaming (React Server Component)
        </h1>
        <p className="text-gray-600 mb-4">
          This page demonstrates Suspense boundaries with React Server
          Components. The product list is wrapped in a Suspense boundary - you
          would see a loading skeleton while the data fetches.
        </p>
        <div className="flex gap-4 mb-4">
          <a
            href="/streaming?tier=premium"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Premium Tier
          </a>
          <a
            href="/streaming?tier=standard"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Standard Tier
          </a>
        </div>
        <p className="text-sm text-gray-500">
          <strong>Current tier:</strong> {tier}
        </p>
      </div>

      <Suspense fallback={<ProductsSkeleton />}>
        <SlowProducts tier={tier} />
      </Suspense>

      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">
          How Streaming Works
        </h2>
        <div className="space-y-2 text-sm">
          <p>
            <strong>1. Initial Response:</strong> The shell (heading, nav)
            streams immediately along with the loading skeleton.
          </p>
          <p>
            <strong>2. Suspense Fallback:</strong> The skeleton shows while
            SlowProducts component fetches data.
          </p>
          <p>
            <strong>3. Streaming Update:</strong> When data is ready, React
            streams the actual products, replacing the skeleton.
          </p>
        </div>
      </div>
    </div>
  );
}
