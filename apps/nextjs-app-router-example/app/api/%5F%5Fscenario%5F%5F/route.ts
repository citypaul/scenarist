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
 * In production builds, scenarist is undefined and the handler exports are also undefined.
 * Next.js will handle this gracefully by not registering the route.
 */

import { scenarist } from '../../../lib/scenarist';

const handler = scenarist?.createScenarioEndpoint();

export const POST = handler;
export const GET = handler;
