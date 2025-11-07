// Re-export schema-inferred types (single source of truth from Zod schemas)
export type {
  HttpMethod,
  ScenaristResponse,
  ScenaristMock,
  ScenaristMatch,
  RepeatMode,
  ScenaristSequence,
  ScenaristCaptureConfig,
  ScenaristVariant,
  ScenaristScenario,
} from '../schemas/scenario-definition.js';

// Export types that remain in scenario.ts (not validated by schemas)
export type {
  HttpRequestContext,
  ActiveScenario,
  ScenaristResult,
  ScenaristScenarios,
  ScenarioIds,
} from './scenario.js';

export type {
  ScenaristConfig,
  ScenaristConfigInput,
} from './config.js';
