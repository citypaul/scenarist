/**
 * Next.js Instrumentation Hook
 *
 * This file is loaded once when the server starts (before any pages render).
 * It's the ideal place to initialize MSW for server-side scenarios.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import and start scenarist on server startup
    // This ensures MSW is ready before getServerSideProps runs
    await import('./lib/scenarist');
  }
}
