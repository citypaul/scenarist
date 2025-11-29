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
 * Global state for Next.js Pages Router adapter.
 *
 * Next.js dev mode with HMR creates multiple module instances, causing createScenarist()
 * to be called multiple times. These globals ensure:
 * 1. MSW server.listen() is only called once
 * 2. All instances share the same scenario registry and store
 * 3. The same Scenarist instance is returned when called multiple times
 *
 * IMPORTANT: App Router and Pages Router use separate global keys (_pages suffix) to enable isolation.
 * This allows a single Next.js application to use both routers simultaneously with
 * independent scenario states. For example, App Router pages can be on scenario A
 * while Pages Router pages are on scenario B, enabling gradual migration patterns.
 *
 * If shared globals were used, switching scenarios in Pages Router would affect App
 * Router and vice versa, breaking test isolation when both routers are present.
 */
declare global {
  // eslint-disable-next-line no-var
  var __scenarist_msw_started_pages: boolean | undefined;
  // eslint-disable-next-line no-var
  var __scenarist_registry_pages: ScenarioRegistry | undefined;
  // eslint-disable-next-line no-var
  var __scenarist_store_pages: ScenarioStore | undefined;
  // eslint-disable-next-line no-var
  var __scenarist_instance_pages: PagesScenarist | undefined;
}

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
export type PagesScenarist = Omit<ScenaristAdapter<never>, "middleware"> & {
  /**
   * Create scenario endpoint handler for use in pages/api/__scenario__.ts
   *
   * @example
   * ```typescript
   * // pages/api/__scenario__.ts
   * import { scenarist } from '../../lib/scenarist';
   *
   * export default scenarist?.createScenarioEndpoint();
   * ```
   */
  createScenarioEndpoint: () => ReturnType<typeof createScenarioEndpoint>;
};

/**
 * Create a Scenarist instance for Next.js Pages Router (implementation).
 *
 * This is the actual implementation that wires everything automatically:
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
 * export default scenarist?.createScenarioEndpoint();
 *
 * // tests/setup.ts
 * if (scenarist) {
 *   beforeAll(() => scenarist.start());
 *   afterAll(() => scenarist.stop());
 * }
 * ```
 */
export const createScenaristImpl = (
  options: PagesAdapterOptions,
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
      // Next.js dev mode with HMR creates multiple module instances, so this ensures
      // server.listen() is only called once across all instances
      if (global.__scenarist_msw_started_pages) {
        return;
      }

      server.listen();

      // Mark as started
      global.__scenarist_msw_started_pages = true;
    },
    stop: async () => server.close(),
  };

  // Store instance in global for singleton pattern
  global.__scenarist_instance_pages = instance;

  return instance;
};
