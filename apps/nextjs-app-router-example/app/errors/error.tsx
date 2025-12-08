"use client";

/**
 * Error Boundary - Issue #211
 *
 * Next.js error boundary for the /errors route.
 * Catches errors thrown by page.tsx and provides recovery via reset().
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 * @see https://github.com/citypaul/scenarist/issues/211
 */

type ErrorBoundaryProps = {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
};

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div
        role="alert"
        aria-live="assertive"
        className="p-6 bg-red-50 border border-red-200 rounded-lg"
      >
        <h2 className="text-xl font-semibold text-red-800 mb-2">
          Something went wrong!
        </h2>
        <p className="text-red-700 mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Error Recovery Demo</h2>
        <div className="space-y-2 text-sm">
          <p>
            This error boundary catches errors thrown by the page component.
          </p>
          <p>
            Click &quot;Try again&quot; to re-render the page. If the scenario
            is switched to default, the page will recover successfully.
          </p>
        </div>
      </div>
    </div>
  );
}
