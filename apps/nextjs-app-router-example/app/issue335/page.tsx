/**
 * Issue #335 Test Page - React Server Component
 *
 * Demonstrates testing scenario switching behavior where an active scenario's
 * simple response should override the default scenario's sequence mock.
 *
 * This is a SERVER component that fetches data on each request.
 * The test navigates to this page and verifies the response displayed.
 *
 * @see https://github.com/citypaul/scenarist/issues/335
 */

import { headers } from "next/headers";
import { getScenaristHeadersFromReadonlyHeaders } from "@scenarist/nextjs-adapter/app";

type ApplicationStatus = {
  readonly state: string;
  readonly source: string;
  readonly sequenceIndex?: number;
};

async function fetchApplicationStatus(
  appId: string,
): Promise<ApplicationStatus> {
  const headersList = await headers();

  const response = await fetch(
    `http://localhost:3002/api/issue335/applications/${appId}`,
    {
      headers: {
        ...getScenaristHeadersFromReadonlyHeaders(headersList),
      },
      cache: "no-store", // Disable caching for tests
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch application status: ${response.statusText}`,
    );
  }

  return response.json();
}

type PageProps = {
  searchParams: Promise<{ appId?: string }>;
};

export default async function Issue335Page({ searchParams }: PageProps) {
  const { appId = `app-${Date.now()}` } = await searchParams;
  const status = await fetchApplicationStatus(appId);

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
          </dl>
        </div>

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
