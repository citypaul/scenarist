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
 * In production builds, scenarist is undefined and the handlers return 404.
 */

import { NextResponse } from 'next/server';
import { scenarist } from '../../../lib/scenarist';

// Fallback handler for when scenarist is undefined (production builds)
const productionHandler = async () => {
  return NextResponse.json(
    { error: 'Scenario endpoint not available in production' },
    { status: 404 }
  );
};

const handler = scenarist?.createScenarioEndpoint() ?? productionHandler;

export const POST = handler;
export const GET = handler;
