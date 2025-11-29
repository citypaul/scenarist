import { test, chromium } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';
import type { Result } from 'lighthouse';

/**
 * Lighthouse Audit Tests
 *
 * Tests both desktop and mobile configurations for:
 * - Landing page (/)
 * - Quick Start docs page (/getting-started/quick-start)
 *
 * Threshold Strategy:
 * - Local testing shows variance in performance scores (60-100%)
 * - Accessibility, Best Practices, and SEO are more stable
 * - Thresholds are set to catch regressions while accounting for variance
 *
 * For production-accurate scores, run Lighthouse from Chrome DevTools
 * against the deployed site.
 */

const LIGHTHOUSE_PORT = 9222;

const DESKTOP_THRESHOLDS = {
  performance: 95,
  accessibility: 100,
  'best-practices': 100,
  seo: 100,
};

const MOBILE_THRESHOLDS = {
  performance: 95,
  accessibility: 100,
  'best-practices': 100,
  seo: 100,
};

const DESKTOP_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'desktop' as const,
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    emulatedUserAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
};

const MOBILE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'mobile' as const,
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 2.625,
      disabled: false,
    },
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 562.5,
      downloadThroughputKbps: 1474.56,
      uploadThroughputKbps: 675,
    },
    emulatedUserAgent:
      'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  },
};

type AuditResult = {
  lhr: Result;
};

const formatScores = (lhr: Result): string => {
  const categories = lhr.categories;
  return [
    `Performance: ${Math.round((categories.performance?.score ?? 0) * 100)}`,
    `Accessibility: ${Math.round((categories.accessibility?.score ?? 0) * 100)}`,
    `Best Practices: ${Math.round((categories['best-practices']?.score ?? 0) * 100)}`,
    `SEO: ${Math.round((categories.seo?.score ?? 0) * 100)}`,
  ].join(' | ');
};

test.describe('Lighthouse Audits - Landing Page', () => {
  test('Desktop - Perfect scores', async () => {
    const browser = await chromium.launch({
      args: [`--remote-debugging-port=${LIGHTHOUSE_PORT}`],
    });

    const page = await browser.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const result = (await playAudit({
      page,
      port: LIGHTHOUSE_PORT,
      thresholds: DESKTOP_THRESHOLDS,
      config: DESKTOP_CONFIG,
      reports: {
        formats: { html: true },
        name: 'landing-desktop',
        directory: 'lighthouse-reports',
      },
    })) as AuditResult;

    console.log(`Landing Page (Desktop): ${formatScores(result.lhr)}`);

    await browser.close();
  });

  test('Mobile - Perfect scores', async () => {
    const browser = await chromium.launch({
      args: [`--remote-debugging-port=${LIGHTHOUSE_PORT}`],
    });

    const page = await browser.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const result = (await playAudit({
      page,
      port: LIGHTHOUSE_PORT,
      thresholds: MOBILE_THRESHOLDS,
      config: MOBILE_CONFIG,
      reports: {
        formats: { html: true },
        name: 'landing-mobile',
        directory: 'lighthouse-reports',
      },
    })) as AuditResult;

    console.log(`Landing Page (Mobile): ${formatScores(result.lhr)}`);

    await browser.close();
  });
});

test.describe('Lighthouse Audits - Quick Start Page', () => {
  test('Desktop - Perfect scores', async () => {
    const browser = await chromium.launch({
      args: [`--remote-debugging-port=${LIGHTHOUSE_PORT}`],
    });

    const page = await browser.newPage();
    await page.goto('/getting-started/quick-start');
    await page.waitForLoadState('networkidle');

    const result = (await playAudit({
      page,
      port: LIGHTHOUSE_PORT,
      thresholds: DESKTOP_THRESHOLDS,
      config: DESKTOP_CONFIG,
      reports: {
        formats: { html: true },
        name: 'quickstart-desktop',
        directory: 'lighthouse-reports',
      },
    })) as AuditResult;

    console.log(`Quick Start (Desktop): ${formatScores(result.lhr)}`);

    await browser.close();
  });

  test('Mobile - Perfect scores', async () => {
    const browser = await chromium.launch({
      args: [`--remote-debugging-port=${LIGHTHOUSE_PORT}`],
    });

    const page = await browser.newPage();
    await page.goto('/getting-started/quick-start');
    await page.waitForLoadState('networkidle');

    const result = (await playAudit({
      page,
      port: LIGHTHOUSE_PORT,
      thresholds: MOBILE_THRESHOLDS,
      config: MOBILE_CONFIG,
      reports: {
        formats: { html: true },
        name: 'quickstart-mobile',
        directory: 'lighthouse-reports',
      },
    })) as AuditResult;

    console.log(`Quick Start (Mobile): ${formatScores(result.lhr)}`);

    await browser.close();
  });
});
