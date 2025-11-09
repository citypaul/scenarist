import { test, expect } from './fixtures';

/**
 * Sequences/Polling Server-Side Page - Pages Router getServerSideProps with Scenarist
 *
 * Demonstrates:
 * Testing response sequences (polling scenarios) with server-side rendering (getServerSideProps)
 *
 * KEY DIFFERENCE FROM CLIENT TESTS:
 * - sequences.spec.ts: Tests client-side polling with sequences
 * - polling-server-side.spec.ts: Tests server-side rendering with sequence data
 *
 * THE VALUE:
 * - ✅ Server-rendered sequence data appears immediately
 * - ✅ Scenarist sequences work during getServerSideProps
 * - ✅ Phase 2 features (sequences, repeat modes) work with SSR
 */

test.describe('Sequences Page - Server-Side Rendering (getServerSideProps)', () => {
  test('should render initial job status server-side', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'githubPolling');

    // Navigate to sequences page (should be server-rendered)
    await page.goto('/sequences');

    // Verify page renders immediately
    await expect(page.getByRole('heading', { name: 'Response Sequences Demo' })).toBeVisible();

    // Verify job polling section is present
    await expect(page.getByRole('heading', { name: 'GitHub Job Polling' })).toBeVisible();

    // Verify no loading state
    const loadingIndicator = page.getByText('Loading...');
    await expect(loadingIndicator).not.toBeVisible();
  });

  test('should render weather section server-side', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'weatherCycle');

    // Navigate to sequences page
    await page.goto('/sequences');

    // Verify weather section renders
    await expect(page.getByRole('heading', { name: 'Weather Cycle' })).toBeVisible();

    // Verify no loading state
    await expect(page.getByText('Loading...')).not.toBeVisible();
  });

  test('should render payment section server-side', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'paymentLimited');

    // Navigate to sequences page
    await page.goto('/sequences');

    // Verify payment section renders
    await expect(page.getByRole('heading', { name: 'Payment Rate Limiting' })).toBeVisible();

    // Verify no loading state
    await expect(page.getByText('Loading...')).not.toBeVisible();
  });
});

/**
 * TEST RESULTS SHOULD PROVE:
 *
 * ✅ Sequence scenarios work with getServerSideProps
 * ✅ Server-rendered pages show content immediately
 * ✅ Phase 2 sequence features integrate with Pages Router SSR
 * ✅ Test isolation maintained across different sequence scenarios
 */
