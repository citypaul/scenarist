/**
 * Debug State Endpoint for Scenarist
 *
 * Returns the current test state for debugging purposes.
 * This endpoint is used by the debugState Playwright fixture.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { scenarist } from "../../../lib/scenarist";

// scenarist is undefined in production or when enabled is false
export default scenarist?.createStateEndpoint() ??
  ((_req: NextApiRequest, res: NextApiResponse) => {
    res.status(404).end();
  });
