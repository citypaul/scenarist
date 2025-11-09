/**
 * Helper functions for Next.js Pages Router
 */

import type { IncomingMessage } from 'http';
import type { createScenarist } from './setup.js';

/**
 * Type for request objects that have headers.
 * Compatible with both NextApiRequest and GetServerSidePropsContext.req
 */
type RequestWithHeaders = {
  headers: IncomingMessage['headers'];
};

/**
 * Extracts Scenarist infrastructure headers from the request.
 *
 * This helper respects the configured test ID header name and default test ID
 * from the Scenarist instance, ensuring headers are forwarded correctly when
 * making external API calls.
 *
 * Works with both:
 * - NextApiRequest (API routes)
 * - GetServerSidePropsContext.req (SSR)
 *
 * @example
 * ```typescript
 * // API Route
 * import { scenarist } from '../../lib/scenarist';
 * import { getScenaristHeaders } from '@scenarist/nextjs-adapter/pages';
 *
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   const response = await fetch('http://localhost:3001/products', {
 *     headers: {
 *       ...getScenaristHeaders(req, scenarist),  // x-test-id
 *       'x-user-tier': req.headers['x-user-tier'] || 'standard',  // App-specific
 *     },
 *   });
 * }
 * 
 * // getServerSideProps
 * export const getServerSideProps: GetServerSideProps = async (context) => {
 *   const response = await fetch('http://localhost:3001/products', {
 *     headers: getScenaristHeaders(context.req, scenarist),
 *   });
 * };
 * ```
 *
 * @param req - Request object with headers (NextApiRequest or GetServerSidePropsContext.req)
 * @param scenarist - The Scenarist instance (contains config with header name and default)
 * @returns Object with single entry: configured test ID header name → value from request or default
 */
export const getScenaristHeaders = (
  req: RequestWithHeaders,
  scenarist: ReturnType<typeof createScenarist>
): Record<string, string> => {
  const headerName = scenarist.config.headers.testId;
  const defaultTestId = scenarist.config.defaultTestId;

  // Extract header value from request (Next.js headers can be string | string[] | undefined)
  const headerValue = req.headers[headerName.toLowerCase()];
  const testId = (Array.isArray(headerValue) ? headerValue[0] : headerValue) || defaultTestId;

  return {
    [headerName]: testId,
  };
};
