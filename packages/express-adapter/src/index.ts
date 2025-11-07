// Primary API - batteries included setup
export { createScenarist } from './setup/setup-scenarist.js';
export type {
  ExpressAdapterOptions,
  ExpressScenarist,
} from './setup/setup-scenarist.js';

// Low-level API - for advanced users who need custom wiring
export { ExpressRequestContext } from './context/express-request-context.js';
export { createTestIdMiddleware, testIdStorage } from './middleware/test-id-middleware.js';
export { createScenarioEndpoints } from './endpoints/scenario-endpoints.js';

// Re-export core types for user convenience (users should only install this adapter)
export type {
  ScenarioDefinition,
  MockDefinition,
  MockResponse,
  ResponseSequence,
  MatchCriteria,
  CaptureState,
  ScenariosObject,
  ScenaristConfig,
  Result,
} from '@scenarist/core';
