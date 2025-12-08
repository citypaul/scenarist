/**
 * Login Page - React Server Component
 *
 * This page demonstrates login flow with Scenarist:
 * - Shows login form for unauthenticated users
 * - Displays redirect message when redirected from protected route
 * - Same code path in production and test
 *
 * Note: This is a demonstration page. In a real app, you would:
 * - Add actual form submission logic
 * - Connect to an authentication provider
 * - Handle login errors and validation
 */

type LoginPageProps = {
  searchParams: Promise<{ from?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { from } = await searchParams;
  const hasRedirect = from === "/protected";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Sign In
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome to the authentication flow example
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {hasRedirect && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                Please sign in to access the protected page
              </p>
            </div>
          )}

          <form className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Testing with Scenarist
                </span>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p className="mb-2">This login page demonstrates:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Redirect from protected route with ?from param</li>
                <li>Conditional redirect message display</li>
                <li>Form elements for E2E testing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
