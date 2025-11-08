/**
 * Helper functions for Next.js App Router
 *
 * Note: These helpers are App Router-specific due to Web standard Request API.
 * Pages Router uses NextApiRequest which has a different headers API and doesn't
 * need these helpers - headers can be accessed directly via req.headers object.
 */

import type { createScenarist } from './setup.js';

/**
 * Extracts Scenarist infrastructure headers from the request.
 *
 * This helper respects the configured test ID header name and default test ID
 * from the Scenarist instance, ensuring headers are forwarded correctly when
 * making external API calls.
 *
 * @example
 * ```typescript
 * import { scenarist } from '../../../lib/scenarist';
 * import { getScenaristHeaders } from '@scenarist/nextjs-adapter/app';
 *
 * export async function GET(request: Request) {
 *   const response = await fetch('http://localhost:3001/products', {
 *     headers: {
 *       ...getScenaristHeaders(request, scenarist),  // x-test-id
 *       'x-user-tier': request.headers.get('x-user-tier') || 'standard',  // App-specific
 *     },
 *   });
 * }
 * ```
 *
 * @param req - The Web standard Request object
 * @param scenarist - The Scenarist instance (contains config with header name and default)
 * @returns Object with single entry: configured test ID header name → value from request or default
 */
export const getScenaristHeaders = (
  req: Request,
  scenarist: ReturnType<typeof createScenarist>
): Record<string, string> => {
  const headerName = scenarist.config.headers.testId;
  const defaultTestId = scenarist.config.defaultTestId;

  // Extract header value from request (Request.headers.get returns string | null)
  const testId = req.headers.get(headerName.toLowerCase()) || defaultTestId;

  return {
    [headerName]: testId,
  };
};
