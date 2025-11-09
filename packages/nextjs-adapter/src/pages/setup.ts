import type { IncomingMessage } from 'http';
import type { BaseAdapterOptions, ScenaristAdapter } from '@scenarist/core';
import { createScenaristBase } from '../common/create-scenarist-base.js';
import { createScenarioEndpoint } from './endpoints.js';

/**
 * Type for request objects that have headers.
 * Compatible with both NextApiRequest and GetServerSidePropsContext.req
 */
type RequestWithHeaders = {
  headers: IncomingMessage['headers'];
};

/**
 * Next.js Pages Router adapter options.
 *
 * Extends BaseAdapterOptions to ensure consistency across all adapters.
 */
export type PagesAdapterOptions = BaseAdapterOptions;

/**
 * Next.js Pages Router adapter instance.
 *
 * Provides MSW server lifecycle management and scenario endpoint factory.
 * Unlike Express adapter, doesn't provide middleware (Next.js doesn't have global middleware for Pages Router).
 */
export type PagesScenarist = Omit<ScenaristAdapter<never>, 'middleware'> & {
  /**
   * Create scenario endpoint handler for use in pages/api/__scenario__.ts
   *
   * @example
   * ```typescript
   * // pages/api/__scenario__.ts
   * import { scenarist } from '../../lib/scenarist';
   *
   * export default scenarist.createScenarioEndpoint();
   * ```
   */
  createScenarioEndpoint: () => ReturnType<typeof createScenarioEndpoint>;

  /**
   * Extract Scenarist infrastructure headers from the request.
   *
   * This helper respects the configured test ID header name and default test ID,
   * ensuring headers are forwarded correctly when making external API calls.
   *
   * Works with both NextApiRequest (API routes) and GetServerSidePropsContext.req (SSR).
   *
   * @param req - Request object with headers
   * @returns Object with single entry: configured test ID header name → value from request or default
   *
   * @example
   * ```typescript
   * // API Route
   * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   *   const response = await fetch('http://localhost:3001/products', {
   *     headers: scenarist.getHeaders(req),
   *   });
   * }
   *
   * // getServerSideProps
   * export const getServerSideProps: GetServerSideProps = async (context) => {
   *   const response = await fetch('http://localhost:3001/products', {
   *     headers: scenarist.getHeaders(context.req),
   *   });
   * };
   * ```
   */
  getHeaders: (req: RequestWithHeaders) => Record<string, string>;
};

/**
 * Create a Scenarist instance for Next.js Pages Router.
 *
 * This is the primary API for Next.js Pages Router users. It wires everything automatically:
 * - MSW server with dynamic handler
 * - Scenario manager
 * - State manager and sequence tracker
 * - Response selector
 *
 * Unlike Express adapter, this doesn't return middleware. Instead, use `createScenarioEndpoint()`
 * to create the handler for your pages/api/__scenario__.ts file.
 *
 * @example
 * ```typescript
 * // lib/scenarist.ts
 * import { createScenarist } from '@scenarist/nextjs-adapter/pages';
 * import { defaultScenario } from './scenarios';
 *
 * export const scenarist = createScenarist({
 *   enabled: process.env.NODE_ENV === 'development',
 *   defaultScenario,
 * });
 *
 * // pages/api/__scenario__.ts
 * export default scenarist.createScenarioEndpoint();
 *
 * // tests/setup.ts
 * beforeAll(() => scenarist.start());
 * afterAll(() => scenarist.stop());
 * ```
 */
export const createScenarist = (
  options: PagesAdapterOptions
): PagesScenarist => {
  const { config, manager, server, currentTestId } =
    createScenaristBase(options);

  return {
    config,
    switchScenario: (testId, scenarioId, variantName) => {
      currentTestId.value = testId; // Update for MSW handler
      return manager.switchScenario(testId, scenarioId, variantName);
    },
    getActiveScenario: (testId) => manager.getActiveScenario(testId),
    getScenarioById: (scenarioId) => manager.getScenarioById(scenarioId),
    listScenarios: () => manager.listScenarios(),
    clearScenario: (testId) => manager.clearScenario(testId),
    createScenarioEndpoint: () => createScenarioEndpoint(manager, config),
    getHeaders: (req: RequestWithHeaders): Record<string, string> => {
      const headerName = config.headers.testId;
      const defaultTestId = config.defaultTestId;
      const headerValue = req.headers[headerName.toLowerCase()];
      const testId = (Array.isArray(headerValue) ? headerValue[0] : headerValue) || defaultTestId;
      return {
        [headerName]: testId,
      };
    },
    start: () => server.listen(),
    stop: async () => server.close(),
  };
};
