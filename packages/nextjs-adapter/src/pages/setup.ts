import type { IncomingMessage } from 'http';
import type { BaseAdapterOptions, ScenaristAdapter } from '@scenarist/core';
import { InMemoryScenarioRegistry, InMemoryScenarioStore } from '@scenarist/core';
import { createScenaristBase } from '../common/create-scenarist-base.js';
import { createScenarioEndpoint } from './endpoints.js';

/**
 * Global state for Next.js Pages Router adapter.
 *
 * Next.js dev mode with HMR creates multiple module instances, causing createScenarist()
 * to be called multiple times. These globals ensure:
 * 1. MSW server.listen() is only called once
 * 2. All instances share the same scenario registry and store
 * 3. The same Scenarist instance is returned when called multiple times
 */
declare global {
  // eslint-disable-next-line no-var
  var __scenarist_msw_started_pages: boolean | undefined;
  // eslint-disable-next-line no-var
  var __scenarist_registry_pages: InstanceType<typeof import('@scenarist/core').InMemoryScenarioRegistry> | undefined;
  // eslint-disable-next-line no-var
  var __scenarist_store_pages: InstanceType<typeof import('@scenarist/core').InMemoryScenarioStore> | undefined;
  // eslint-disable-next-line no-var
  var __scenarist_instance_pages: PagesScenarist | undefined;
}

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
  // Singleton guard - return existing instance if already created
  // This prevents duplicate scenario registration errors when Next.js creates multiple module instances
  if (global.__scenarist_instance_pages) {
    return global.__scenarist_instance_pages;
  }

  // Create or reuse global singleton stores for Next.js
  // This ensures all module instances share the same scenario state
  if (!global.__scenarist_registry_pages) {
    global.__scenarist_registry_pages = new InMemoryScenarioRegistry();
  }
  if (!global.__scenarist_store_pages) {
    global.__scenarist_store_pages = new InMemoryScenarioStore();
  }

  // Inject global singletons into base setup
  const { config, manager, server, currentTestId } = createScenaristBase({
    ...options,
    registry: global.__scenarist_registry_pages,
    store: global.__scenarist_store_pages,
  });

  const instance: PagesScenarist = {
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

      // DEBUG: Log test ID extraction
      console.log('[getHeaders] headerName:', headerName);
      console.log('[getHeaders] headerValue from request:', headerValue);
      console.log('[getHeaders] resolved testId:', testId);
      console.log('[getHeaders] all request headers:', Object.keys(req.headers));

      return {
        [headerName]: testId,
      };
    },
    start: () => {
      // Singleton guard - prevents duplicate MSW initialization
      // Next.js dev mode with HMR creates multiple module instances, so this ensures
      // server.listen() is only called once across all instances
      if (global.__scenarist_msw_started_pages) {
        return;
      }

      console.log('[Pages Adapter] Starting MSW server with onUnhandledRequest logging');

      // Add event listeners to see what MSW is intercepting
      server.events.on('request:start', ({ request }) => {
        console.log('[MSW] Request intercepted:', request.method, request.url);
      });

      server.events.on('request:match', ({ request }) => {
        console.log('[MSW] Request matched handler:', request.method, request.url);
      });

      server.events.on('request:unhandled', ({ request }) => {
        console.log('[MSW] Request unhandled:', request.method, request.url);
      });

      server.listen({
        onUnhandledRequest: (request, print) => {
          console.log('[MSW onUnhandledRequest]', request.method, request.url);
          print.warning();
        },
      });
      console.log('[Pages Adapter] MSW server.listen() completed');

      // Mark as started
      global.__scenarist_msw_started_pages = true;
    },
    stop: async () => server.close(),
  };

  // Store instance in global for singleton pattern
  global.__scenarist_instance_pages = instance;

  return instance;
};
