/**
 * Sequences Tests - Phase 8.5 Response Sequences
 *
 * Purpose: Demonstrate response sequences (Phase 2 core feature)
 *
 * DEMONSTRATES: Best practices for testing sequence patterns
 * - GitHub polling (repeat: 'last') - stays at final response
 * - Weather cycle (repeat: 'cycle') - loops back to start
 * - Payment limited (repeat: 'none') - falls through after exhaustion
 * - Accessible UI patterns (getByRole, aria-live, progressbar)
 */

import { test, expect } from './fixtures';

test.describe('Sequences - Response Sequences', () => {
  test('should demonstrate GitHub polling sequence with visual progression (repeat: "last")', async ({
    page,
    switchScenario,
  }) => {
    // Switch to GitHub polling scenario
    await switchScenario(page, 'githubPolling');
    await page.goto('/payment');

    // Verify page loaded
    await expect(page.getByRole('heading', { name: 'Response Sequences Demo' })).toBeVisible();

    // First click - pending (0%)
    await page.getByRole('button', { name: 'Check Job Status' }).click();
    const jobStatus = page.getByRole('status').first();
    await expect(jobStatus).toContainText('Job ID: 123');
    await expect(jobStatus).toContainText('Status: pending');
    await expect(jobStatus).toContainText('Progress: 0%');

    // Verify progress bar
    const progressBar = page.getByRole('progressbar');
    await expect(progressBar).toHaveAttribute('aria-valuenow', '0');

    // Second click - processing (50%)
    await page.getByRole('button', { name: 'Check Job Status' }).click();
    await expect(jobStatus).toContainText('Status: processing');
    await expect(jobStatus).toContainText('Progress: 50%');
    await expect(progressBar).toHaveAttribute('aria-valuenow', '50');

    // Third click - complete (100%)
    await page.getByRole('button', { name: 'Check Job Status' }).click();
    await expect(jobStatus).toContainText('Status: complete');
    await expect(jobStatus).toContainText('Progress: 100%');
    await expect(progressBar).toHaveAttribute('aria-valuenow', '100');

    // Fourth click - Demonstrates repeat: 'last' (stays at complete)
    await page.getByRole('button', { name: 'Check Job Status' }).click();
    await expect(jobStatus).toContainText('Status: complete');
    await expect(jobStatus).toContainText('Progress: 100%');
    await expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  test('should demonstrate weather cycle sequence with visual updates (repeat: "cycle")', async ({
    page,
    switchScenario,
  }) => {
    // Switch to weather cycle scenario
    await switchScenario(page, 'weatherCycle');
    await page.goto('/payment');

    const weatherButton = page.getByRole('button', { name: 'Get Weather' });

    // First click - Sunny
    await weatherButton.click();
    const weatherStatus = page.getByRole('status').filter({ hasText: 'City: London' });
    await expect(weatherStatus).toContainText('City: London');
    await expect(weatherStatus).toContainText('Conditions: Sunny');
    await expect(weatherStatus).toContainText('Temperature: 20°C');

    // Second click - Cloudy
    await weatherButton.click();
    await expect(weatherStatus).toContainText('Conditions: Cloudy');
    await expect(weatherStatus).toContainText('Temperature: 18°C');

    // Third click - Rainy
    await weatherButton.click();
    await expect(weatherStatus).toContainText('Conditions: Rainy');
    await expect(weatherStatus).toContainText('Temperature: 15°C');

    // Fourth click - Demonstrates repeat: 'cycle' (back to Sunny)
    await weatherButton.click();
    await expect(weatherStatus).toContainText('Conditions: Sunny');
    await expect(weatherStatus).toContainText('Temperature: 20°C');
  });

  test('should demonstrate payment sequence with exhaustion and error (repeat: "none")', async ({
    page,
    switchScenario,
  }) => {
    // Switch to payment limited scenario
    await switchScenario(page, 'paymentLimited');
    await page.goto('/payment');

    const paymentButton = page.getByRole('button', { name: 'Submit Payment' });

    // First payment - Pending (ch_1)
    await paymentButton.click();
    const paymentStatus = page.getByRole('status').filter({ hasText: 'Payment ID' });
    await expect(paymentStatus).toContainText('Payment ID: ch_1');
    await expect(paymentStatus).toContainText('Status: pending');

    // Second payment - Pending (ch_2)
    await paymentButton.click();
    await expect(paymentStatus).toContainText('Payment ID: ch_2');
    await expect(paymentStatus).toContainText('Status: pending');

    // Third payment - Succeeded (ch_3)
    await paymentButton.click();
    await expect(paymentStatus).toContainText('Payment ID: ch_3');
    await expect(paymentStatus).toContainText('Status: succeeded');

    // Fourth payment - Demonstrates repeat: 'none' (rate limit error)
    await paymentButton.click();
    const errorAlert = page.getByRole('alert').filter({ hasText: 'Payment Failed' });
    await expect(errorAlert).toContainText('Rate limit exceeded');

    // Verify status is no longer visible (replaced by error)
    await expect(paymentStatus).not.toBeVisible();
  });
});
