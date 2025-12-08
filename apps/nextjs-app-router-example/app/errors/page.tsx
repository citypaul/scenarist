/**
 * Errors Demo Page - React Server Component
 *
 * Demonstrates Next.js error boundary behavior with Scenarist.
 * When apiError scenario is active, this page throws an error
 * which is caught by error.tsx.
 *
 * @see https://github.com/citypaul/scenarist/issues/211
 */

import { headers } from "next/headers";
import { getScenaristHeadersFromReadonlyHeaders } from "@scenarist/nextjs-adapter/app";
import type { ErrorsResponse } from "../api/errors/route";

async function fetchErrorData(): Promise<ErrorsResponse> {
  const headersList = await headers();

  const response = await fetch("http://localhost:3002/api/errors", {
    headers: {
      ...getScenaristHeadersFromReadonlyHeaders(headersList),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Something went wrong while fetching data");
  }

  return response.json();
}

export default async function ErrorsPage() {
  const data = await fetchErrorData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Error Boundary Demo</h1>
        <p className="text-gray-600 mb-4">
          This page demonstrates error boundary recovery with Scenarist
          scenarios.
        </p>
      </div>

      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <h2 className="text-xl font-semibold text-green-800 mb-2">
          Error Demo Data
        </h2>
        <p className="text-green-700">{data.message}</p>
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Testing Error Boundaries</h2>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Default scenario:</strong> Shows success content (this
            view)
          </p>
          <p>
            <strong>apiError scenario:</strong> Triggers error boundary with
            retry option
          </p>
        </div>
      </div>
    </div>
  );
}
