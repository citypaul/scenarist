import { expect, test } from "@playwright/test";

/**
 * Analytics Integration Tests
 *
 * Verifies Plausible analytics is properly configured:
 * - Script tag present on all pages with correct attributes
 * - Astro API route proxy endpoints respond correctly
 *
 * These tests run with MOCK_ANALYTICS=true, so proxy endpoints return
 * deterministic mock responses without calling the real Plausible service.
 * This ensures tests are fast, reliable, and don't depend on external services.
 */

test.describe("Analytics", () => {
  test.describe("Script injection", () => {
    test("landing page includes analytics script with correct attributes", async ({
      page,
    }) => {
      await page.goto("/");

      const analyticsScript = page.locator(
        'script[data-domain="scenarist.io"]',
      );
      await expect(analyticsScript).toHaveAttribute("defer", "");
      await expect(analyticsScript).toHaveAttribute("data-api", "/api/event");
      await expect(analyticsScript).toHaveAttribute("src", "/js/script.js");
    });

    test("docs pages include analytics script with correct attributes", async ({
      page,
    }) => {
      await page.goto("/getting-started/quick-start");

      const analyticsScript = page.locator(
        'script[data-domain="scenarist.io"]',
      );
      await expect(analyticsScript).toHaveAttribute("defer", "");
      await expect(analyticsScript).toHaveAttribute("data-api", "/api/event");
      await expect(analyticsScript).toHaveAttribute("src", "/js/script.js");
    });
  });

  test.describe("Proxy endpoints", () => {
    test("/js/script.js returns mock analytics script", async ({ request }) => {
      const response = await request.get("/js/script.js");

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain(
        "application/javascript",
      );

      const body = await response.text();
      // Mock script contains identifiable content
      expect(body).toContain("Mock Plausible Analytics Script");
      expect(body).toContain("window.plausible");
    });

    test("/js/script.js returns cache headers", async ({ request }) => {
      const response = await request.get("/js/script.js");

      const cacheControl = response.headers()["cache-control"];
      expect(cacheControl).toBeTruthy();
      expect(cacheControl).toContain("max-age");
    });

    test("/api/event accepts valid event payload", async ({ request }) => {
      const response = await request.post("/api/event", {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          n: "pageview",
          u: "https://scenarist.io/test",
          d: "scenarist.io",
        },
      });

      // Mock endpoint returns 202 Accepted for valid events
      expect(response.status()).toBe(202);
    });

    test("/api/event rejects invalid event payload", async ({ request }) => {
      const response = await request.post("/api/event", {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          invalid: "data",
        },
      });

      // Mock endpoint returns 400 for missing required fields
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Missing required fields");
    });

    test("/api/event rejects malformed JSON", async ({ request }) => {
      const response = await request.post("/api/event", {
        headers: {
          "Content-Type": "application/json",
        },
        data: "not valid json {{{",
      });

      // Mock endpoint returns 400 for invalid JSON
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid JSON");
    });

    test("/api/event rejects empty body", async ({ request }) => {
      const response = await request.post("/api/event", {
        headers: {
          "Content-Type": "application/json",
        },
        data: "",
      });

      // Mock endpoint returns 400 for empty body (invalid JSON)
      expect(response.status()).toBe(400);
    });
  });
});
