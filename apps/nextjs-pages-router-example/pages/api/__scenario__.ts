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
 * In production builds, scenarist is undefined and this endpoint returns 404.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { scenarist } from '../../lib/scenarist';

// Fallback handler for when scenarist is undefined (production builds)
const productionHandler = async (_req: NextApiRequest, res: NextApiResponse) => {
  res.status(404).json({ error: 'Scenario endpoint not available in production' });
};

export default scenarist?.createScenarioEndpoint() ?? productionHandler;
