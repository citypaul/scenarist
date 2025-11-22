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
 * In production builds, scenarist is undefined and the endpoint is also undefined.
 * Next.js will handle this gracefully by not registering the route.
 */

import { scenarist } from '../../lib/scenarist';

export default scenarist?.createScenarioEndpoint();
