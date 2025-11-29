/**
 * Scenario Control Endpoint - App Router
 *
 * Route Handler for runtime scenario switching.
 * Handles:
 * - POST /__scenario__ - Switch scenario for a test ID
 * - GET /__scenario__ - Get active scenario for a test ID
 *
 * Note: Both GET and POST use the same handler which routes based on req.method internally.
 *
 * **PRODUCTION TREE-SHAKING:**
 * In production builds, scenarist is undefined due to conditional exports.
 * When exports are undefined, Next.js treats the route as non-existent.
 * No manual guards needed - the architecture provides safety automatically.
 */

import { scenarist } from "../../../lib/scenarist";

// In production, scenarist is undefined due to conditional exports
// This makes the exports undefined, and Next.js treats the route as non-existent
const handler = scenarist?.createScenarioEndpoint();

export const POST = handler;
export const GET = handler;
