/**
 * Scenario Control Endpoint - App Router
 *
 * Route Handler for runtime scenario switching.
 * Handles:
 * - POST /__scenario__ - Switch scenario for a test ID
 * - GET /__scenario__ - Get active scenario for a test ID
 */

import { scenarist } from '../../../lib/scenarist';

export const { GET, POST } = scenarist.createScenarioEndpoint();
