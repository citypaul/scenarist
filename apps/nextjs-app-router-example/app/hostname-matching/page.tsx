/**
 * Hostname Matching Test Page
 *
 * Server Component that demonstrates the three URL pattern types:
 * 1. Pathname-only patterns (/api/data) - Origin-agnostic
 * 2. Full URL patterns (http://localhost:3002/api/data) - Hostname-specific
 * 3. Native RegExp patterns (/\/api\/data/) - Origin-agnostic
 *
 * Query params:
 * - test: Type of test to run:
 *   - pathnameOnly: Test pathname-only pattern (origin-agnostic)
 *   - localhostFull: Test full URL with localhost (hostname-specific)
 *   - externalFull: Test full URL with external domain (hostname-specific)
 *   - regexp: Test native RegExp pattern (origin-agnostic)
 *   - pathnameParams: Test pathname with path parameters
 *   - fullUrlParams: Test full URL with path parameters
 */

// CRITICAL: Import scenarist to ensure MSW starts before fetch calls
import { scenarist } from "@/lib/scenarist";
import { headers } from "next/headers";

type HostnameMatchingResponse = {
  readonly patternType: string;
  readonly hostname?: string;
  readonly behavior: string;
  readonly message: string;
  readonly examples?: readonly string[];
  readonly willMatch?: string;
  readonly wontMatch?: readonly string[] | string;
  readonly userId?: string;
  readonly postId?: string;
};

type PageProps = {
  readonly searchParams: Promise<{
    readonly test?: string;
    readonly userId?: string;
    readonly postId?: string;
  }>;
};

export default async function HostnameMatchingPage({ searchParams }: PageProps) {
  // Force scenarist import to be used (ensures MSW starts)
  void scenarist;

  // Get headers for logging/debugging
  const headersList = await headers();
  const testId = headersList.get("x-test-id") || "no-test-id";

  const params = await searchParams;
  const testType = params.test || "unknown";
  const userId = params.userId || "123";
  const postId = params.postId || "456";

  let result: HostnameMatchingResponse | null = null;
  let error: string | null = null;

  try {
    switch (testType) {
      case "pathnameOnly": {
        // Test 1: Pathname-only pattern - should match ANY hostname
        const response = await fetch("http://localhost:3002/api/origin-agnostic");
        result = await response.json();
        break;
      }

      case "localhostFull": {
        // Test 2: Full URL with localhost - hostname-specific
        const response = await fetch("http://localhost:3002/api/localhost-only");
        result = await response.json();
        break;
      }

      case "externalFull": {
        // Test 3: Full URL with external domain - hostname-specific
        const response = await fetch("https://api.example.com/api/production-only");
        result = await response.json();
        break;
      }

      case "regexp": {
        // Test 4: Native RegExp pattern - origin-agnostic
        const response = await fetch("http://localhost:3002/api/regex-pattern");
        result = await response.json();
        break;
      }

      case "pathnameParams": {
        // Test 5: Pathname with path parameters - origin-agnostic + param extraction
        const response = await fetch(`http://localhost:3002/api/users/${userId}/posts/${postId}`);
        result = await response.json();
        break;
      }

      case "fullUrlParams": {
        // Test 6: Full URL with path parameters - hostname-specific + param extraction
        const response = await fetch(`http://localhost:3002/api/local-users/${userId}`);
        result = await response.json();
        break;
      }

      default:
        error = `Unknown test type: ${testType}`;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Hostname Matching Test: {testType}</h1>

      <div style={{ marginTop: "20px", padding: "10px", background: "#f5f5f5" }}>
        <p><strong>Test ID:</strong> {testId}</p>
        <p><strong>Test Type:</strong> {testType}</p>
      </div>

      {error && (
        <div style={{ marginTop: "20px", padding: "10px", background: "#ffebee", color: "#c62828" }}>
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h2>Result:</h2>
          <div style={{ padding: "10px", background: "#e8f5e9" }}>
            <p><strong>Pattern Type:</strong> {result.patternType}</p>
            {result.hostname && <p><strong>Hostname:</strong> {result.hostname}</p>}
            <p><strong>Behavior:</strong> {result.behavior}</p>
            <p><strong>Message:</strong> {result.message}</p>

            {result.userId && <p><strong>User ID:</strong> {result.userId}</p>}
            {result.postId && <p><strong>Post ID:</strong> {result.postId}</p>}

            {result.examples && (
              <div>
                <p><strong>Examples:</strong></p>
                <ul>
                  {result.examples.map((example, i) => (
                    <li key={i}>{example}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.willMatch && (
              <p><strong>Will Match:</strong> {result.willMatch}</p>
            )}

            {result.wontMatch && (
              <div>
                <p><strong>Won't Match:</strong></p>
                {Array.isArray(result.wontMatch) ? (
                  <ul>
                    {result.wontMatch.map((url, i) => (
                      <li key={i}>{url}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{result.wontMatch}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
