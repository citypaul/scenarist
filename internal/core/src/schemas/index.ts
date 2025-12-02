/**
 * Runtime validation schemas for domain data.
 *
 * **Architectural Principle:**
 * Schemas in this directory define domain validation rules.
 * Framework adapters use these schemas at trust boundaries (external → internal).
 *
 * **Pattern:**
 * 1. Define schema using Zod
 * 2. Export both schema and derived type
 * 3. Adapters import and apply at trust boundaries
 * 4. NEVER duplicate schemas in adapters
 */

export {
  ScenarioRequestSchema,
  type ScenarioRequest,
} from "./scenario-requests.js";
export { ScenariosObjectSchema } from "./scenarios-object.js";
export {
  HttpMethodSchema,
  ScenaristResponseSchema,
  MatchValueSchema,
  ScenaristMatchSchema,
  RepeatModeSchema,
  ScenaristSequenceSchema,
  ScenaristCaptureConfigSchema,
  ScenaristUrlPatternSchema,
  ScenaristMockSchema,
  ScenaristScenarioSchema,
  // Export schema-inferred types (single source of truth)
  type HttpMethod,
  type ScenaristResponse,
  type MatchValue,
  type ScenaristMatch,
  type RepeatMode,
  type ScenaristSequence,
  type ScenaristCaptureConfig,
  type ScenaristUrlPattern,
  type ScenaristMock,
  type ScenaristScenario,
} from "./scenario-definition.js";
export {
  SerializedRegexSchema,
  type SerializedRegex,
} from "./match-criteria.js";
export {
  StateConditionSchema,
  StatefulMockResponseSchema,
  StateAfterResponseSchema,
  StateMatchCriteriaSchema,
  type StateCondition,
  type StatefulMockResponse,
  type StateAfterResponse,
  type StateMatchCriteria,
} from "./state-aware-mocking.js";
