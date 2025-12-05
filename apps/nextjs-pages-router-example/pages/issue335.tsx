/**
 * Issue #335 Test Page
 *
 * Demonstrates testing scenario switching behavior where an active scenario's
 * simple response should override the default scenario's sequence mock.
 *
 * @see https://github.com/citypaul/scenarist/issues/335
 */

import { useState } from "react";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/pages";
import type { GetServerSideProps } from "next";

type ApplicationStatus = {
  state: string;
  source: string;
  sequenceIndex?: number;
};

type PageProps = {
  testIdHeader: Record<string, string>;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (
  context,
) => {
  // Forward Scenarist headers for client-side fetches
  const testIdHeader = getScenaristHeaders(context.req);

  return {
    props: {
      testIdHeader,
    },
  };
};

export default function Issue335Page({ testIdHeader }: PageProps) {
  const [status, setStatus] = useState<ApplicationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callCount, setCallCount] = useState(0);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/issue335/applications/app-${Date.now()}`,
        {
          headers: testIdHeader,
        },
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setStatus(data);
      setCallCount((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Issue #335: Scenario Switching Test
        </h1>

        <p className="text-gray-600 mb-8">
          This page tests that switching to an active scenario with a simple
          response correctly overrides the default scenario&apos;s sequence
          mock.
        </p>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <button
            onClick={checkStatus}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Checking..." : "Check Application Status"}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6"
          >
            Error: {error}
          </div>
        )}

        {status && (
          <div
            role="status"
            aria-live="polite"
            className="bg-white shadow rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Application Status
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600">State:</dt>
                <dd className="font-medium text-gray-900">{status.state}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Source:</dt>
                <dd className="font-medium text-gray-900">{status.source}</dd>
              </div>
              {status.sequenceIndex !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Sequence Index:</dt>
                  <dd className="font-medium text-gray-900">
                    {status.sequenceIndex}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t pt-3">
                <dt className="text-gray-600">API Calls Made:</dt>
                <dd className="font-medium text-gray-900">{callCount}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          <h3 className="font-medium text-gray-700 mb-2">Expected Behavior:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Default scenario:</strong> Returns sequence response with
              source &quot;default-sequence&quot;
            </li>
            <li>
              <strong>issue335SimpleResponse scenario:</strong> Returns simple
              response with source &quot;issue335-simple-response&quot; and
              state &quot;ready&quot;
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
