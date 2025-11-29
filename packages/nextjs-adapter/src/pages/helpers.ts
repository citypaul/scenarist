import type { IncomingMessage } from "http";
import { SCENARIST_TEST_ID_HEADER } from "@scenarist/core";

/**
 * Fallback constant for default test ID when scenarist is undefined (production builds).
 * In development/test, this is overridden by values from scenarist.config.
 */
const FALLBACK_DEFAULT_TEST_ID = "default-test";

/**
 * Type for request objects that have headers.
 * Compatible with both NextApiRequest and GetServerSidePropsContext.req
 */
type RequestWithHeaders = {
  headers: IncomingMessage["headers"];
};

/**
 * Safe helper to extract Scenarist infrastructure headers from a request.
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
 * @param req - Request object with headers (NextApiRequest or GetServerSidePropsContext.req)
 * @returns Object with single entry: configured test ID header name → value from request or default
 *          Returns `{}` in production when scenarist is undefined
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
export function getScenaristHeaders(
  req: RequestWithHeaders,
): Record<string, string> {
  const scenarist = global.__scenarist_instance_pages;
  if (!scenarist) {
    return {};
  }

  const defaultTestId =
    scenarist.config?.defaultTestId ?? FALLBACK_DEFAULT_TEST_ID;
  const headerValue = req.headers[SCENARIST_TEST_ID_HEADER];
  const testId =
    (Array.isArray(headerValue) ? headerValue[0] : headerValue) ??
    defaultTestId;

  return {
    [SCENARIST_TEST_ID_HEADER]: testId,
  };
}
