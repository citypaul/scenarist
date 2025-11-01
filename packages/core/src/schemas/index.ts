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

export { ScenarioRequestSchema, type ScenarioRequest } from './scenario-requests.js';
