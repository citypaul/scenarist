import { test, expect, devices } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Axe Accessibility Tests
 *
 * Comprehensive accessibility testing using axe-core for:
 * - Landing page (/)
 * - Quick Start docs page (/getting-started/quick-start)
 *
 * Tests run on both desktop and mobile viewports to catch
 * responsive accessibility issues.
 *
 * These tests complement Lighthouse accessibility audits with
 * more detailed violation reporting.
 */

/**
 * Pages to test for accessibility
 *
 * Organized by the custom Starlight components they contain:
 * - Tabs/TabItem: Interactive tab components (contrast, keyboard navigation)
 * - Card/CardGrid: Card layouts
 * - Aside: Warning/note boxes
 * - FileTree: File structure diagrams
 * - LinkCard: Link cards
 */
const PAGES = [
  // Core pages (basic structure)
  { name: "Landing Page", url: "/" },
  { name: "Quick Start Page", url: "/getting-started/quick-start" },

  // Pages with Tabs component (primary concern for contrast)
  { name: "Philosophy Page (Tabs)", url: "/concepts/philosophy" },
  { name: "Best Practices Page (Tabs)", url: "/testing/best-practices" },
  {
    name: "RSC Guide Page (Tabs)",
    url: "/frameworks/nextjs-app-router/rsc-guide",
  },

  // Pages with FileTree component
  {
    name: "Express Example App (FileTree)",
    url: "/frameworks/express/example-app",
  },
  {
    name: "Next.js App Router Example (FileTree)",
    url: "/frameworks/nextjs-app-router/example-app",
  },
  {
    name: "Next.js Pages Router Example (FileTree)",
    url: "/frameworks/nextjs-pages-router/example-app",
  },

  // Pages with Card/CardGrid + Aside
  {
    name: "Database Testing Guide (Card)",
    url: "/guides/testing-database-apps",
  },
  { name: "Production Safety (Aside)", url: "/concepts/production-safety" },
];

const VIEWPORTS = [
  { name: "Desktop", viewport: { width: 1280, height: 720 } },
  { name: "Mobile", viewport: devices["iPhone 12"].viewport },
];

test.describe("Accessibility - axe-core audits", () => {
  for (const testPage of PAGES) {
    for (const device of VIEWPORTS) {
      test(`${testPage.name} - ${device.name} - should have no accessibility violations`, async ({
        browser,
      }) => {
        const context = await browser.newContext({
          viewport: device.viewport,
        });
        const page = await context.newPage();

        await page.goto(testPage.url);
        await page.waitForLoadState("networkidle");

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();

        if (accessibilityScanResults.violations.length > 0) {
          console.log(`\n${"=".repeat(60)}`);
          console.log(
            `Accessibility Violations: ${testPage.name} (${device.name})`,
          );
          console.log("=".repeat(60));

          for (const violation of accessibilityScanResults.violations) {
            console.log(
              `\n[${violation.impact?.toUpperCase()}] ${violation.id}`,
            );
            console.log(`  Description: ${violation.description}`);
            console.log(`  Help: ${violation.help}`);
            console.log(`  Help URL: ${violation.helpUrl}`);
            console.log(`  Affected nodes:`);
            for (const node of violation.nodes) {
              console.log(`    - ${node.html}`);
              console.log(`      Target: ${node.target.join(" > ")}`);
              if (node.failureSummary) {
                console.log(`      Fix: ${node.failureSummary}`);
              }
            }
          }
          console.log("\n");
        }

        expect(
          accessibilityScanResults.violations,
          `Found ${accessibilityScanResults.violations.length} accessibility violations`,
        ).toEqual([]);

        await context.close();
      });
    }
  }
});

test.describe("Accessibility - Specific checks", () => {
  test("Landing Page - all interactive elements should be keyboard accessible", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const interactiveElements = await page
      .locator('a, button, [role="button"]')
      .all();

    for (const element of interactiveElements) {
      const isVisible = await element.isVisible();
      if (isVisible) {
        const tabIndex = await element.getAttribute("tabindex");
        expect(
          tabIndex === null || Number(tabIndex) >= 0,
          `Element should be keyboard accessible: ${await element.innerHTML()}`,
        ).toBeTruthy();
      }
    }
  });

  test("Landing Page - all images should have alt text", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const images = await page.locator("img").all();

    for (const img of images) {
      const alt = await img.getAttribute("alt");
      const role = await img.getAttribute("role");
      const ariaHidden = await img.getAttribute("aria-hidden");

      const hasAlt = alt !== null;
      const isDecorative = role === "presentation" || ariaHidden === "true";

      expect(
        hasAlt || isDecorative,
        `Image should have alt text or be marked decorative: ${await img.getAttribute("src")}`,
      ).toBeTruthy();
    }
  });

  test("All pages should have proper document structure", async ({ page }) => {
    for (const testPage of PAGES) {
      await page.goto(testPage.url);
      await page.waitForLoadState("networkidle");

      const h1Count = await page.locator("h1").count();
      expect(
        h1Count,
        `${testPage.name} should have at least one h1`,
      ).toBeGreaterThanOrEqual(1);

      const htmlLang = await page.locator("html").getAttribute("lang");
      expect(
        htmlLang,
        `${testPage.name} should have lang attribute`,
      ).toBeTruthy();

      const main = await page.locator("main").count();
      expect(
        main,
        `${testPage.name} should have a main element`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  test("Focus should be visible on interactive elements", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });
});
