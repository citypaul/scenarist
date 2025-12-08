import { test, expect } from "./fixtures";

/**
 * Authentication Flow Tests - React Server Components with Scenarist
 *
 * This test file demonstrates authentication flow testing with Scenarist:
 * - Protected routes with server-side auth checks
 * - Login page with redirect handling
 * - Scenario-based switching between authenticated/unauthenticated states
 *
 * Architecture:
 * - /protected layout performs server-side auth check via external API
 * - Auth helper calls http://localhost:3001/auth/me (mocked by Scenarist)
 * - Unauthenticated users are redirected to /login
 *
 * No Jest needed - testing React Server Components with Playwright + Scenarist!
 */

test.describe("Authentication Flow - Protected Routes", () => {
  test("should render protected content when authenticated", async ({
    page,
    switchScenario,
  }) => {
    // Switch to authenticated user scenario
    await switchScenario(page, "authenticatedUser");

    // Navigate to protected route
    await page.goto("/protected");

    // Verify protected content is visible
    await expect(
      page.getByRole("heading", { name: "Protected Dashboard" }),
    ).toBeVisible();

    // Verify user info is displayed
    await expect(page.getByText("test@example.com")).toBeVisible();
    await expect(page.getByText("Welcome, Test User")).toBeVisible();
  });

  test("should redirect to login when not authenticated", async ({
    page,
    switchScenario,
  }) => {
    // Switch to unauthenticated user scenario
    await switchScenario(page, "unauthenticatedUser");

    // Navigate to protected route
    await page.goto("/protected");

    // Should be redirected to login page with redirect query param
    await expect(page).toHaveURL(/\/login\?from=%2Fprotected/);

    // Verify login page content
    await expect(
      page.getByRole("heading", { name: "Sign In" }),
    ).toBeVisible();
  });

  test("should show redirect message on login page when redirected", async ({
    page,
    switchScenario,
  }) => {
    // Switch to unauthenticated user scenario
    await switchScenario(page, "unauthenticatedUser");

    // Navigate to protected route (which redirects to login)
    await page.goto("/protected");

    // Verify redirect message is shown
    await expect(
      page.getByText("Please sign in to access the protected page"),
    ).toBeVisible();
  });
});

test.describe("Authentication Flow - Login Page", () => {
  test("should render login form", async ({ page, switchScenario }) => {
    // Login page should always be accessible
    await switchScenario(page, "unauthenticatedUser");

    // Navigate directly to login page
    await page.goto("/login");

    // Verify login form elements
    await expect(
      page.getByRole("heading", { name: "Sign In" }),
    ).toBeVisible();

    // Verify email and password fields exist
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();

    // Verify submit button exists
    await expect(
      page.getByRole("button", { name: "Sign In" }),
    ).toBeVisible();
  });

  test("should not show redirect message when accessing login directly", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "unauthenticatedUser");

    // Navigate directly to login page (no ?from param)
    await page.goto("/login");

    // Verify NO redirect message is shown
    await expect(
      page.getByText("Please sign in to access the protected page"),
    ).not.toBeVisible();
  });
});

test.describe("Authentication Flow - Scenario Switching", () => {
  test("should switch between authenticated and unauthenticated states at runtime", async ({
    page,
    switchScenario,
  }) => {
    // Start as authenticated user
    await switchScenario(page, "authenticatedUser");
    await page.goto("/protected");

    // Verify we see protected content
    await expect(
      page.getByRole("heading", { name: "Protected Dashboard" }),
    ).toBeVisible();

    // Switch to unauthenticated (simulating session expiry)
    await switchScenario(page, "unauthenticatedUser");

    // Reload the page
    await page.reload();

    // Now we should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });
});

/**
 * TEST RESULTS WILL PROVE:
 *
 * ✅ Protected routes work with server-side auth checks
 * ✅ Redirect flow works correctly (protected → login with ?from param)
 * ✅ Scenario switching allows testing both authenticated and unauthenticated states
 * ✅ No Jest issues - React Server Components are fully testable
 * ✅ Same code path works in test and production
 */
