/**
 * Debug State Endpoint - App Router (Issue #332)
 *
 * Route Handler for inspecting current test state.
 * Handles:
 * - GET /__scenarist__/state - Get current state for a test ID
 *
 * **PRODUCTION TREE-SHAKING:**
 * In production builds, scenarist is undefined due to conditional exports.
 * When exports are undefined, Next.js treats the route as non-existent.
 * No manual guards needed - the architecture provides safety automatically.
 */

import { scenarist } from "../../../../lib/scenarist";

// In production, scenarist is undefined due to conditional exports
// This makes the exports undefined, and Next.js treats the route as non-existent
export const GET = scenarist?.createStateEndpoint();
