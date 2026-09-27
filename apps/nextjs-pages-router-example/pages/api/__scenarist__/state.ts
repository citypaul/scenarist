/**
 * Debug State Endpoint for Scenarist
 *
 * Returns the current test state for debugging purposes.
 * This endpoint is used by the debugState Playwright fixture.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { scenarist } from "../../../lib/scenarist";

// Next.js requires a default export function, and scenarist is undefined in production or when disabled
export default scenarist?.createStateEndpoint() ??
  ((_req: NextApiRequest, res: NextApiResponse) => {
    res.status(405).end();
  });
