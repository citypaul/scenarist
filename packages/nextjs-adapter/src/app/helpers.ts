/**
 * Default Scenarist configuration constants.
 * These can be used even when scenarist is undefined (production builds).
 */
export const SCENARIST_TEST_ID_HEADER = 'x-test-id';
export const SCENARIST_DEFAULT_TEST_ID = 'default-test';

/**
 * Safe helper to extract Scenarist infrastructure headers from a Request object.
 *
 * This helper accesses the global scenarist instance and safely returns headers
 * even when scenarist is undefined (production builds). It respects the configured
 * test ID header name and default test ID.
 *
 * **Why use this instead of scenarist.getHeaders()?**
 * - No need to check if scenarist is defined (`scenarist?.getHeaders(req) ?? {}`)
 * - Works automatically by accessing the global singleton
 * - Safe in production (returns empty object)
 *
 * @param req - The Web standard Request object
 * @returns Object with single entry: configured test ID header name → value from request or default
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
 * **Why use this instead of scenarist.getHeadersFromReadonlyHeaders()?**
 * - No need to check if scenarist is defined
 * - Works automatically by accessing the global singleton
 * - Safe in production (returns empty object)
 *
 * @param headers - The ReadonlyHeaders object from headers() in 'next/headers'
 * @returns Object with single entry: configured test ID header name → value from headers or default
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
