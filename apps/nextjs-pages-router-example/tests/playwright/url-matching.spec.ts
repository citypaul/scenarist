/**
 * URL Matching Strategies - ATDD Acceptance Tests
 *
 * These tests verify that URL matching strategies work end-to-end:
 * - Native RegExp patterns for URL routing
 * - String strategies (contains, startsWith, endsWith, equals) for URL matching
 * - Combined matching (URL + headers)
 * - Specificity-based selection
 */

import { test, expect } from "./fixtures";

test.describe("URL Matching Strategies - ATDD", () => {
  test.describe.configure({ mode: "serial" });

  /**
   * Test 1: Native RegExp - Numeric ID Filtering
   *
   * Scenario mock matches when URL ends with specific numeric ID:
   * - Match: { url: /\/users\/1$/ }
   *
   * Should match:
   * - '/api/users/1' (ends with exactly "1")
   *
   * Should NOT match:
   * - '/api/users/octocat' (ends with string, not numeric)
   * - '/api/users/123' (ends with different number)
   */
  test("should match URL with numeric ID using native RegExp", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "urlMatching");

    // Navigate with numeric user ID "1"
    await page.goto("/url-matching?test=numericId&userId=1");

    // Verify numeric ID match
    await expect(page.getByText("Matched By: regexNumericId")).toBeVisible();
    await expect(page.getByText("Login: user-numeric-id")).toBeVisible();
    await expect(page.getByText("Followers: 500")).toBeVisible();
  });

  test("should NOT match non-numeric ID (falls back to path param mock)", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "urlMatching");

    // Navigate with non-numeric user ID
    await page.goto("/url-matching?test=numericId&userId=octocat");

    // Should match path parameter mock (not regex numeric mock)
    await expect(page.getByText("ID: octocat").first()).toBeVisible();
    await expect(page.getByText("Login: user-octocat").first()).toBeVisible();
  });

  /**
   * Test 2: Contains Strategy - URLs containing substring
   *
   * Scenario mock matches when URL contains '/london':
   * - Match: { url: { contains: '/london' } }
   *
   * Should match:
   * - URLs containing '/london'
   *
   * Should NOT match:
   * - URLs without '/london' substring
   */
  test("should match URL containing substring using contains strategy", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "urlMatching");

    // Navigate with city that matches contains pattern
    await page.goto("/url-matching?test=contains&city=london");

    // Verify contains match
    await expect(page.getByText("Matched By: containsWeather")).toBeVisible();
    await expect(page.getByText("City: Weather Match City")).toBeVisible();
    await expect(page.getByText("Temperature: 22")).toBeVisible();
  });

  /**
   * Test 3: StartsWith Strategy - API Versioning
   *
   * Scenario mock matches when URL starts with v2:
   * - Match: { url: { startsWith: 'http://localhost:3001/api/weather/v2' } }
   *
   * Should match:
   * - v2 API URLs
   *
   * Should NOT match:
   * - v1 API URLs
   */
  test("should match v2 API URL using startsWith strategy", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "urlMatching");

    // Navigate with v2 version
    await page.goto("/url-matching?test=startsWith&version=v2&city=newyork");

    // Verify v2 match
    await expect(page.getByText("Matched By: startsWithV2")).toBeVisible();
    await expect(page.getByText("City: Version 2 City")).toBeVisible();
  });

  test("should NOT match v1 API URL (fallback)", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "urlMatching");

    // Navigate with v1 version
    await page.goto("/url-matching?test=startsWith&version=v1&city=paris");

    // Should fall back
    await expect(page.getByText("Matched By: fallback")).toBeVisible();
    await expect(page.getByText("City: Fallback City")).toBeVisible();
  });

  /**
   * Test 4: EndsWith Strategy - File Extension Filtering
   *
   * Scenario mock matches when URL ends with '.json':
   * - Match: { url: { endsWith: '.json' } }
   *
   * Should match:
   * - URLs ending with .json
   *
   * Should NOT match:
   * - URLs ending with .txt or other extensions
   */
  test("should match .json file extension using endsWith strategy", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "urlMatching");

    // Navigate with .json file
    await page.goto("/url-matching?test=endsWith&filename=data.json");

    // Verify .json match
    await expect(page.getByText("Matched By: endsWithJson")).toBeVisible();
    await expect(page.getByText("Name: data.json")).toBeVisible();
    await expect(page.getByText("Type: file")).toBeVisible();
  });

  test("should NOT match non-.json file (fallback)", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "urlMatching");

    // Navigate with .txt file
    await page.goto("/url-matching?test=endsWith&filename=readme.txt");

    // Should fall back
    await expect(page.getByText("Matched By: fallback")).toBeVisible();
    await expect(page.getByText("Name: unknown.txt")).toBeVisible();
  });

  /**
   * Test 5: Combined Matching - URL Pattern + Header
   *
   * Scenario mock matches when BOTH URL and header match:
   * - Match: { url: /\/charges$/, headers: { 'x-api-version': '2023-10-16' } }
   *
   * Should match when both conditions met
   * Should NOT match when only URL matches (header mismatch)
   */
  test("should match when both URL and header match", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "urlMatching");

    // Navigate with matching header
    await page.goto("/url-matching?test=combined&apiVersion=2023-10-16");

    // Verify combined match
    await expect(page.getByText("Matched By: combinedUrlHeader")).toBeVisible();
    await expect(page.getByText("Amount: 2000")).toBeVisible();
  });

  test("should NOT match when header doesn't match (fallback)", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "urlMatching");

    // Navigate with non-matching header
    await page.goto("/url-matching?test=combined&apiVersion=2022-11-15");

    // Should fall back
    await expect(page.getByText("Matched By: fallback")).toBeVisible();
    await expect(page.getByText("Amount: 1000")).toBeVisible();
  });

  /**
   * Test 6: Exact URL Match (Backward Compatible)
   *
   * Scenario mock matches exact URL string:
   * - Match: { url: 'http://localhost:3001/api/users/exactuser' }
   *
   * Should match only the exact URL
   */
  test("should match exact URL string", async ({ page, switchScenario }) => {
    await switchScenario(page, "urlMatching");

    // Navigate with exact user
    await page.goto("/url-matching?test=exact&userId=exactuser");

    // Verify exact match
    await expect(page.getByText("Matched By: exactUrl")).toBeVisible();
    await expect(page.getByText("Login: exactuser")).toBeVisible();
    await expect(page.getByText("Followers: 100")).toBeVisible();
  });

  /**
   * Path Parameter Extraction Tests - CRITICAL PROOF OF MSW PARITY
   *
   * These tests verify that path-to-regexp parameter extraction works end-to-end.
   * They should FAIL initially, proving the issue exists.
   *
   * Path parameters use path-to-regexp syntax (same as MSW):
   * - :id - Simple parameter
   * - :id? - Optional parameter
   * - :path+ - Repeating parameter (array)
   * - :id(\d+) - Custom regex parameter
   */
  test.describe("Path Parameter Extraction", () => {
    /**
     * Test 7: Simple Path Parameter - User ID
     *
     * Pattern: /api/users/:id
     * Should extract different IDs and return user-specific data
     */
    test("should extract simple path parameter :id and route to different users", async ({
      page,
      switchScenario,
    }) => {
      await switchScenario(page, "urlMatching");

      // Request user ID 123
      await page.goto("/url-matching?test=pathParam&userId=123");
      await expect(page.getByText("ID: 123").first()).toBeVisible();
      await expect(page.getByText("Login: user-123").first()).toBeVisible();

      // Request different user ID 456
      await page.goto("/url-matching?test=pathParam&userId=456");
      await expect(page.getByText("ID: 456").first()).toBeVisible();
      await expect(page.getByText("Login: user-456").first()).toBeVisible();
    });

    /**
     * Test 8: Multiple Path Parameters
     *
     * Pattern: /api/users/:userId/posts/:postId
     * Should extract both parameters correctly
     */
    test("should extract multiple path parameters :userId and :postId", async ({
      page,
      switchScenario,
    }) => {
      await switchScenario(page, "urlMatching");

      // Request specific user and post
      await page.goto(
        "/url-matching?test=multipleParams&userId=alice&postId=42",
      );
      await expect(page.getByText("User ID: alice")).toBeVisible();
      await expect(page.getByText("Post ID: 42")).toBeVisible();
      await expect(page.getByText("Title: Post 42 by alice")).toBeVisible();
    });

    /**
     * Test 9: Optional Path Parameter
     *
     * Pattern: /api/files/:filename?
     * Should match with or without parameter
     */
    test("should match optional parameter when present", async ({
      page,
      switchScenario,
    }) => {
      await switchScenario(page, "urlMatching");

      // Request with filename
      await page.goto("/url-matching?test=optional&filename=document.txt");
      await expect(page.getByText("Filename: document.txt")).toBeVisible();
    });

    test("should match optional parameter when absent", async ({
      page,
      switchScenario,
    }) => {
      await switchScenario(page, "urlMatching");

      // Request without filename (should still match)
      await page.goto("/url-matching?test=optional&filename=");
      await expect(page.getByText("Filename: default.txt")).toBeVisible();
    });

    /**
     * Test 10: Repeating Path Parameter (Array)
     *
     * Pattern: /api/files/:path+
     * Should extract multiple segments as array
     */
    test("should extract repeating parameter :path+ as array", async ({
      page,
      switchScenario,
    }) => {
      await switchScenario(page, "urlMatching");

      // Request nested path
      await page.goto(
        "/url-matching?test=repeating&path=folder/subfolder/file.txt",
      );
      await expect(
        page.getByText("Path: folder/subfolder/file.txt"),
      ).toBeVisible();
      await expect(page.getByText("Segments: 3")).toBeVisible();
    });

    /**
     * Test 11: Custom Regex Parameter
     *
     * Pattern: /api/orders/:orderId(\d+)
     * Should match only numeric IDs
     */
    test("should match custom regex parameter with valid value", async ({
      page,
      switchScenario,
    }) => {
      await switchScenario(page, "urlMatching");

      // Request with numeric order ID
      await page.goto("/url-matching?test=customRegex&orderId=12345");
      await expect(page.getByText("Order ID: 12345")).toBeVisible();
      await expect(page.getByText("Status: processing")).toBeVisible();
    });

    test("should NOT match custom regex parameter with invalid value", async ({
      page,
      switchScenario,
    }) => {
      await switchScenario(page, "urlMatching");

      // Request with non-numeric order ID (should fallback)
      await page.goto("/url-matching?test=customRegex&orderId=abc-123");
      await expect(page.getByText("Matched By: fallback")).toBeVisible();
    });
  });
});
