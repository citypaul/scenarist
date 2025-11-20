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

type Product = {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly tier: string;
};

type User = {
  readonly id: number;
  readonly email: string;
  readonly role: string;
};

type StrategyResult =
  | {
      readonly success: true;
      readonly data: {
        readonly products?: ReadonlyArray<Product>;
        readonly valid?: boolean;
        readonly keyType?: string;
        readonly users?: ReadonlyArray<User>;
        readonly status?: string;
        readonly message?: string;
        readonly matchedBy?: string;
      };
    }
  | {
      readonly success: false;
      readonly error: string;
    };

const fetchStrategyResult = async (
  strategy: string | undefined,
  params: {
    readonly campaign?: string;
    readonly apiKey?: string;
    readonly email?: string;
    readonly exact?: string;
  },
  scenaristHeaders: Record<string, string>
): Promise<StrategyResult> => {
  try {
    switch (strategy) {
      case "contains": {
        const response = await fetch("http://localhost:3001/products", {
          headers: {
            ...scenaristHeaders,
            "x-campaign": params.campaign || "",
          },
        });
        const data = await response.json();
        return { success: true, data };
      }

      case "startsWith": {
        const response = await fetch("http://localhost:3001/api-keys", {
          headers: {
            ...scenaristHeaders,
            "x-api-key": params.apiKey || "",
          },
        });
        const data = await response.json();
        return { success: true, data };
      }

      case "endsWith": {
        const response = await fetch(
          `http://localhost:3001/users?email=${params.email || ""}`,
          {
            headers: scenaristHeaders,
          }
        );
        const data = await response.json();
        return { success: true, data };
      }

      case "equals": {
        const response = await fetch("http://localhost:3001/status", {
          headers: {
            ...scenaristHeaders,
            "x-exact": params.exact || "",
          },
        });
        const data = await response.json();
        return { success: true, data };
      }

      default:
        return { success: false, error: "No strategy specified" };
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
};

export default async function StringMatchingPage({ searchParams }: Props) {
  const { strategy, campaign, apiKey, email, exact } = await searchParams;

  // Get test ID headers for MSW scenario lookup
  const headersList = await headers();

  const result = await fetchStrategyResult(
    strategy,
    { campaign, apiKey, email, exact },
    scenarist.getHeadersFromReadonlyHeaders(headersList)
  );

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

      {!result.success && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{result.error}</p>
        </div>
      )}

      {result.success && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Result</h2>

          {result.data.matchedBy && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded">
              <p className="font-bold text-green-700">
                Matched By: {result.data.matchedBy}
              </p>
            </div>
          )}

          {strategy === "contains" && result.data.products && (
            <div>
              <h3 className="font-semibold mb-2">Products (Premium Tier)</h3>
              <div className="space-y-2">
                {result.data.products.map((product) => (
                  <div key={product.id} className="p-2 bg-white rounded">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-lg">£{product.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Tier: {product.tier}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {strategy === "startsWith" && result.data.valid !== undefined && (
            <div>
              <h3 className="font-semibold mb-2">API Key Validation</h3>
              <p>Valid: {result.data.valid ? "✅ Yes" : "❌ No"}</p>
              {result.data.keyType && <p>Key Type: {result.data.keyType}</p>}
            </div>
          )}

          {strategy === "endsWith" && result.data.users && (
            <div>
              <h3 className="font-semibold mb-2">Company Users</h3>
              <div className="space-y-2">
                {result.data.users.map((user) => (
                  <div key={user.id} className="p-2 bg-white rounded">
                    <p className="font-semibold">{user.email}</p>
                    <p className="text-sm text-gray-600">Role: {user.role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {strategy === "equals" && result.data.status && (
            <div>
              <h3 className="font-semibold mb-2">Status Check</h3>
              <p>Status: {result.data.status}</p>
              {result.data.message && <p>Message: {result.data.message}</p>}
            </div>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">
              Raw Response
            </summary>
            <pre className="mt-2 p-2 bg-white rounded overflow-x-auto text-xs">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
