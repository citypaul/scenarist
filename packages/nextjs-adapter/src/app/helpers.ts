/**
 * Internal constants for Scenarist configuration.
 * Not exported - use helper functions instead to avoid leaky abstractions.
 */
const SCENARIST_TEST_ID_HEADER = 'x-test-id';
const SCENARIST_DEFAULT_TEST_ID = 'default-test';

/**
 * Safe helper to extract Scenarist infrastructure headers from a Request object.
 *
 * This helper accesses the global scenarist instance and safely returns headers
 * even when scenarist is undefined (production builds). It respects the configured
 * test ID header name and default test ID.
 *
 * **Production Behavior:**
 * - Returns `{}` (empty object) when scenarist is undefined
 * - Safe to spread in fetch headers without guards
 * - Zero runtime overhead (tree-shaken in production builds)
 *
 * **Why use this instead of scenarist.getHeaders()?**
 * - No need to check if scenarist is defined (`scenarist?.getHeaders(req) ?? {}`)
 * - Works automatically by accessing the global singleton
 * - Consistent API across development, test, and production
 *
 * @param req - The Web standard Request object
 * @returns Object with single entry: configured test ID header name → value from request or default
 *          Returns `{}` in production when scenarist is undefined
 *
 * @example
 * ```typescript
 * // Route Handler
 * import { getScenaristHeaders } from '@scenarist/nextjs-adapter/app';
 *
 * export async function GET(request: Request) {
 *   const response = await fetch('http://localhost:3001/products', {
 *     headers: {
 *       ...getScenaristHeaders(request),  // Always safe, no guards needed
 *       'x-user-tier': 'premium',
 *     },
 *   });
 * }
 * ```
 */
export function getScenaristHeaders(req: Request): Record<string, string> {
  const scenarist = global.__scenarist_instance;
  return scenarist?.getHeaders(req) ?? {};
}

/**
 * Safe helper to extract Scenarist infrastructure headers from ReadonlyHeaders.
 *
 * This helper is designed for Next.js Server Components that use headers() from 'next/headers',
 * which returns ReadonlyHeaders (not a Request object). It accesses the global scenarist instance
 * and safely returns headers even when scenarist is undefined (production builds).
 *
 * **Production Behavior:**
 * - Returns `{}` (empty object) when scenarist is undefined
 * - Safe to spread in fetch headers without guards
 * - Zero runtime overhead (tree-shaken in production builds)
 *
 * **Why use this instead of scenarist.getHeadersFromReadonlyHeaders()?**
 * - No need to check if scenarist is defined
 * - Works automatically by accessing the global singleton
 * - Consistent API across development, test, and production
 *
 * @param headers - The ReadonlyHeaders object from headers() in 'next/headers'
 * @returns Object with single entry: configured test ID header name → value from headers or default
 *          Returns `{}` in production when scenarist is undefined
 *
 * @example
 * ```typescript
 * // Server Component
 * import { headers } from 'next/headers';
 * import { getScenaristHeadersFromReadonlyHeaders } from '@scenarist/nextjs-adapter/app';
 *
 * export default async function ProductsPage() {
 *   const headersList = await headers();
 *
 *   const response = await fetch('http://localhost:3001/products', {
 *     headers: {
 *       ...getScenaristHeadersFromReadonlyHeaders(headersList),  // Always safe
 *       'x-user-tier': 'premium',
 *     },
 *   });
 *
 *   const data = await response.json();
 *   return <ProductList products={data.products} />;
 * }
 * ```
 */
export function getScenaristHeadersFromReadonlyHeaders(headers: { get(name: string): string | null }): Record<string, string> {
  const scenarist = global.__scenarist_instance;
  return scenarist?.getHeadersFromReadonlyHeaders(headers) ?? {};
}

/**
 * Safe helper to extract just the test ID from ReadonlyHeaders.
 *
 * This helper is designed for scenarios where you need the test ID value directly,
 * such as when integrating with repository patterns or other test-scoped systems.
 *
 * **Production Behavior:**
 * - Returns `'default-test'` when scenarist is undefined
 * - Safe to use for partitioning data without guards
 * - Zero runtime overhead (tree-shaken in production builds)
 *
 * **Use this when:**
 * - You need to partition in-memory data by test ID
 * - You're integrating Scenarist with custom test isolation mechanisms
 * - You need the test ID for logging/debugging
 *
 * @param headers - The ReadonlyHeaders object from headers() in 'next/headers'
 * @returns The test ID string extracted from headers, or `'default-test'` if not found or in production
 *
 * @example
 * ```typescript
 * // Server Component with repository pattern
 * import { headers } from 'next/headers';
 * import { getScenaristTestIdFromReadonlyHeaders } from '@scenarist/nextjs-adapter/app';
 * import { runWithTestId, getUserRepository } from '@/lib/container';
 *
 * export default async function UserPage() {
 *   const headersList = await headers();
 *   const testId = getScenaristTestIdFromReadonlyHeaders(headersList);
 *
 *   // Use test ID for repository isolation
 *   const user = await runWithTestId(testId, async () => {
 *     const userRepo = getUserRepository();
 *     return userRepo.findById('user-123');
 *   });
 *
 *   return <UserProfile user={user} />;
 * }
 * ```
 */
export function getScenaristTestIdFromReadonlyHeaders(headers: { get(name: string): string | null }): string {
  const scenarist = global.__scenarist_instance;
  if (!scenarist) {
    return SCENARIST_DEFAULT_TEST_ID;
  }

  // Get test ID from configured header
  const testIdHeader = SCENARIST_TEST_ID_HEADER;
  return headers.get(testIdHeader) ?? SCENARIST_DEFAULT_TEST_ID;
}

/**
 * Safe helper to extract just the test ID from a Request object.
 *
 * This helper is designed for Route Handlers where you need the test ID value directly.
 *
 * **Production Behavior:**
 * - Returns `'default-test'` when scenarist is undefined
 * - Safe to use for partitioning data without guards
 * - Zero runtime overhead (tree-shaken in production builds)
 *
 * @param req - The Web standard Request object
 * @returns The test ID string extracted from request headers, or `'default-test'` if not found or in production
 *
 * @example
 * ```typescript
 * // Route Handler
 * import { getScenaristTestId } from '@scenarist/nextjs-adapter/app';
 *
 * export async function GET(request: Request) {
 *   const testId = getScenaristTestId(request);
 *   console.log('Processing request for test:', testId);
 *   // ...
 * }
 * ```
 */
export function getScenaristTestId(req: Request): string {
  const scenarist = global.__scenarist_instance;
  if (!scenarist) {
    return SCENARIST_DEFAULT_TEST_ID;
  }

  // Get test ID from configured header
  const testIdHeader = SCENARIST_TEST_ID_HEADER;
  return req.headers.get(testIdHeader) ?? SCENARIST_DEFAULT_TEST_ID;
}
