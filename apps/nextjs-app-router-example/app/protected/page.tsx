/**
 * Protected Dashboard Page - React Server Component
 *
 * This page demonstrates protected content with Scenarist:
 * - Only accessible when authenticated (layout handles auth check)
 * - Displays user-specific content
 * - Same code path in production and test
 *
 * From Next.js docs:
 * > "Since async Server Components are new to the React ecosystem, some tools
 * > do not fully support them. In the meantime, we recommend using End-to-End
 * > Testing over Unit Testing for async components."
 *
 * Traditional approach: ❌ Jest doesn't support RSC
 * Scenarist approach: ✅ Playwright + scenario switching
 */

export default function ProtectedDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Protected Dashboard
        </h1>
        <p className="text-gray-600 mb-4">
          You are viewing protected content. This page is only accessible to
          authenticated users.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">
            ✅ Authentication successful! You have access to this protected
            area.
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Testing with Scenarist
        </h2>
        <div className="space-y-3 text-sm">
          <p className="text-gray-600">
            This protected route demonstrates authentication flow testing:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>
              <strong>authenticatedUser</strong> scenario - shows this dashboard
            </li>
            <li>
              <strong>unauthenticatedUser</strong> scenario - redirects to login
            </li>
          </ul>
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <code className="text-sm text-gray-700">
              await switchScenario(page, &apos;authenticatedUser&apos;);
              <br />
              await page.goto(&apos;/protected&apos;);
              <br />
              await expect(page.getByText(&apos;Protected
              Dashboard&apos;)).toBeVisible();
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
