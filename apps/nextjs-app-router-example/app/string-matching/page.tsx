/**
 * String Matching Test Page - ATDD
 *
 * This page tests all string matching strategies by making API calls with
 * different headers and query params. The Playwright tests will verify
 * that the correct responses are returned based on the matching strategy.
 *
 * Expected to fail until Phase 2 implementation is complete.
 */

import { headers } from "next/headers";
import { scenarist } from "@/lib/scenarist";

type Props = {
  searchParams: Promise<{
    strategy?: string;
    campaign?: string;
    apiKey?: string;
    email?: string;
    exact?: string;
  }>;
};

export default async function StringMatchingPage({ searchParams }: Props) {
  const { strategy, campaign, apiKey, email, exact } = await searchParams;

  // Get test ID headers for MSW scenario lookup
  const headersList = await headers();
  const mockRequest = new Request("http://localhost:3002", {
    headers: headersList,
  });

  let result: any = null;
  let error: string | null = null;

  try {
    switch (strategy) {
      case "contains": {
        // Test contains strategy - header value contains 'premium'
        const response = await fetch("http://localhost:3001/products", {
          headers: {
            ...scenarist.getHeaders(mockRequest),
            "x-campaign": campaign || "",
          },
        });
        result = await response.json();
        break;
      }

      case "startsWith": {
        // Test startsWith strategy - header value starts with 'sk_'
        const response = await fetch("http://localhost:3001/api-keys", {
          headers: {
            ...scenarist.getHeaders(mockRequest),
            "x-api-key": apiKey || "",
          },
        });
        result = await response.json();
        break;
      }

      case "endsWith": {
        // Test endsWith strategy - query param ends with '@company.com'
        const response = await fetch(
          `http://localhost:3001/users?email=${email || ""}`,
          {
            headers: scenarist.getHeaders(mockRequest),
          }
        );
        result = await response.json();
        break;
      }

      case "equals": {
        // Test equals strategy - header value exactly matches
        const response = await fetch("http://localhost:3001/status", {
          headers: {
            ...scenarist.getHeaders(mockRequest),
            "x-exact": exact || "",
          },
        });
        result = await response.json();
        break;
      }

      default:
        error = "No strategy specified";
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">String Matching Strategies</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test Parameters</h2>
        <ul className="list-disc pl-6">
          <li>Strategy: {strategy || "none"}</li>
          <li>Campaign: {campaign || "n/a"}</li>
          <li>API Key: {apiKey || "n/a"}</li>
          <li>Email: {email || "n/a"}</li>
          <li>Exact: {exact || "n/a"}</li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Result</h2>

          {result.matchedBy && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded">
              <p className="font-bold text-green-700">
                Matched By: {result.matchedBy}
              </p>
            </div>
          )}

          {strategy === "contains" && result.products && (
            <div>
              <h3 className="font-semibold mb-2">Products (Premium Tier)</h3>
              <div className="space-y-2">
                {result.products.map((product: any) => (
                  <div key={product.id} className="p-2 bg-white rounded">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-lg">£{product.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Tier: {product.tier}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {strategy === "startsWith" && result.valid !== undefined && (
            <div>
              <h3 className="font-semibold mb-2">API Key Validation</h3>
              <p>Valid: {result.valid ? "✅ Yes" : "❌ No"}</p>
              {result.keyType && <p>Key Type: {result.keyType}</p>}
            </div>
          )}

          {strategy === "endsWith" && result.users && (
            <div>
              <h3 className="font-semibold mb-2">Company Users</h3>
              <div className="space-y-2">
                {result.users.map((user: any) => (
                  <div key={user.id} className="p-2 bg-white rounded">
                    <p className="font-semibold">{user.email}</p>
                    <p className="text-sm text-gray-600">Role: {user.role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {strategy === "equals" && result.status && (
            <div>
              <h3 className="font-semibold mb-2">Status Check</h3>
              <p>Status: {result.status}</p>
              {result.message && <p>Message: {result.message}</p>}
            </div>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">
              Raw Response
            </summary>
            <pre className="mt-2 p-2 bg-white rounded overflow-x-auto text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
