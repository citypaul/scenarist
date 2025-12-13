import { expect, test } from "@playwright/test";

/**
 * Landing Page Tests
 *
 * Verifies the landing page renders correctly and key features work:
 * - Page loads with correct content
 * - Install command with framework/package manager selection
 * - Copy functionality
 * - Navigation to docs
 */

test.describe("Landing Page", () => {
  test("renders with correct headline and content", async ({ page }) => {
    await page.goto("/");

    // Verify headline
    await expect(
      page.getByRole("heading", { name: /Test Reality/i }),
    ).toBeVisible();

    // Verify default install command is visible (pnpm + Next.js)
    await expect(
      page.getByText("pnpm add @scenarist/nextjs-adapter msw"),
    ).toBeVisible();

    // Verify tagline is visible
    await expect(
      page.getByText(/Playwright tests that hit your real server/i),
    ).toBeVisible();
  });

  test("has correct page title", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Scenarist/i);
  });

  test.describe("Install Command Tabs", () => {
    test("defaults to Next.js and pnpm", async ({ page }) => {
      await page.goto("/");

      // Verify default command is visible
      await expect(
        page.getByText("pnpm add @scenarist/nextjs-adapter msw"),
      ).toBeVisible();
    });

    test("switching to Express updates command", async ({ page }) => {
      await page.goto("/");

      // Click Express tab
      await page.getByRole("button", { name: "Express" }).first().click();

      // Verify command updated to express-adapter
      await expect(
        page.getByText("pnpm add @scenarist/express-adapter msw"),
      ).toBeVisible();
    });

    test("switching package manager to npm updates command", async ({
      page,
    }) => {
      await page.goto("/");

      // Click npm tab (exact match to avoid matching "pnpm")
      await page.getByRole("button", { name: "npm", exact: true }).click();

      // Verify command updated to npm install
      await expect(
        page.getByText("npm install @scenarist/nextjs-adapter msw"),
      ).toBeVisible();
    });

    test("switching package manager to yarn updates command", async ({
      page,
    }) => {
      await page.goto("/");

      // Click yarn tab
      await page.getByRole("button", { name: "yarn" }).click();

      // Verify command updated to yarn add
      await expect(
        page.getByText("yarn add @scenarist/nextjs-adapter msw"),
      ).toBeVisible();
    });

    test("combining Express and npm shows correct command", async ({
      page,
    }) => {
      await page.goto("/");

      // Click Express tab
      await page.getByRole("button", { name: "Express" }).first().click();

      // Click npm tab (exact match to avoid matching "pnpm")
      await page.getByRole("button", { name: "npm", exact: true }).click();

      // Verify combined command
      await expect(
        page.getByText("npm install @scenarist/express-adapter msw"),
      ).toBeVisible();
    });
  });

  test.describe("Copy Install Command", () => {
    test("copy button copies current command to clipboard", async ({
      page,
      context,
    }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.goto("/");

      // Click the install command button (contains the command text)
      const copyButton = page.getByRole("button", {
        name: /pnpm add @scenarist\/nextjs-adapter msw/,
      });
      await copyButton.click();

      // Verify clipboard content (default: pnpm + Next.js)
      const clipboardText = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );
      expect(clipboardText).toBe("pnpm add @scenarist/nextjs-adapter msw");
    });

    test("copy button copies updated command after switching tabs", async ({
      page,
      context,
    }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.goto("/");

      // Switch to Express + yarn
      await page.getByRole("button", { name: "Express" }).first().click();
      await page.getByRole("button", { name: "yarn" }).click();

      // Click the install command button (now contains yarn command)
      const copyButton = page.getByRole("button", {
        name: /yarn add @scenarist\/express-adapter msw/,
      });
      await copyButton.click();

      // Verify clipboard has updated command
      const clipboardText = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );
      expect(clipboardText).toBe("yarn add @scenarist/express-adapter msw");
    });
  });

  test("docs link navigates to documentation", async ({ page }) => {
    await page.goto("/");

    // Click the Docs link in navigation (use exact match to avoid "Read the Docs" link)
    await page.getByRole("link", { name: "Docs", exact: true }).click();

    // Should navigate to quick-start page
    await expect(page).toHaveURL(/getting-started\/quick-start/);

    // Verify we're on the docs page (Starlight layout)
    await expect(
      page.getByRole("heading", { name: /Quick Start/i }),
    ).toBeVisible();
  });
});
