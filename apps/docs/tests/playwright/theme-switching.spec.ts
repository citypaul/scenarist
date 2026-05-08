import { test, expect, type Page } from "@playwright/test";

type Theme = "dark" | "light";
type StoredThemePreference = Theme | "" | null;

type ThemeBootstrapEvent = {
  readonly token: string;
  readonly force: boolean | undefined;
  readonly bodyExists: boolean;
  readonly readyState: DocumentReadyState;
};

declare global {
  interface Window {
    __themeBootstrapEvents?: ThemeBootstrapEvent[];
  }
}

type ThemeBootstrapProbeOptions = {
  readonly page: Page;
  readonly storedTheme: StoredThemePreference;
  readonly systemTheme: Theme;
};

type ThemeBootstrapProbeInit = {
  readonly storedTheme: StoredThemePreference;
  readonly systemTheme: Theme;
};

const findFirstRenderBlockingStyleIndex = (html: string): number =>
  html.search(/<link[^>]+rel="stylesheet"|<style\b/);

const installThemeBootstrapProbe = async ({
  page,
  storedTheme,
  systemTheme,
}: ThemeBootstrapProbeOptions): Promise<void> => {
  await page.addInitScript((options: ThemeBootstrapProbeInit) => {
    const { storedTheme: initialStoredTheme, systemTheme: initialSystemTheme } =
      options;

    if (initialStoredTheme === null) {
      localStorage.removeItem("starlight-theme");
    } else {
      localStorage.setItem("starlight-theme", initialStoredTheme);
    }

    const originalMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query: string): MediaQueryList => {
      if (query === "(prefers-color-scheme: light)") {
        return {
          matches: initialSystemTheme === "light",
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => true,
        };
      }

      return originalMatchMedia(query);
    };

    const originalToggle = DOMTokenList.prototype.toggle;
    DOMTokenList.prototype.toggle = function toggleDarkClass(token, force) {
      if (this === document.documentElement?.classList && token === "dark") {
        const events = window.__themeBootstrapEvents ?? [];
        events.push({
          token,
          force,
          bodyExists: Boolean(document.body),
          readyState: document.readyState,
        });
        window.__themeBootstrapEvents = events;
      }

      return originalToggle.call(this, token, force);
    };
  }, { storedTheme, systemTheme });
};

/**
 * Theme Switching Tests
 *
 * Verifies theme toggle functionality:
 * - Theme toggle works on landing page
 * - Theme persists when navigating to docs
 * - Theme persists when navigating from docs to landing
 * - Theme syncs with Starlight's theme system
 */

test.describe("Theme Switching", () => {
  test("landing page bootstraps theme before body renders without hard-coded dark mode", async ({
    request,
  }) => {
    const response = await request.get("/");
    expect(response.ok()).toBe(true);

    const html = await response.text();
    const themeBootstrapIndex = html.indexOf("data-theme-bootstrap");
    const criticalStyleIndex = html.indexOf("data-theme-critical");
    const bodyIndex = html.indexOf("<body");
    const firstStyleIndex = findFirstRenderBlockingStyleIndex(html);

    expect(html).not.toMatch(/<html[^>]*class="[^"]*\bdark\b[^"]*"/);
    expect(themeBootstrapIndex).toBeGreaterThan(-1);
    expect(criticalStyleIndex).toBeGreaterThan(themeBootstrapIndex);
    expect(html.slice(firstStyleIndex, firstStyleIndex + 120)).toContain(
      "data-theme-critical",
    );
    expect(firstStyleIndex).toBeGreaterThan(themeBootstrapIndex);
    expect(bodyIndex).toBeGreaterThan(themeBootstrapIndex);
  });

  test("docs pages bootstrap theme before render-blocking styles", async ({
    request,
  }) => {
    const response = await request.get("/getting-started/quick-start/");
    expect(response.ok()).toBe(true);

    const html = await response.text();
    const themeBootstrapIndex = html.indexOf("data-starlight-theme-bootstrap");
    const criticalStyleIndex = html.indexOf("data-theme-critical");
    const bodyIndex = html.indexOf("<body");
    const firstStyleIndex = findFirstRenderBlockingStyleIndex(html);

    expect(themeBootstrapIndex).toBeGreaterThan(-1);
    expect(criticalStyleIndex).toBeGreaterThan(themeBootstrapIndex);
    expect(html.slice(firstStyleIndex, firstStyleIndex + 120)).toContain(
      "data-theme-critical",
    );
    expect(firstStyleIndex).toBeGreaterThan(themeBootstrapIndex);
    expect(bodyIndex).toBeGreaterThan(themeBootstrapIndex);
  });

  test("landing page applies stored dark theme before body renders", async ({
    page,
  }) => {
    await installThemeBootstrapProbe({
      page,
      storedTheme: "dark",
      systemTheme: "light",
    });

    await page.goto("/");

    const events = await page.evaluate(
      () => window.__themeBootstrapEvents ?? [],
    );
    expect(events).toContainEqual({
      token: "dark",
      force: true,
      bodyExists: false,
      readyState: "loading",
    });
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("landing page applies stored light theme before body renders", async ({
    page,
  }) => {
    await installThemeBootstrapProbe({
      page,
      storedTheme: "light",
      systemTheme: "dark",
    });

    await page.goto("/");

    const events = await page.evaluate(
      () => window.__themeBootstrapEvents ?? [],
    );
    expect(events).toContainEqual({
      token: "dark",
      force: false,
      bodyExists: false,
      readyState: "loading",
    });
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("landing page applies auto system dark theme before body renders", async ({
    page,
  }) => {
    await installThemeBootstrapProbe({
      page,
      storedTheme: "",
      systemTheme: "dark",
    });

    await page.goto("/");

    const events = await page.evaluate(
      () => window.__themeBootstrapEvents ?? [],
    );
    expect(events).toContainEqual({
      token: "dark",
      force: true,
      bodyExists: false,
      readyState: "loading",
    });
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("landing page applies missing preference system light theme before body renders", async ({
    page,
  }) => {
    await installThemeBootstrapProbe({
      page,
      storedTheme: null,
      systemTheme: "light",
    });

    await page.goto("/");

    const events = await page.evaluate(
      () => window.__themeBootstrapEvents ?? [],
    );
    expect(events).toContainEqual({
      token: "dark",
      force: false,
      bodyExists: false,
      readyState: "loading",
    });
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("theme toggle switches between dark and light", async ({ page }) => {
    // Set dark theme explicitly before navigation
    await page.addInitScript(() => {
      localStorage.setItem("starlight-theme", "dark");
    });

    await page.goto("/");

    // Should start in dark mode
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Click theme toggle
    const themeToggle = page.getByLabel(/Toggle dark mode/i);
    await themeToggle.click();

    // Should now be light mode
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // Toggle back to dark
    await themeToggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("theme persists from landing page to docs", async ({ page }) => {
    // Start on landing page - don't use addInitScript as it persists across navigations
    await page.goto("/");

    // Set dark theme initially via evaluate (only for this page load)
    await page.evaluate(() => localStorage.setItem("starlight-theme", "dark"));
    await page.reload();

    // Should start in dark mode
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Toggle to light mode on landing page
    const themeToggle = page.getByLabel(/Toggle dark mode/i);
    await themeToggle.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // Navigate to docs
    await page.getByRole("link", { name: "Docs", exact: true }).click();
    await expect(page).toHaveURL(/getting-started\/quick-start/);

    // Theme should still be light in docs (Starlight)
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("theme persists from docs to landing page", async ({ page }) => {
    // Start on docs page - don't use addInitScript as it persists across navigations
    await page.goto("/getting-started/quick-start");

    // Set dark theme initially via evaluate (only for this page load)
    await page.evaluate(() => localStorage.setItem("starlight-theme", "dark"));
    await page.reload();

    // Find Starlight's theme toggle - use first() to handle multiple selects
    const starlightThemeToggle = page
      .locator("starlight-theme-select select")
      .first();
    await starlightThemeToggle.selectOption("light");

    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // Verify Starlight stored the theme
    const storedAfterToggle = await page.evaluate(() =>
      localStorage.getItem("starlight-theme"),
    );
    expect(storedAfterToggle).toBe("light");

    // Navigate to landing page by clicking the site title/logo link
    await page.getByRole("link", { name: "Scenarist", exact: true }).click();
    await expect(page).toHaveURL("/");

    // Theme should still be light on landing page
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("theme is stored in localStorage with Starlight key", async ({
    page,
  }) => {
    // Set dark theme explicitly before navigation
    await page.addInitScript(() => {
      localStorage.setItem("starlight-theme", "dark");
    });

    await page.goto("/");

    // Should start in dark mode
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Toggle to light mode
    const themeToggle = page.getByLabel(/Toggle dark mode/i);
    await themeToggle.click();

    // Wait for theme to change
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // Check localStorage uses the correct key
    const storedTheme = await page.evaluate(() =>
      localStorage.getItem("starlight-theme"),
    );
    expect(storedTheme).toBe("light");
  });
});
