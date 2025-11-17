/**
 * Hostname Matching Test Page
 *
 * Page that demonstrates the three URL pattern types:
 * 1. Pathname-only patterns (/api/data) - Origin-agnostic
 * 2. Full URL patterns (http://localhost:3001/api/data) - Hostname-specific
 * 3. Native RegExp patterns (/\/api\/data/) - Origin-agnostic
 *
 * Query params:
 * - test: Type of test to run
 * - userId: User ID for param extraction tests
 * - postId: Post ID for param extraction tests
 */

import type { GetServerSideProps } from "next";
import { scenarist } from "../lib/scenarist";

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
  readonly testType: string;
  readonly result: HostnameMatchingResponse | null;
  readonly error: string | null;
};

export default function HostnameMatchingPage({ testType, result, error }: PageProps) {
  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Hostname Matching Test: {testType}</h1>

      <div style={{ marginTop: "20px", padding: "10px", background: "#f5f5f5" }}>
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

export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
  const { query } = context;
  const testType = (query.test as string) || "unknown";
  const userId = (query.userId as string) || "123";
  const postId = (query.postId as string) || "456";

  // Get Scenarist headers for test ID propagation
  const scenaristHeaders = scenarist.getHeaders(context.req);

  let result: HostnameMatchingResponse | null = null;
  let error: string | null = null;

  try {
    switch (testType) {
      case "pathnameOnly": {
        // Test 1: Pathname-only pattern - should match ANY hostname
        const response = await fetch("http://localhost:3001/api/origin-agnostic", {
          headers: scenaristHeaders,
        });
        result = await response.json();
        break;
      }

      case "localhostFull": {
        // Test 2: Full URL with localhost - hostname-specific
        const response = await fetch("http://localhost:3001/api/localhost-only", {
          headers: scenaristHeaders,
        });
        result = await response.json();
        break;
      }

      case "externalFull": {
        // Test 3: Full URL with external domain - hostname-specific
        const response = await fetch("https://api.example.com/api/production-only", {
          headers: scenaristHeaders,
        });
        result = await response.json();
        break;
      }

      case "regexp": {
        // Test 4: Native RegExp pattern - origin-agnostic
        const response = await fetch("http://localhost:3001/api/regex-pattern", {
          headers: scenaristHeaders,
        });
        result = await response.json();
        break;
      }

      case "pathnameParams": {
        // Test 5: Pathname with path parameters - origin-agnostic + param extraction
        const response = await fetch(`http://localhost:3001/api/users/${userId}/posts/${postId}`, {
          headers: scenaristHeaders,
        });
        result = await response.json();
        break;
      }

      case "fullUrlParams": {
        // Test 6: Full URL with path parameters - hostname-specific + param extraction
        const response = await fetch(`http://localhost:3001/api/local-users/${userId}`, {
          headers: scenaristHeaders,
        });
        result = await response.json();
        break;
      }

      default:
        error = `Unknown test type: ${testType}`;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return {
    props: {
      testType,
      result,
      error,
    },
  };
};
