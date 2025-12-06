/**
 * Debug State Endpoint for Scenarist
 *
 * Returns the current test state for debugging purposes.
 * This endpoint is used by the debugState Playwright fixture.
 */

import { scenarist } from "../../../lib/scenarist";

export default scenarist?.createStateEndpoint();
