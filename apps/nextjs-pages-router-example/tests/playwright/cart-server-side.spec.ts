import { test, expect } from "./fixtures";

/**
 * Cart Server-Side Page - Pages Router getServerSideProps with Scenarist
 *
 * Demonstrates:
 * Testing stateful cart functionality with server-side rendering (getServerSideProps)
 *
 * KEY DIFFERENCE FROM CLIENT TESTS:
 * - cart-client-components.spec.ts: Tests client-side cart state management
 * - cart-server-side.spec.ts: Tests server-side cart rendering with getServerSideProps
 *
 * THE VALUE:
 * - ✅ Server-rendered cart shows state immediately (no loading)
 * - ✅ Scenarist stateful mocks work during getServerSideProps
 * - ✅ Test isolation maintained (independent cart per test ID)
 */

test.describe("Cart Page - Server-Side Rendering (getServerSideProps)", () => {
  test("should render cart items server-side after adding products", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "cartWithState");

    // Start on products page and add items
    await page.goto("/");
    const addButtons = page.getByRole("button", { name: /Add .* to cart/ });
    const cartCount = page.getByLabel("Cart item count");

    // Add items (wait between to avoid GET-then-PATCH race)
    await addButtons.nth(0).click();
    await expect(cartCount).toHaveText("1");

    await addButtons.nth(1).click();
    await expect(cartCount).toHaveText("2");

    // Navigate to cart page (should be server-rendered)
    await page.goto("/cart");

    // Verify cart items are visible immediately (server-rendered)
    const cartList = page.getByRole("list", { name: "Shopping cart items" });
    const cartItems = cartList.getByRole("listitem");
    await expect(cartItems).toHaveCount(2);

    // Verify no loading state (proves SSR)
    await expect(page.getByText("Loading cart...")).not.toBeVisible();
  });

  test("should show empty cart message when no items", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "cartWithState");

    // Navigate to empty cart
    await page.goto("/cart");

    // Verify empty cart message appears immediately (server-rendered)
    await expect(page.getByText("Your cart is empty")).toBeVisible();

    // Verify no loading state
    await expect(page.getByText("Loading cart...")).not.toBeVisible();
  });
});

/**
 * TEST RESULTS SHOULD PROVE:
 *
 * ✅ Stateful cart data works with getServerSideProps
 * ✅ Server-rendered cart shows items immediately (no client fetch delay)
 * ✅ Scenarist state capture/injection works during SSR
 * ✅ Test isolation maintained
 */
