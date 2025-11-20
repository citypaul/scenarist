/**
 * Test RSC Helper Page - Demonstrates need for getHeadersFromReadonlyHeaders
 *
 * This Server Component demonstrates the clean API we want for working with
 * ReadonlyHeaders from next/headers, without the awkward Request workaround.
 *
 * Currently FAILS because getHeadersFromReadonlyHeaders doesn't exist yet.
 * After implementation: Will use clean helper API.
 */

// CRITICAL: Import scenarist to ensure MSW starts before fetch calls
import { scenarist } from "@/lib/scenarist";
import { headers } from "next/headers";

type ProductsResponse = {
  readonly products: readonly {
    readonly id: number;
    readonly name: string;
    readonly price: number;
    readonly tier: string;
  }[];
};

type FetchResult =
  | { readonly success: true; readonly data: ProductsResponse }
  | { readonly success: false; readonly error: string };

const fetchProducts = async (
  headersList: Awaited<ReturnType<typeof headers>>
): Promise<FetchResult> => {
  try {
    // CLEAN API: Use ReadonlyHeaders directly (no fake Request needed)
    const scenaristHeaders = scenarist.getHeadersFromReadonlyHeaders(headersList);

    const response = await fetch("http://localhost:3001/products", {
      headers: {
        ...scenaristHeaders,
        "x-user-tier": "premium",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API returned ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
};

export default async function TestRSCHelperPage() {
  // Get headers for test ID propagation
  const headersList = await headers();
  const testId = headersList.get(scenarist.config.headers.testId) || "default-test";

  const fetchResult = await fetchProducts(headersList);

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Test RSC Helper</h1>

      <div style={{ marginTop: "20px", padding: "10px", background: "#f5f5f5" }}>
        <p>
          <strong>Test ID:</strong> {testId}
        </p>
        <p>
          <strong>Pattern:</strong> Using getHeadersFromReadonlyHeaders (clean API)
        </p>
      </div>

      {!fetchResult.success && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            background: "#ffebee",
            color: "#c62828",
          }}
        >
          <p>
            <strong>Error:</strong> {fetchResult.error}
          </p>
        </div>
      )}

      {fetchResult.success && (
        <div style={{ marginTop: "20px" }}>
          <h2>Products (Premium Pricing):</h2>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {fetchResult.data.products.map((product) => (
              <div
                key={product.id}
                style={{
                  padding: "10px",
                  background: "#e8f5e9",
                  borderRadius: "4px",
                  minWidth: "200px",
                }}
              >
                <p>
                  <strong>{product.name}</strong>
                </p>
                <p>Price: £{product.price.toFixed(2)}</p>
                <p>Tier: {product.tier}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
