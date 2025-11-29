import { test, expect, chromium } from "@playwright/test";

/**
 * Scroll Performance Tests
 *
 * Detects scroll jank by measuring frame timing during scroll.
 * Root cause: blur-3xl elements without GPU layer promotion.
 * Fix: Add `will-change: transform` to blur elements.
 */

const JANK_THRESHOLD_MS = 50;
const SEVERE_JANK_THRESHOLD_MS = 100;
const MAX_JANK_FRAMES = 2;

test.describe("Scroll Performance", () => {
  test("blur elements have GPU layer promotion", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const results = await page.locator('[class*="blur-"]').evaluateAll((els) =>
      els.map((el) => ({
        className: el.className.slice(0, 60),
        hasGpuLayer: getComputedStyle(el).willChange.includes("transform"),
      })),
    );

    const missing = results.filter((r) => !r.hasGpuLayer);
    if (missing.length > 0) {
      console.log(
        "Missing will-change-transform:",
        missing.map((m) => m.className),
      );
    }

    expect(
      missing.length,
      "Blur elements need will-change-transform for smooth scroll",
    ).toBe(0);
  });

  test("landing page scrolls without jank", async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500); // Let animations settle

    // Start measuring frame times
    await page.evaluate(() => {
      const g = globalThis as typeof globalThis & { __frames: number[] };
      g.__frames = [];
      let last = performance.now();
      const measure = () => {
        const now = performance.now();
        g.__frames.push(now - last);
        last = now;
        requestAnimationFrame(measure);
      };
      requestAnimationFrame(measure);
    });

    // Scroll down the page
    for (let i = 0; i < 30; i++) {
      await page.mouse.wheel(0, 50);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(100);

    // Collect frame timings
    const frames = await page.evaluate(() => {
      const g = globalThis as typeof globalThis & { __frames: number[] };
      return g.__frames.slice(5, -5); // Trim warmup/cooldown
    });

    const jankFrames = frames.filter((t) => t > JANK_THRESHOLD_MS);
    const severeJank = frames.filter((t) => t > SEVERE_JANK_THRESHOLD_MS);
    const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
    const max = Math.max(...frames);

    console.log(
      `Frames: ${frames.length} | Avg: ${avg.toFixed(1)}ms | Max: ${max.toFixed(1)}ms | Jank: ${jankFrames.length}`,
    );

    expect(
      severeJank.length,
      `Severe jank detected (>${SEVERE_JANK_THRESHOLD_MS}ms)`,
    ).toBe(0);
    expect(
      jankFrames.length,
      `Too many janky frames (>${JANK_THRESHOLD_MS}ms)`,
    ).toBeLessThanOrEqual(MAX_JANK_FRAMES);

    await browser.close();
  });
});
