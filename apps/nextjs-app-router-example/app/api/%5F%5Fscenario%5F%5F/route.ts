/**
 * Scenario Control Endpoint - App Router
 *
 * Route Handler for runtime scenario switching.
 * Handles:
 * - POST /__scenario__ - Switch scenario for a test ID
 * - GET /__scenario__ - Get active scenario for a test ID
 *
 * Note: Both GET and POST use the same handler which routes based on req.method internally.
 */

import { scenarist } from '../../../lib/scenarist';

export const POST = scenarist.createScenarioEndpoint();
export const GET = scenarist.createScenarioEndpoint();
