/**
 * URL Matching Test Page
 *
 * Server Component that tests URL matching strategies by making
 * fetch calls to external APIs with different URL patterns.
 *
 * Query params:
 * - test: Type of test (numericId, contains, startsWith, endsWith, combined, exact)
 * - userId: User ID for numericId/exact tests
 * - city: City name for contains/startsWith tests
 * - version: API version for startsWith tests
 * - filename: Filename for endsWith tests
 * - apiVersion: API version header for combined tests
 */

// CRITICAL: Import scenarist to ensure MSW starts before fetch calls
import { scenarist } from "@/lib/scenarist";
import { headers } from "next/headers";

type User = {
  readonly login: string;
  readonly id: number;
  readonly name: string;
  readonly bio: string;
  readonly public_repos: number;
  readonly followers: number;
  readonly matchedBy: string;
};

type Weather = {
  readonly city: string;
  readonly temperature: number;
  readonly conditions: string;
  readonly humidity: number;
  readonly matchedBy: string;
};

type FileInfo = {
  readonly type: string;
  readonly name: string;
  readonly path: string;
  readonly content: string;
  readonly matchedBy: string;
};

type Charge = {
  readonly id: string;
  readonly status: string;
  readonly amount: number;
  readonly currency: string;
  readonly matchedBy: string;
};

type PathParamUser = {
  readonly userId: string;
  readonly login: string;
  readonly name: string;
  readonly bio: string;
  readonly matchedBy: string;
};

type MultipleParams = {
  readonly userId: string;
  readonly postId: string;
  readonly title: string;
  readonly content: string;
  readonly author: string;
  readonly matchedBy: string;
};

type OptionalFile = {
  readonly filename: string;
  readonly path: string;
  readonly exists: boolean;
  readonly matchedBy: string;
};

type RepeatingPath = {
  readonly path: string | readonly string[];
  readonly segments: number | string;
  readonly fullPath: string;
  readonly matchedBy: string;
};

type CustomRegexOrder = {
  readonly orderId: string;
  readonly status: string;
  readonly total: number;
  readonly matchedBy: string;
};

type TestResult = User | Weather | FileInfo | Charge | PathParamUser | MultipleParams | OptionalFile | RepeatingPath | CustomRegexOrder;

type FetchResult =
  | { readonly success: true; readonly data: TestResult }
  | { readonly success: false; readonly error: string };

const fetchTestData = async (
  test: string,
  params: Record<string, string | undefined>,
  scenaristHeaders: Record<string, string>
): Promise<FetchResult> => {
  try {
    switch (test) {
      case "numericId":
      case "exact": {
        // Test 1 & 6: Numeric ID pattern / Exact match
        const userId = params.userId || "123";
        const response = await fetch(
          `http://localhost:3001/api/users/${userId}`,
          {
            headers: scenaristHeaders,
            cache: "no-store",
          }
        );
        const data = (await response.json()) as User;
        return { success: true, data };
      }

      case "contains": {
        // Test 2: Contains strategy
        const city = params.city || "london";
        const response = await fetch(
          `http://localhost:3001/api/weather/v1/${city}`,
          {
            headers: scenaristHeaders,
            cache: "no-store",
          }
        );
        const data = (await response.json()) as Weather;
        return { success: true, data };
      }

      case "startsWith": {
        // Test 3: StartsWith strategy
        const version = params.version || "v2";
        const city = params.city || "newyork";
        const response = await fetch(
          `http://localhost:3001/api/weather/${version}/${city}`,
          {
            headers: scenaristHeaders,
            cache: "no-store",
          }
        );
        const data = (await response.json()) as Weather;
        return { success: true, data };
      }

      case "endsWith": {
        // Test 4: EndsWith strategy
        const filename = params.filename || "data.json";
        const response = await fetch(
          `http://localhost:3001/api/files/${filename}`,
          {
            headers: scenaristHeaders,
            cache: "no-store",
          }
        );
        const data = (await response.json()) as FileInfo;
        return { success: true, data };
      }

      case "combined": {
        // Test 5: Combined URL + header match
        const apiVersion = params.apiVersion || "2023-10-16";
        const response = await fetch("http://localhost:3001/api/charges", {
          method: "POST",
          headers: {
            ...scenaristHeaders,
            "Content-Type": "application/json",
            "x-api-version": apiVersion,
          },
          body: JSON.stringify({}),
          cache: "no-store",
        });
        const data = (await response.json()) as Charge;
        return { success: true, data };
      }

      case "pathParam": {
        // Test 7: Simple path parameter extraction
        const userId = params.userId || "123";
        const response = await fetch(
          `http://localhost:3001/api/user-param/${userId}`,
          {
            headers: scenaristHeaders,
            cache: "no-store",
          }
        );
        const data = (await response.json()) as PathParamUser;
        return { success: true, data };
      }

      case "multipleParams": {
        // Test 8: Multiple path parameters
        const userId = params.userId || "alice";
        const postId = params.postId || "42";
        const response = await fetch(
          `http://localhost:3001/api/users/${userId}/posts/${postId}`,
          {
            headers: scenaristHeaders,
            cache: "no-store",
          }
        );
        const data = (await response.json()) as MultipleParams;
        return { success: true, data };
      }

      case "optional": {
        // Test 9: Optional path parameter
        const filename = params.filename || "";
        const url = filename
          ? `http://localhost:3001/api/file-optional/${filename}`
          : `http://localhost:3001/api/file-optional`;
        const response = await fetch(url, {
          headers: scenaristHeaders,
          cache: "no-store",
        });
        const data = (await response.json()) as OptionalFile;
        return { success: true, data };
      }

      case "repeating": {
        // Test 10: Repeating path parameter (array)
        const path = params.path || "folder/subfolder/file.txt";
        const response = await fetch(
          `http://localhost:3001/api/paths/${path}`,
          {
            headers: scenaristHeaders,
            cache: "no-store",
          }
        );
        const data = (await response.json()) as RepeatingPath;
        return { success: true, data };
      }

      case "customRegex": {
        // Test 11: Custom regex parameter (numeric only)
        const orderId = params.orderId || "12345";
        const response = await fetch(
          `http://localhost:3001/api/orders/${orderId}`,
          {
            headers: scenaristHeaders,
            cache: "no-store",
          }
        );
        const data = (await response.json()) as CustomRegexOrder;
        return { success: true, data };
      }

      default:
        return { success: false, error: `Unknown test type: ${test}` };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
};

export default async function URLMatchingPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const test = params.test || "numericId";

  // Get Scenarist headers for test ID propagation
  const headersList = await headers();
  const scenaristHeaders = scenarist.getHeadersFromReadonlyHeaders(headersList);

  const fetchResult = await fetchTestData(test, params, scenaristHeaders);

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">URL Matching Test Page</h1>
      <p className="mb-4">Test: {test}</p>

      {!fetchResult.success && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {fetchResult.error}
        </div>
      )}

      {fetchResult.success && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Result</h2>

          {/* Common field: matchedBy */}
          {"matchedBy" in fetchResult.data && (
            <p className="mb-2">
              <strong>Matched By:</strong> {fetchResult.data.matchedBy}
            </p>
          )}

          {/* User fields */}
          {"login" in fetchResult.data && (
            <>
              <p className="mb-2">
                <strong>Login:</strong> {fetchResult.data.login}
              </p>
              {"id" in fetchResult.data && (
                <p className="mb-2">
                  <strong>ID:</strong> {fetchResult.data.id}
                </p>
              )}
              {"userId" in fetchResult.data && (
                <p className="mb-2">
                  <strong>User ID:</strong> {fetchResult.data.userId}
                </p>
              )}
              <p className="mb-2">
                <strong>Name:</strong> {fetchResult.data.name}
              </p>
              <p className="mb-2">
                <strong>Bio:</strong> {fetchResult.data.bio}
              </p>
              {"public_repos" in fetchResult.data && (
                <p className="mb-2">
                  <strong>Public Repos:</strong> {fetchResult.data.public_repos}
                </p>
              )}
              {"followers" in fetchResult.data && (
                <p className="mb-2">
                  <strong>Followers:</strong> {fetchResult.data.followers}
                </p>
              )}
            </>
          )}

          {/* Weather fields */}
          {"city" in fetchResult.data && (
            <>
              <p className="mb-2">
                <strong>City:</strong> {fetchResult.data.city}
              </p>
              <p className="mb-2">
                <strong>Temperature:</strong> {fetchResult.data.temperature}
              </p>
              <p className="mb-2">
                <strong>Conditions:</strong> {fetchResult.data.conditions}
              </p>
              <p className="mb-2">
                <strong>Humidity:</strong> {fetchResult.data.humidity}
              </p>
            </>
          )}

          {/* File fields */}
          {"type" in fetchResult.data && (
            <>
              <p className="mb-2">
                <strong>Type:</strong> {fetchResult.data.type}
              </p>
              <p className="mb-2">
                <strong>Name:</strong> {fetchResult.data.name}
              </p>
              <p className="mb-2">
                <strong>Path:</strong> {fetchResult.data.path}
              </p>
              <p className="mb-2">
                <strong>Content:</strong> {fetchResult.data.content}
              </p>
            </>
          )}

          {/* Charge fields */}
          {"amount" in fetchResult.data && (
            <>
              <p className="mb-2">
                <strong>ID:</strong> {fetchResult.data.id}
              </p>
              <p className="mb-2">
                <strong>Status:</strong> {fetchResult.data.status}
              </p>
              <p className="mb-2">
                <strong>Amount:</strong> {fetchResult.data.amount}
              </p>
              <p className="mb-2">
                <strong>Currency:</strong> {fetchResult.data.currency}
              </p>
            </>
          )}

          {/* Path Parameter User fields */}
          {"userId" in fetchResult.data && !("postId" in fetchResult.data) && (
            <>
              <p className="mb-2">
                <strong>User ID:</strong> {fetchResult.data.userId}
              </p>
              <p className="mb-2">
                <strong>Login:</strong> {fetchResult.data.login}
              </p>
              <p className="mb-2">
                <strong>Name:</strong> {fetchResult.data.name}
              </p>
              <p className="mb-2">
                <strong>Bio:</strong> {fetchResult.data.bio}
              </p>
            </>
          )}

          {/* Multiple Params fields */}
          {"postId" in fetchResult.data && (
            <>
              <p className="mb-2">
                <strong>User ID:</strong> {fetchResult.data.userId}
              </p>
              <p className="mb-2">
                <strong>Post ID:</strong> {fetchResult.data.postId}
              </p>
              <p className="mb-2">
                <strong>Title:</strong> {fetchResult.data.title}
              </p>
              <p className="mb-2">
                <strong>Content:</strong> {fetchResult.data.content}
              </p>
              <p className="mb-2">
                <strong>Author:</strong> {fetchResult.data.author}
              </p>
            </>
          )}

          {/* Optional File fields */}
          {"filename" in fetchResult.data && (
            <>
              <p className="mb-2">
                <strong>Filename:</strong> {fetchResult.data.filename || "default.txt"}
              </p>
              <p className="mb-2">
                <strong>Path:</strong> {fetchResult.data.path || "/file-optional/default.txt"}
              </p>
              <p className="mb-2">
                <strong>Exists:</strong> {fetchResult.data.exists ? "Yes" : "No"}
              </p>
            </>
          )}

          {/* Repeating Path fields */}
          {"segments" in fetchResult.data && (
            <>
              <p className="mb-2">
                <strong>Path:</strong> {Array.isArray(fetchResult.data.path)
                  ? fetchResult.data.path.join("/")
                  : fetchResult.data.path}
              </p>
              <p className="mb-2">
                <strong>Segments:</strong> {fetchResult.data.segments}
              </p>
              <p className="mb-2">
                <strong>Full Path:</strong> {fetchResult.data.fullPath}
              </p>
            </>
          )}

          {/* Custom Regex Order fields */}
          {"orderId" in fetchResult.data && (
            <>
              <p className="mb-2">
                <strong>Order ID:</strong> {fetchResult.data.orderId}
              </p>
              <p className="mb-2">
                <strong>Status:</strong> {fetchResult.data.status}
              </p>
              <p className="mb-2">
                <strong>Total:</strong> ${fetchResult.data.total}
              </p>
            </>
          )}

          {/* Raw JSON for debugging */}
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">
              Raw Response
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
              {JSON.stringify(fetchResult.data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </main>
  );
}
