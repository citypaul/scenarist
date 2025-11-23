/**
 * Next.js Instrumentation Hook
 *
 * This file is loaded once when the server starts (before any pages render).
 * It's the ideal place to initialize MSW for server-side scenarios.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // MSW requires Node.js APIs not available in Edge runtime
  // NEXT_RUNTIME can be: 'nodejs', 'edge', or undefined (default)
  //
  // Why this isn't a problem:
  // 1. Tests always use Node.js runtime (where Scenarist works)
  // 2. Production tree-shakes Scenarist completely (0kb bundle)
  // 3. Edge Functions can't be tested with Scenarist, but that's a
  //    fundamental limitation of MSW (requires Node.js fs, crypto, etc.)
  // 4. If you deploy Route Handlers to Edge, they won't have Scenarist
  //    in production anyway (tree-shaken), so this only affects testing
  //
  // Bottom line: Test with Node.js runtime, deploy to Edge if needed.
  // Scenarist won't interfere either way.
  if (process.env.NEXT_RUNTIME !== 'edge') {
    // Import and start scenarist on server startup
    // This ensures MSW is ready before Server Components fetch data
    await import('./lib/scenarist');
  }
}
