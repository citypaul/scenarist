import type {
  BaseAdapterOptions,
  ScenaristAdapter,
  ScenarioRegistry,
  ScenarioStore,
} from "@scenarist/core";
import {
  InMemoryScenarioRegistry,
  InMemoryScenarioStore,
} from "@scenarist/core";
import { createScenaristBase } from "../common/create-scenarist-base.js";
import { createScenarioEndpoint } from "./endpoints.js";

/**
 * Global state for Next.js App Router adapter.
 *
 * Next.js (Turbopack) creates multiple module instances, causing createScenarist()
 * to be called multiple times. These globals ensure:
 * 1. MSW server.listen() is only called once
 * 2. All instances share the same scenario registry and store
 * 3. The same Scenarist instance is returned when called multiple times
 *
 * IMPORTANT: App Router and Pages Router use separate global keys to enable isolation.
 * This allows a single Next.js application to use both routers simultaneously with
 * independent scenario states. For example, App Router pages can be on scenario A
 * while Pages Router pages are on scenario B, enabling gradual migration patterns.
 *
 * If shared globals were used, switching scenarios in App Router would affect Pages
 * Router and vice versa, breaking test isolation when both routers are present.
 */
declare global {
  // eslint-disable-next-line no-var
  var __scenarist_msw_started: boolean | undefined;
  // eslint-disable-next-line no-var
  var __scenarist_registry: ScenarioRegistry | undefined;
  // eslint-disable-next-line no-var
  var __scenarist_store: ScenarioStore | undefined;
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
export type AppScenarist = Omit<ScenaristAdapter<never>, "middleware"> & {
  /**
   * Create scenario endpoint handler for use in app/api/%5F%5Fscenario%5F%5F/route.ts
   *
   * @example
   * ```typescript
   * // app/api/%5F%5Fscenario%5F%5F/route.ts
   * import { scenarist } from '@/lib/scenarist';
   *
   * const handler = scenarist?.createScenarioEndpoint();
   * export const POST = handler;
   * export const GET = handler;
   * ```
   */
  createScenarioEndpoint: () => ReturnType<typeof createScenarioEndpoint>;
};

/**
 * Create a Scenarist instance for Next.js App Router (implementation).
 *
 * This is the actual implementation that wires everything automatically:
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
 * const handler = scenarist?.createScenarioEndpoint();
 * export const POST = handler;
 * export const GET = handler;
 *
 * // tests/setup.ts
 * if (scenarist) {
 *   beforeAll(() => scenarist.start());
 *   afterAll(() => scenarist.stop());
 * }
 * ```
 */
export const createScenaristImpl = (
  options: AppAdapterOptions,
): AppScenarist => {
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
    switchScenario: (testId, scenarioId) => {
      currentTestId.value = testId; // Update for MSW handler
      return manager.switchScenario(testId, scenarioId);
    },
    getActiveScenario: (testId) => manager.getActiveScenario(testId),
    getScenarioById: (scenarioId) => manager.getScenarioById(scenarioId),
    listScenarios: () => manager.listScenarios(),
    clearScenario: (testId) => manager.clearScenario(testId),
    createScenarioEndpoint: () => createScenarioEndpoint(manager, config),
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
