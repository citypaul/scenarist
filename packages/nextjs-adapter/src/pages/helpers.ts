import type { IncomingMessage } from 'http';

/**
 * Type for request objects that have headers.
 * Compatible with both NextApiRequest and GetServerSidePropsContext.req
 */
type RequestWithHeaders = {
  headers: IncomingMessage['headers'];
};

/**
 * Safe helper to extract Scenarist infrastructure headers from a request.
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
 * @param req - Request object with headers (NextApiRequest or GetServerSidePropsContext.req)
 * @returns Object with single entry: configured test ID header name → value from request or default
 *
 * @example
 * ```typescript
 * // API Route
 * import { getScenaristHeaders } from '@scenarist/nextjs-adapter/pages';
 *
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   const response = await fetch('http://localhost:3001/products', {
 *     headers: {
 *       ...getScenaristHeaders(req),  // Always safe, no guards needed
 *       'x-user-tier': 'premium',
 *     },
 *   });
 * }
 *
 * // getServerSideProps
 * import { getScenaristHeaders } from '@scenarist/nextjs-adapter/pages';
 *
 * export const getServerSideProps: GetServerSideProps = async (context) => {
 *   const response = await fetch('http://localhost:3001/products', {
 *     headers: getScenaristHeaders(context.req),
 *   });
 * };
 * ```
 */
export function getScenaristHeaders(req: RequestWithHeaders): Record<string, string> {
  const scenarist = global.__scenarist_instance_pages;
  return scenarist?.getHeaders(req) ?? {};
}
