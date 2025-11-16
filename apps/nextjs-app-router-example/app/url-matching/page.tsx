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

type TestResult = User | Weather | FileInfo | Charge;

export default async function URLMatchingPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const test = params.test || "numericId";

  // Get Scenarist headers for test ID propagation
  const headersList = await headers();
  const mockRequest = new Request("http://localhost:3001", {
    headers: headersList,
  });
  const scenaristHeaders = scenarist.getHeaders(mockRequest);

  let result: TestResult | null = null;
  let error: string | null = null;

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
        result = (await response.json()) as User;
        break;
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
        result = (await response.json()) as Weather;
        break;
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
        result = (await response.json()) as Weather;
        break;
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
        result = (await response.json()) as FileInfo;
        break;
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
        result = (await response.json()) as Charge;
        break;
      }

      default:
        error = `Unknown test type: ${test}`;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">URL Matching Test Page</h1>
      <p className="mb-4">Test: {test}</p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Result</h2>

          {/* Common field: matchedBy */}
          {"matchedBy" in result && (
            <p className="mb-2">
              <strong>Matched By:</strong> {result.matchedBy}
            </p>
          )}

          {/* User fields */}
          {"login" in result && (
            <>
              <p className="mb-2">
                <strong>Login:</strong> {result.login}
              </p>
              <p className="mb-2">
                <strong>ID:</strong> {result.id}
              </p>
              <p className="mb-2">
                <strong>Name:</strong> {result.name}
              </p>
              <p className="mb-2">
                <strong>Bio:</strong> {result.bio}
              </p>
              <p className="mb-2">
                <strong>Public Repos:</strong> {result.public_repos}
              </p>
              <p className="mb-2">
                <strong>Followers:</strong> {result.followers}
              </p>
            </>
          )}

          {/* Weather fields */}
          {"city" in result && (
            <>
              <p className="mb-2">
                <strong>City:</strong> {result.city}
              </p>
              <p className="mb-2">
                <strong>Temperature:</strong> {result.temperature}
              </p>
              <p className="mb-2">
                <strong>Conditions:</strong> {result.conditions}
              </p>
              <p className="mb-2">
                <strong>Humidity:</strong> {result.humidity}
              </p>
            </>
          )}

          {/* File fields */}
          {"type" in result && (
            <>
              <p className="mb-2">
                <strong>Type:</strong> {result.type}
              </p>
              <p className="mb-2">
                <strong>Name:</strong> {result.name}
              </p>
              <p className="mb-2">
                <strong>Path:</strong> {result.path}
              </p>
              <p className="mb-2">
                <strong>Content:</strong> {result.content}
              </p>
            </>
          )}

          {/* Charge fields */}
          {"amount" in result && (
            <>
              <p className="mb-2">
                <strong>ID:</strong> {result.id}
              </p>
              <p className="mb-2">
                <strong>Status:</strong> {result.status}
              </p>
              <p className="mb-2">
                <strong>Amount:</strong> {result.amount}
              </p>
              <p className="mb-2">
                <strong>Currency:</strong> {result.currency}
              </p>
            </>
          )}

          {/* Raw JSON for debugging */}
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">
              Raw Response
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </main>
  );
}
