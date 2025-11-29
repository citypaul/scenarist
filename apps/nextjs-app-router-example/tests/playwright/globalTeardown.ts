/**
 * Playwright Global Teardown
 *
 * Stops MSW server and cleans up resources.
 *
 * This runs once after all Playwright tests complete.
 * It stops the MSW server and cleans up resources.
 */

import { scenarist } from "../../lib/scenarist.js";

export default async function globalTeardown(): Promise<void> {
  // Stop MSW server (guard against production mode)
  if (scenarist) {
    await scenarist.stop();
    console.log("✅ MSW server stopped after Playwright tests");
  }
}
