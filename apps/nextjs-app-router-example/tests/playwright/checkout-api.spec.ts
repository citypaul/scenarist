import { test, expect } from './fixtures';

test.describe('Checkout Page - API Route Abstraction Approach', () => {
  test('[DB-API] Premium user checkout - shows 20% discount, full cart, order history', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'premiumUserCheckout');

    await page.goto('/checkout-api?userId=user-1');

    // User info
    await expect(page.getByRole('heading', { name: 'Welcome, Jane Premium' })).toBeVisible();
    await expect(page.getByText('premium@example.com')).toBeVisible();
    await expect(page.getByText('⭐ Premium Member')).toBeVisible();

    // Cart items (3 items)
    await expect(page.getByRole('heading', { name: 'Your Cart (3 items)' })).toBeVisible();
    await expect(page.getByText('Premium Headphones')).toBeVisible();
    await expect(page.getByText('Wireless Mouse')).toBeVisible();
    await expect(page.getByText('Mechanical Keyboard')).toBeVisible();

    // Pricing with discount
    await expect(page.getByText('Subtotal: £430.00')).toBeVisible(); // (150*2 + 80 + 120)
    await expect(page.getByText('Premium Discount (20%): -£86.00')).toBeVisible();
    await expect(page.getByText('Total: £344.00')).toBeVisible();

    // Order history (5 orders)
    await expect(page.getByRole('heading', { name: 'Order History' })).toBeVisible();
    const orders = page.locator('.order-item');
    await expect(orders).toHaveCount(5);
    await expect(orders.first()).toContainText('delivered');

    // Recommendations (premium)
    await expect(page.getByText('Premium Laptop Stand')).toBeVisible();
    await expect(page.getByText('Premium USB-C Hub')).toBeVisible();
    await expect(page.getByText('Premium Desk Mat')).toBeVisible();
  });

  test('[DB-API] Standard user first-time checkout - no discount, minimal cart, first order message', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'standardUserCheckout');

    await page.goto('/checkout-api?userId=user-1');

    // User info
    await expect(page.getByRole('heading', { name: 'Welcome, John Standard' })).toBeVisible();
    await expect(page.getByText('standard@example.com')).toBeVisible();
    await expect(page.getByText('Standard Member')).toBeVisible();

    // Cart items (1 item)
    await expect(page.getByRole('heading', { name: 'Your Cart (1 items)' })).toBeVisible();
    await expect(page.getByText('Premium Headphones')).toBeVisible();

    // Pricing without discount
    await expect(page.getByText('Subtotal: £150.00')).toBeVisible();
    await expect(page.getByText('Premium Discount')).not.toBeVisible();
    await expect(page.getByText('Total: £150.00')).toBeVisible();

    // Order history (empty - first order)
    await expect(page.getByText('This is your first order! 🎉')).toBeVisible();

    // Recommendations (standard)
    await expect(page.getByText('Basic Mouse Pad')).toBeVisible();
    await expect(page.getByText('Basic Cable Organizer')).toBeVisible();
    await expect(page.getByText('Premium Laptop Stand')).not.toBeVisible(); // Premium recs not shown
  });
});
