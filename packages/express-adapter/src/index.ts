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

// Re-export core types and constants for user convenience (users should only install this adapter)
export { SCENARIST_TEST_ID_HEADER } from '@scenarist/core';
export type {
  ScenaristScenario,
  ScenaristMock,
  ScenaristResponse,
  ScenaristSequence,
  ScenaristMatch,
  ScenaristCaptureConfig,
  ScenaristScenarios,
  ScenaristConfig,
  ScenaristResult,
} from '@scenarist/core';
