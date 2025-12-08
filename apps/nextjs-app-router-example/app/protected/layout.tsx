/**
 * Protected Layout - Server-side Auth Check
 *
 * This layout demonstrates protected routes with Scenarist:
 * - Checks authentication via external API
 * - Redirects to login if not authenticated
 * - Passes user context to children via context or props
 *
 * No Jest needed - tested with Playwright + Scenarist!
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkAuth } from "@/lib/auth";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const headersList = await headers();
  const auth = await checkAuth(headersList);

  if (!auth.authenticated) {
    // Redirect to login with the original URL as a query param
    redirect("/login?from=/protected");
  }

  // User is authenticated - render children with user context
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Protected Area
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {auth.user.name}
              </span>
              <span className="text-sm text-gray-500">{auth.user.email}</span>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
