/**
 * Hostname Matching Test Page
 *
 * Server Component that demonstrates the three URL pattern types:
 * 1. Pathname-only patterns (/api/data) - Origin-agnostic
 * 2. Full URL patterns (http://localhost:3001/api/data) - Hostname-specific
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
import { headers } from "next/headers";

import { getScenaristHeadersFromReadonlyHeaders, SCENARIST_TEST_ID_HEADER } from '@scenarist/nextjs-adapter/app';

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

type FetchResult =
  | { readonly success: true; readonly data: HostnameMatchingResponse }
  | { readonly success: false; readonly error: string };

type PageProps = {
  readonly searchParams: Promise<{
    readonly test?: string;
    readonly userId?: string;
    readonly postId?: string;
  }>;
};

const fetchTestData = async (
  testType: string,
  userId: string,
  postId: string,
  headersList: Awaited<ReturnType<typeof headers>>
): Promise<FetchResult> => {
  try {
    switch (testType) {
      case "pathnameOnly": {
        // Test 1: Pathname-only pattern - should match ANY hostname
        const response = await fetch("http://localhost:3001/api/origin-agnostic", {
          headers: {
            ...getScenaristHeadersFromReadonlyHeaders(headersList),
          },
          cache: "no-store",
        });
        const data = await response.json();
        return { success: true, data };
      }

      case "localhostFull": {
        // Test 2: Full URL with localhost - hostname-specific
        const response = await fetch("http://localhost:3001/api/localhost-only", {
          headers: {
            ...getScenaristHeadersFromReadonlyHeaders(headersList),
          },
          cache: "no-store",
        });
        const data = await response.json();
        return { success: true, data };
      }

      case "externalFull": {
        // Test 3: Full URL with external domain - hostname-specific
        const response = await fetch("https://api.example.com/api/production-only", {
          headers: {
            ...getScenaristHeadersFromReadonlyHeaders(headersList),
          },
          cache: "no-store",
        });
        const data = await response.json();
        return { success: true, data };
      }

      case "regexp": {
        // Test 4: Native RegExp pattern - origin-agnostic
        const response = await fetch("http://localhost:3001/api/regex-pattern", {
          headers: {
            ...getScenaristHeadersFromReadonlyHeaders(headersList),
          },
          cache: "no-store",
        });
        const data = await response.json();
        return { success: true, data };
      }

      case "pathnameParams": {
        // Test 5: Pathname with path parameters - origin-agnostic + param extraction
        const response = await fetch(`http://localhost:3001/api/users/${userId}/posts/${postId}`, {
          headers: {
            ...getScenaristHeadersFromReadonlyHeaders(headersList),
          },
          cache: "no-store",
        });
        const data = await response.json();
        return { success: true, data };
      }

      case "fullUrlParams": {
        // Test 6: Full URL with path parameters - hostname-specific + param extraction
        const response = await fetch(`http://localhost:3001/api/local-users/${userId}`, {
          headers: {
            ...getScenaristHeadersFromReadonlyHeaders(headersList),
          },
          cache: "no-store",
        });
        const data = await response.json();
        return { success: true, data };
      }

      default:
        return { success: false, error: `Unknown test type: ${testType}` };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
};

export default async function HostnameMatchingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const testType = params.test || "unknown";
  const userId = params.userId || "123";
  const postId = params.postId || "456";

  // Get headers for test ID propagation
  const headersList = await headers();
  const testId = headersList.get(SCENARIST_TEST_ID_HEADER) || "default-test";

  const fetchResult = await fetchTestData(testType, userId, postId, headersList);

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Hostname Matching Test: {testType}</h1>

      <div style={{ marginTop: "20px", padding: "10px", background: "#f5f5f5" }}>
        <p><strong>Test ID:</strong> {testId}</p>
        <p><strong>Test Type:</strong> {testType}</p>
      </div>

      {!fetchResult.success && (
        <div style={{ marginTop: "20px", padding: "10px", background: "#ffebee", color: "#c62828" }}>
          <p><strong>Error:</strong> {fetchResult.error}</p>
        </div>
      )}

      {fetchResult.success && (
        <div style={{ marginTop: "20px" }}>
          <h2>Result:</h2>
          <div style={{ padding: "10px", background: "#e8f5e9" }}>
            <p><strong>Pattern Type:</strong> {fetchResult.data.patternType}</p>
            {fetchResult.data.hostname && <p><strong>Hostname:</strong> {fetchResult.data.hostname}</p>}
            <p><strong>Behavior:</strong> {fetchResult.data.behavior}</p>
            <p><strong>Message:</strong> {fetchResult.data.message}</p>

            {fetchResult.data.userId && <p><strong>User ID:</strong> {fetchResult.data.userId}</p>}
            {fetchResult.data.postId && <p><strong>Post ID:</strong> {fetchResult.data.postId}</p>}

            {fetchResult.data.examples && (
              <div>
                <p><strong>Examples:</strong></p>
                <ul>
                  {fetchResult.data.examples.map((example, i) => (
                    <li key={i}>{example}</li>
                  ))}
                </ul>
              </div>
            )}

            {fetchResult.data.willMatch && (
              <p><strong>Will Match:</strong> {fetchResult.data.willMatch}</p>
            )}

            {fetchResult.data.wontMatch && (
              <div>
                <p><strong>Won't Match:</strong></p>
                {Array.isArray(fetchResult.data.wontMatch) ? (
                  <ul>
                    {fetchResult.data.wontMatch.map((url, i) => (
                      <li key={i}>{url}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{fetchResult.data.wontMatch}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
