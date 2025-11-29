import { test, expect, chromium } from "@playwright/test";

/**
 * Scroll Performance Tests
 *
 * Verifies that the landing page scrolls smoothly without jank.
 *
 * This test suite was added to catch performance regressions from:
 * - Large CSS blur effects without GPU acceleration
 * - Continuous animations on expensive elements
 * - Fixed-position elements with complex filters
 *
 * Root cause: blur-3xl elements without GPU layer promotion cause expensive
 * repaint operations on every animation frame. The fix is to add
 * `will-change: transform` to promote these elements to their own GPU layers.
 */

test.describe("Scroll Performance", () => {
  test("blur elements have GPU layer promotion for smooth scrolling", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const blurElements = await page.locator('[class*="blur-"]').all();

    expect(blurElements.length).toBeGreaterThan(0);

    const elementsWithGpuAcceleration: string[] = [];
    const elementsWithoutGpuAcceleration: string[] = [];

    for (const element of blurElements) {
      const computedStyle = await element.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          willChange: style.willChange,
          transform: style.transform,
          className: el.className,
        };
      });

      const hasGpuAcceleration =
        computedStyle.willChange === "transform" ||
        computedStyle.willChange.includes("transform") ||
        (computedStyle.transform !== "none" && computedStyle.transform !== "");

      const elementDesc = computedStyle.className.slice(0, 80);

      if (hasGpuAcceleration) {
        elementsWithGpuAcceleration.push(elementDesc);
      } else {
        elementsWithoutGpuAcceleration.push(elementDesc);
      }
    }

    console.log(
      `Blur elements with GPU acceleration: ${elementsWithGpuAcceleration.length}`,
    );
    console.log(
      `Blur elements without GPU acceleration: ${elementsWithoutGpuAcceleration.length}`,
    );

    if (elementsWithoutGpuAcceleration.length > 0) {
      console.log("Elements missing GPU acceleration:");
      elementsWithoutGpuAcceleration.forEach((el) => console.log(`  - ${el}`));
    }

    expect(
      elementsWithoutGpuAcceleration.length,
      `Found ${elementsWithoutGpuAcceleration.length} blur elements without GPU acceleration. ` +
        `Add 'will-change: transform' or 'transform: translateZ(0)' to these elements to prevent scroll jank.`,
    ).toBe(0);
  });

  test("landing page scrolls smoothly without severe jank", async () => {
    const browser = await chromium.launch({
      args: ["--enable-gpu", "--disable-software-rasterizer"],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => {
      const win = window as unknown as { __frameTimings: number[] };
      win.__frameTimings = [];
      const timings = win.__frameTimings;

      let lastTime = performance.now();

      const measureFrame = () => {
        const now = performance.now();
        const delta = now - lastTime;
        timings.push(delta);
        lastTime = now;
        requestAnimationFrame(measureFrame);
      };

      requestAnimationFrame(measureFrame);
    });

    await page.waitForTimeout(50);

    const scrollDistance = 1500;
    const scrollSteps = 30;
    const stepDelay = 16;

    for (let i = 0; i < scrollSteps; i++) {
      await page.mouse.wheel(0, scrollDistance / scrollSteps);
      await page.waitForTimeout(stepDelay);
    }

    await page.waitForTimeout(200);

    const measuredFrameTimings = await page.evaluate(() => {
      const win = window as unknown as { __frameTimings: number[] };
      return win.__frameTimings;
    });

    const scrollFrames = measuredFrameTimings.slice(5, -5);

    const JANK_THRESHOLD_MS = 50;
    const jankFrames = scrollFrames.filter(
      (timing) => timing > JANK_THRESHOLD_MS,
    );

    const avgFrameTime =
      scrollFrames.reduce((a, b) => a + b, 0) / scrollFrames.length;
    const maxFrameTime = Math.max(...scrollFrames);

    console.log(`Total frames measured: ${scrollFrames.length}`);
    console.log(`Average frame time: ${avgFrameTime.toFixed(1)}ms`);
    console.log(`Max frame time: ${maxFrameTime.toFixed(1)}ms`);
    console.log(
      `Frames exceeding ${JANK_THRESHOLD_MS}ms: ${jankFrames.length}`,
    );
    if (jankFrames.length > 0) {
      console.log(
        `Jank frame timings: ${jankFrames.map((t) => t.toFixed(1)).join("ms, ")}ms`,
      );
    }

    const MAX_JANK_FRAMES = 2;
    const SEVERE_JANK_THRESHOLD_MS = 100;
    const severeJankFrames = scrollFrames.filter(
      (timing) => timing > SEVERE_JANK_THRESHOLD_MS,
    );

    expect(
      severeJankFrames.length,
      `Found ${severeJankFrames.length} severely janky frames (>${SEVERE_JANK_THRESHOLD_MS}ms). ` +
        `This indicates major scroll performance issues. Max frame time: ${maxFrameTime.toFixed(1)}ms.`,
    ).toBe(0);

    expect(
      jankFrames.length,
      `Found ${jankFrames.length} janky frames (>${JANK_THRESHOLD_MS}ms), max allowed is ${MAX_JANK_FRAMES}. ` +
        `This may indicate scroll performance issues from un-accelerated blur effects.`,
    ).toBeLessThanOrEqual(MAX_JANK_FRAMES);

    await browser.close();
  });
});
