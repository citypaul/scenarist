/**
 * Scenario Control Endpoint
 *
 * Phase 1 (GREEN): Endpoint for runtime scenario switching
 *
 * This endpoint is automatically created by the Next.js adapter.
 * It handles:
 * - POST /__scenario__ - Switch scenario for a test ID
 * - GET /__scenario__ - Get active scenario for a test ID
 *
 * **PRODUCTION TREE-SHAKING:**
 * In production builds, scenarist is undefined due to conditional exports.
 * When the default export is undefined, Next.js treats the route as non-existent.
 * No manual guards needed - the architecture provides safety automatically.
 */

import { scenarist } from '../../lib/scenarist';

// In production, scenarist is undefined due to conditional exports
// This makes the default export undefined, and Next.js treats the route as non-existent
export default scenarist?.createScenarioEndpoint();
