import type { BaseAdapterOptions, ScenaristAdapter } from '@scenarist/core';
import { InMemoryScenarioRegistry, InMemoryScenarioStore } from '@scenarist/core';
import { createScenaristBase } from '../common/create-scenarist-base.js';
import { createScenarioEndpoint } from './endpoints.js';

/**
 * Global state for Next.js App Router adapter.
 *
 * Next.js (Turbopack) creates multiple module instances, causing createScenarist()
 * to be called multiple times. These globals ensure:
 * 1. MSW server.listen() is only called once
 * 2. All instances share the same scenario registry and store
 * 3. The same Scenarist instance is returned when called multiple times
 */
declare global {
  // eslint-disable-next-line no-var
  var __scenarist_msw_started: boolean | undefined;
  // eslint-disable-next-line no-var
  var __scenarist_registry: InstanceType<typeof import('@scenarist/core').InMemoryScenarioRegistry> | undefined;
  // eslint-disable-next-line no-var
  var __scenarist_store: InstanceType<typeof import('@scenarist/core').InMemoryScenarioStore> | undefined;
  // eslint-disable-next-line no-var
  var __scenarist_instance: AppScenarist | undefined;
}

/**
 * Next.js App Router adapter options.
 *
 * Extends BaseAdapterOptions to ensure consistency across all adapters.
 */
export type AppAdapterOptions = BaseAdapterOptions;

/**
 * Next.js App Router adapter instance.
 *
 * Provides MSW server lifecycle management and scenario endpoint factory.
 * Unlike Express adapter, doesn't provide middleware (Next.js doesn't have global middleware for App Router).
 */
export type AppScenarist = Omit<ScenaristAdapter<never>, 'middleware'> & {
  /**
   * Create scenario endpoint handler for use in app/api/%5F%5Fscenario%5F%5F/route.ts
   *
   * @example
   * ```typescript
   * // app/api/%5F%5Fscenario%5F%5F/route.ts
   * import { scenarist } from '@/lib/scenarist';
   *
   * export const POST = scenarist.createScenarioEndpoint();
   * export const GET = scenarist.createScenarioEndpoint();
   * ```
   */
  createScenarioEndpoint: () => ReturnType<typeof createScenarioEndpoint>;

  /**
   * Extract Scenarist infrastructure headers from the request.
   *
   * This helper respects the configured test ID header name and default test ID,
   * ensuring headers are forwarded correctly when making external API calls.
   *
   * Works with Web standard Request objects (App Router, Server Components, Route Handlers).
   *
   * @param req - The Web standard Request object
   * @returns Object with single entry: configured test ID header name → value from request or default
   *
   * @example
   * ```typescript
   * // Route Handler
   * export async function GET(request: Request) {
   *   const response = await fetch('http://localhost:3001/products', {
   *     headers: scenarist.getHeaders(request),
   *   });
   * }
   *
   * // Server Component
   * async function ProductsPage() {
   *   const response = await fetch('http://localhost:3001/products', {
   *     headers: scenarist.getHeaders(request),
   *   });
   * }
   * ```
   */
  getHeaders: (req: Request) => Record<string, string>;
};

/**
 * Create a Scenarist instance for Next.js App Router.
 *
 * This is the primary API for Next.js App Router users. It wires everything automatically:
 * - MSW server with dynamic handler
 * - Scenario manager
 * - State manager and sequence tracker
 * - Response selector
 *
 * Unlike Express adapter, this doesn't return middleware. Instead, use `createScenarioEndpoint()`
 * to create the handler for your app/api/%5F%5Fscenario%5F%5F/route.ts file.
 *
 * @example
 * ```typescript
 * // lib/scenarist.ts
 * import { createScenarist } from '@scenarist/nextjs-adapter/app';
 * import { defaultScenario } from './scenarios';
 *
 * export const scenarist = createScenarist({
 *   enabled: process.env.NODE_ENV === 'development',
 *   defaultScenario,
 * });
 *
 * // app/api/%5F%5Fscenario%5F%5F/route.ts
 * export const POST = scenarist.createScenarioEndpoint();
 * export const GET = scenarist.createScenarioEndpoint();
 *
 * // tests/setup.ts
 * beforeAll(() => scenarist.start());
 * afterAll(() => scenarist.stop());
 * ```
 */
export const createScenarist = (options: AppAdapterOptions): AppScenarist => {
  // Singleton guard - return existing instance if already created
  // This prevents duplicate scenario registration errors when Next.js creates multiple module instances
  if (global.__scenarist_instance) {
    return global.__scenarist_instance;
  }

  // Create or reuse global singleton stores for Next.js
  // This ensures all module instances share the same scenario state
  if (!global.__scenarist_registry) {
    global.__scenarist_registry = new InMemoryScenarioRegistry();
  }
  if (!global.__scenarist_store) {
    global.__scenarist_store = new InMemoryScenarioStore();
  }

  // Inject global singletons into base setup
  const { config, manager, server, currentTestId } = createScenaristBase({
    ...options,
    registry: global.__scenarist_registry,
    store: global.__scenarist_store,
  });

  const instance: AppScenarist = {
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
    getHeaders: (req: Request): Record<string, string> => {
      const headerName = config.headers.testId;
      const defaultTestId = config.defaultTestId;
      const testId = req.headers.get(headerName.toLowerCase()) || defaultTestId;
      return {
        [headerName]: testId,
      };
    },
    start: () => {
      // Singleton guard - prevents duplicate MSW initialization
      // Next.js (Turbopack) creates multiple module instances, so this ensures
      // server.listen() is only called once across all instances
      if (global.__scenarist_msw_started) {
        return;
      }

      global.__scenarist_msw_started = true;
      server.listen();
    },
    stop: async () => server.close(),
  };

  // Store instance in global for singleton pattern
  global.__scenarist_instance = instance;

  return instance;
};
