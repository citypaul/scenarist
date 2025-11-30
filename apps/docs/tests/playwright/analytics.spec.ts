import { expect, test } from "@playwright/test";

/**
 * Analytics Integration Tests
 *
 * Verifies Plausible analytics is properly configured:
 * - Script tag present on all pages with correct attributes
 * - Astro API route proxy endpoints respond correctly
 *
 * Note: Proxy endpoint tests accept BOTH real Plausible responses AND fallback
 * responses. The proxy's job is to either succeed or gracefully degrade - both
 * are valid behaviors. This ensures tests are stable regardless of external
 * service availability (e.g., in CI environments with network restrictions).
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
    test("/js/script.js returns JavaScript content", async ({ request }) => {
      const response = await request.get("/js/script.js");

      // Proxy returns 200 whether Plausible is reachable or not (fallback script)
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain(
        "application/javascript",
      );

      const body = await response.text();
      expect(body.length).toBeGreaterThan(0);

      // Verify it's either the real script or our fallback
      const isRealScript = body.includes("plausible");
      const isFallbackScript = body.includes("Analytics unavailable");
      expect(isRealScript || isFallbackScript).toBe(true);
    });

    test("/js/script.js returns cache headers", async ({ request }) => {
      const response = await request.get("/js/script.js");

      // Should have cache-control header (either from Plausible or fallback)
      const cacheControl = response.headers()["cache-control"];
      expect(cacheControl).toBeTruthy();
      expect(cacheControl).toContain("max-age");
    });

    test("/api/event responds to valid event payload", async ({ request }) => {
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

      // Accept either:
      // - 202 Accepted (Plausible received the event)
      // - 503 Service Unavailable (fallback when Plausible unreachable)
      const status = response.status();
      expect(status === 202 || status === 503).toBe(true);

      if (status === 503) {
        const body = await response.json();
        expect(body.error).toBe("Analytics unavailable");
      }
    });

    test("/api/event responds to invalid event payload", async ({
      request,
    }) => {
      const response = await request.post("/api/event", {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          invalid: "data",
        },
      });

      // Accept either:
      // - 400 Bad Request (Plausible rejected invalid payload)
      // - 503 Service Unavailable (fallback when Plausible unreachable)
      const status = response.status();
      expect(status === 400 || status === 503).toBe(true);
    });

    test("/api/event handles malformed JSON gracefully", async ({
      request,
    }) => {
      const response = await request.post("/api/event", {
        headers: {
          "Content-Type": "application/json",
        },
        data: "not valid json {{{",
      });

      // Should return a client or server error, not crash
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(600);
    });

    test("/api/event handles empty body gracefully", async ({ request }) => {
      const response = await request.post("/api/event", {
        headers: {
          "Content-Type": "application/json",
        },
        data: "",
      });

      // Should return a client or server error, not crash
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(600);
    });
  });
});
