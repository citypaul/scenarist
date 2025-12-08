/**
 * Auth Helper - Server-side Authentication
 *
 * Demonstrates authentication flow with Scenarist:
 * - Calls external auth API (http://localhost:3001/auth/me)
 * - Returns authenticated user or unauthorized status
 * - Works with Scenarist scenarios for testing
 *
 * Same code path in production and test:
 * - Production: Real auth API responds
 * - Test: MSW intercepts and returns scenario-based response
 */

import { z } from "zod";
import { getScenaristHeadersFromReadonlyHeaders } from "@scenarist/nextjs-adapter/app";
import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
});

type User = z.infer<typeof UserSchema>;

type AuthResult =
  | { readonly authenticated: true; readonly user: User }
  | { readonly authenticated: false; readonly error: string };

/**
 * Check if user is authenticated by calling external auth API.
 *
 * @param headersList - Next.js headers from the request
 * @returns Authentication result with user data or error
 *
 * @example
 * ```typescript
 * // In a Server Component or layout
 * const headersList = await headers();
 * const auth = await checkAuth(headersList);
 *
 * if (!auth.authenticated) {
 *   redirect('/login');
 * }
 *
 * // Use auth.user
 * ```
 */
export const checkAuth = async (
  headersList: ReadonlyHeaders,
): Promise<AuthResult> => {
  const response = await fetch("http://localhost:3001/auth/me", {
    headers: {
      ...getScenaristHeadersFromReadonlyHeaders(headersList),
    },
    cache: "no-store", // Don't cache auth checks
  });

  if (!response.ok) {
    return {
      authenticated: false,
      error: "Authentication required",
    };
  }

  const data: unknown = await response.json();
  const user = UserSchema.parse(data);

  return {
    authenticated: true,
    user,
  };
};
