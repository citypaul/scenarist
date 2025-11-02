// Re-export schema-inferred types (single source of truth from Zod schemas)
export type {
  HttpMethod,
  MockResponse,
  MockDefinition,
  MatchCriteria,
  RepeatMode,
  ResponseSequence,
  CaptureState,
  VariantDefinition,
  ScenarioDefinition,
} from '../schemas/scenario-definition.js';

// Export types that remain in scenario.ts (not validated by schemas)
export type {
  HttpRequestContext,
  ActiveScenario,
  Result,
  ScenariosObject,
  ScenarioIds,
} from './scenario.js';

export type {
  ScenaristConfig,
  ScenaristConfigInput,
} from './config.js';
