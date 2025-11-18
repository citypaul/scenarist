/**
 * URL Matching Test Page
 *
 * Page that tests URL matching strategies by making
 * getServerSideProps fetch calls to external APIs with different URL patterns.
 *
 * Query params:
 * - test: Type of test (numericId, contains, startsWith, endsWith, combined, exact)
 * - userId: User ID for numericId/exact tests
 * - city: City name for contains/startsWith tests
 * - version: API version for startsWith tests
 * - filename: Filename for endsWith tests
 * - apiVersion: API version header for combined tests
 */

import type { GetServerSideProps } from "next";
import Head from "next/head";
import { scenarist } from "../lib/scenarist";

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

type Post = {
  readonly userId: string;
  readonly postId: string;
  readonly title: string;
};

type OptionalFile = {
  readonly filename: string;
  readonly exists: boolean;
};

type NestedPath = {
  readonly path: string;
  readonly segments: number;
};

type Order = {
  readonly orderId: string;
  readonly status: string;
  readonly items: ReadonlyArray<unknown>;
};

type TestResult = User | Weather | FileInfo | Charge | Post | OptionalFile | NestedPath | Order;

type FetchResult =
  | { readonly success: true; readonly data: TestResult }
  | { readonly success: false; readonly error: string };

type PageProps = {
  readonly test: string;
  readonly result: FetchResult;
};

const fetchTestData = async (
  test: string,
  query: Record<string, string | string[] | undefined>,
  scenaristHeaders: Record<string, string>
): Promise<FetchResult> => {
  const getString = (val: string | string[] | undefined): string =>
    Array.isArray(val) ? val[0] : val || "";

  try {
    switch (test) {
      case "numericId":
      case "exact": {
        const userId = getString(query.userId) || "123";
        const response = await fetch(
          `http://localhost:3001/api/users/${userId}`,
          { headers: scenaristHeaders }
        );
        const data = (await response.json()) as User;
        return { success: true, data };
      }

      case "contains": {
        const city = getString(query.city) || "london";
        const response = await fetch(
          `http://localhost:3001/api/weather/v1/${city}`,
          { headers: scenaristHeaders }
        );
        const data = (await response.json()) as Weather;
        return { success: true, data };
      }

      case "startsWith": {
        const version = getString(query.version) || "v2";
        const city = getString(query.city) || "newyork";
        const response = await fetch(
          `http://localhost:3001/api/weather/${version}/${city}`,
          { headers: scenaristHeaders }
        );
        const data = (await response.json()) as Weather;
        return { success: true, data };
      }

      case "endsWith": {
        const filename = getString(query.filename) || "data.json";
        const response = await fetch(
          `http://localhost:3001/api/files/${filename}`,
          { headers: scenaristHeaders }
        );
        const data = (await response.json()) as FileInfo;
        return { success: true, data };
      }

      case "combined": {
        const apiVersion = getString(query.apiVersion) || "2023-10-16";
        const response = await fetch("http://localhost:3001/api/charges", {
          method: "POST",
          headers: {
            ...scenaristHeaders,
            "Content-Type": "application/json",
            "x-api-version": apiVersion,
          },
          body: JSON.stringify({}),
        });
        const data = (await response.json()) as Charge;
        return { success: true, data };
      }

      case "pathParam": {
        const userId = getString(query.userId) || "123";
        const response = await fetch(
          `http://localhost:3001/api/users/${userId}`,
          { headers: scenaristHeaders }
        );
        const data = (await response.json()) as User;
        return { success: true, data };
      }

      case "multipleParams": {
        const userId = getString(query.userId) || "alice";
        const postId = getString(query.postId) || "42";
        const response = await fetch(
          `http://localhost:3001/api/users/${userId}/posts/${postId}`,
          { headers: scenaristHeaders }
        );
        const data = (await response.json()) as any;
        return { success: true, data };
      }

      case "optional": {
        const filename = getString(query.filename);
        const url = filename
          ? `http://localhost:3001/api/optional-files/${filename}`
          : "http://localhost:3001/api/optional-files";
        const response = await fetch(url, { headers: scenaristHeaders });
        const data = (await response.json()) as any;
        return { success: true, data };
      }

      case "repeating": {
        const path = getString(query.path) || "folder/subfolder/file.txt";
        const response = await fetch(
          `http://localhost:3001/api/nested-files/${path}`,
          { headers: scenaristHeaders }
        );
        const data = (await response.json()) as any;
        return { success: true, data };
      }

      case "customRegex": {
        const orderId = getString(query.orderId) || "12345";
        const response = await fetch(
          `http://localhost:3001/api/orders/${orderId}`,
          { headers: scenaristHeaders }
        );
        const data = (await response.json()) as any;
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

export default function URLMatchingPage({ test, result }: PageProps) {
  return (
    <>
      <Head>
        <title>URL Matching Test Page</title>
      </Head>

      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">URL Matching Test Page</h1>
        <p className="mb-4">Test: {test}</p>

        {!result.success && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error: {result.error}
          </div>
        )}

        {result.success && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Result</h2>

            {/* Common field: matchedBy */}
            {"matchedBy" in result.data && (
              <p className="mb-2">
                <strong>Matched By:</strong> {result.data.matchedBy}
              </p>
            )}

            {/* User fields */}
            {"login" in result.data && (
              <>
                <p className="mb-2">
                  <strong>Login:</strong> {result.data.login}
                </p>
                <p className="mb-2">
                  <strong>ID:</strong> {result.data.id}
                </p>
                <p className="mb-2">
                  <strong>Name:</strong> {result.data.name}
                </p>
                <p className="mb-2">
                  <strong>Bio:</strong> {result.data.bio}
                </p>
                <p className="mb-2">
                  <strong>Public Repos:</strong> {result.data.public_repos}
                </p>
                <p className="mb-2">
                  <strong>Followers:</strong> {result.data.followers}
                </p>
              </>
            )}

            {/* Weather fields */}
            {"city" in result.data && (
              <>
                <p className="mb-2">
                  <strong>City:</strong> {result.data.city}
                </p>
                <p className="mb-2">
                  <strong>Temperature:</strong> {result.data.temperature}
                </p>
                <p className="mb-2">
                  <strong>Conditions:</strong> {result.data.conditions}
                </p>
                <p className="mb-2">
                  <strong>Humidity:</strong> {result.data.humidity}
                </p>
              </>
            )}

            {/* File fields */}
            {"type" in result.data && (
              <>
                <p className="mb-2">
                  <strong>Type:</strong> {result.data.type}
                </p>
                <p className="mb-2">
                  <strong>Name:</strong> {result.data.name}
                </p>
                <p className="mb-2">
                  <strong>Path:</strong> {result.data.path}
                </p>
                <p className="mb-2">
                  <strong>Content:</strong> {result.data.content}
                </p>
              </>
            )}

            {/* Charge fields */}
            {"amount" in result.data && (
              <>
                <p className="mb-2">
                  <strong>ID:</strong> {result.data.id}
                </p>
                <p className="mb-2">
                  <strong>Status:</strong> {result.data.status}
                </p>
                <p className="mb-2">
                  <strong>Amount:</strong> {result.data.amount}
                </p>
                <p className="mb-2">
                  <strong>Currency:</strong> {result.data.currency}
                </p>
              </>
            )}

            {/* Path parameter fields (userId/postId/title) */}
            {"userId" in result.data && (
              <>
                <p className="mb-2">
                  <strong>User ID:</strong> {result.data.userId}
                </p>
                {"postId" in result.data && (
                  <p className="mb-2">
                    <strong>Post ID:</strong> {result.data.postId}
                  </p>
                )}
                {"title" in result.data && (
                  <p className="mb-2">
                    <strong>Title:</strong> {result.data.title}
                  </p>
                )}
              </>
            )}

            {/* Path parameter fields (filename) */}
            {"filename" in result.data && !("type" in result.data) && (
              <p className="mb-2">
                <strong>Filename:</strong> {result.data.filename}
              </p>
            )}

            {/* Path parameter fields (path segments) */}
            {"segments" in result.data && (
              <>
                <p className="mb-2">
                  <strong>Path:</strong> {result.data.path}
                </p>
                <p className="mb-2">
                  <strong>Segments:</strong> {result.data.segments}
                </p>
              </>
            )}

            {/* Path parameter fields (orderId) */}
            {"orderId" in result.data && (
              <>
                <p className="mb-2">
                  <strong>Order ID:</strong> {result.data.orderId}
                </p>
                {"status" in result.data && !("amount" in result.data) && (
                  <p className="mb-2">
                    <strong>Status:</strong> {result.data.status}
                  </p>
                )}
              </>
            )}

            {/* Raw JSON for debugging */}
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">
                Raw Response
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (
  context
) => {
  const testParam = context.query.test;
  const test = Array.isArray(testParam) ? testParam[0] : testParam || "numericId";

  const scenaristHeaders = scenarist.getHeaders(context.req);
  const result = await fetchTestData(test, context.query, scenaristHeaders);

  return {
    props: {
      test,
      result,
    },
  };
};
