/**
 * PayFlow Scenarist Scenarios
 *
 * This file defines all scenarios for testing PayFlow with Scenarist.
 * Each scenario configures mock responses for the four backend services:
 * - User Service (GET /users/current)
 * - Inventory Service (GET /inventory)
 * - Shipping Service (GET /shipping)
 * - Payment Service (POST /payments)
 *
 * All services are on localhost:3001 (json-server).
 */

import type {
  ScenaristScenario,
  ScenaristScenarios,
} from "@scenarist/nextjs-adapter/app";

// Common mock data for reuse across scenarios
const PRO_USER = {
  id: "current",
  email: "demo@payflow.com",
  name: "Demo User",
  tier: "pro",
} as const;

const FREE_USER = {
  id: "current",
  email: "demo@payflow.com",
  name: "Demo User",
  tier: "free",
} as const;

const INVENTORY_IN_STOCK = [
  { id: "1", productId: "1", quantity: 50, reserved: 0 },
  { id: "2", productId: "2", quantity: 15, reserved: 0 },
  { id: "3", productId: "3", quantity: 3, reserved: 0 },
] as const;

const INVENTORY_SOLD_OUT = [
  { id: "1", productId: "1", quantity: 0, reserved: 0 },
  { id: "2", productId: "2", quantity: 0, reserved: 0 },
  { id: "3", productId: "3", quantity: 0, reserved: 0 },
] as const;

const INVENTORY_LOW_STOCK = [
  { id: "1", productId: "1", quantity: 3, reserved: 0 },
  { id: "2", productId: "2", quantity: 3, reserved: 0 },
  { id: "3", productId: "3", quantity: 3, reserved: 0 },
] as const;

const ALL_SHIPPING_OPTIONS = [
  {
    id: "standard",
    name: "Standard Shipping",
    price: 5.99,
    estimatedDays: "5-7 business days",
  },
  {
    id: "express",
    name: "Express Shipping",
    price: 14.99,
    estimatedDays: "2-3 business days",
  },
  {
    id: "overnight",
    name: "Overnight Shipping",
    price: 29.99,
    estimatedDays: "Next business day",
  },
] as const;

const STANDARD_SHIPPING_ONLY = [
  {
    id: "standard",
    name: "Standard Shipping",
    price: 5.99,
    estimatedDays: "5-7 business days",
  },
] as const;

const PAYMENT_SUCCESS = {
  id: "pay_success_123",
  status: "succeeded",
  amount: 0,
  currency: "usd",
  createdAt: new Date().toISOString(),
} as const;

// ============================================================================
// SCENARIO DEFINITIONS
// ============================================================================

/**
 * Default - Happy Path (Pro Member)
 *
 * Pro user with 20% discount, all items in stock, all shipping options,
 * payment succeeds.
 */
export const defaultScenario: ScenaristScenario = {
  id: "default",
  name: "Happy Path - Pro User",
  description: "Pro user with discount, items in stock, payment succeeds",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: PRO_USER,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/inventory",
      response: {
        status: 200,
        body: INVENTORY_IN_STOCK,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/shipping",
      response: {
        status: 200,
        body: ALL_SHIPPING_OPTIONS,
      },
    },
    {
      method: "POST",
      url: "http://localhost:3001/payments",
      response: {
        status: 200,
        body: PAYMENT_SUCCESS,
      },
    },
  ],
};

/**
 * Free User - No Discount
 *
 * Free user pays full price, everything else is normal.
 */
export const freeUserScenario: ScenaristScenario = {
  id: "freeUser",
  name: "Free User - No Discount",
  description: "Free user pays full price, items in stock",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: FREE_USER,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/inventory",
      response: {
        status: 200,
        body: INVENTORY_IN_STOCK,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/shipping",
      response: {
        status: 200,
        body: ALL_SHIPPING_OPTIONS,
      },
    },
    {
      method: "POST",
      url: "http://localhost:3001/payments",
      response: {
        status: 200,
        body: PAYMENT_SUCCESS,
      },
    },
  ],
};

/**
 * Sold Out - No Stock
 *
 * All products show "Sold Out" badge, cannot add to cart.
 */
export const soldOutScenario: ScenaristScenario = {
  id: "soldOut",
  name: "Sold Out - No Stock",
  description: "All products are sold out",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: PRO_USER,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/inventory",
      response: {
        status: 200,
        body: INVENTORY_SOLD_OUT,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/shipping",
      response: {
        status: 200,
        body: ALL_SHIPPING_OPTIONS,
      },
    },
  ],
};

/**
 * Low Stock - Urgency Messaging
 *
 * Products show "Only 3 left!" badge to create urgency.
 */
export const lowStockScenario: ScenaristScenario = {
  id: "lowStock",
  name: "Low Stock - Urgency",
  description: "Low stock shows urgency messaging",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: PRO_USER,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/inventory",
      response: {
        status: 200,
        body: INVENTORY_LOW_STOCK,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/shipping",
      response: {
        status: 200,
        body: ALL_SHIPPING_OPTIONS,
      },
    },
    {
      method: "POST",
      url: "http://localhost:3001/payments",
      response: {
        status: 200,
        body: PAYMENT_SUCCESS,
      },
    },
  ],
};

/**
 * Express Unavailable - Only Standard Shipping
 *
 * Only standard shipping is available (no express or overnight).
 */
export const expressUnavailableScenario: ScenaristScenario = {
  id: "expressUnavailable",
  name: "Express Unavailable",
  description: "Only standard shipping available",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: PRO_USER,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/inventory",
      response: {
        status: 200,
        body: INVENTORY_IN_STOCK,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/shipping",
      response: {
        status: 200,
        body: STANDARD_SHIPPING_ONLY,
      },
    },
    {
      method: "POST",
      url: "http://localhost:3001/payments",
      response: {
        status: 200,
        body: PAYMENT_SUCCESS,
      },
    },
  ],
};

/**
 * Shipping Service Down - 500 Error
 *
 * Shipping service returns 500 error, checkout shows error message.
 */
export const shippingServiceDownScenario: ScenaristScenario = {
  id: "shippingServiceDown",
  name: "Shipping Service Down",
  description: "Shipping service returns 500 error",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: PRO_USER,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/inventory",
      response: {
        status: 200,
        body: INVENTORY_IN_STOCK,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/shipping",
      response: {
        status: 500,
        body: {
          error: "Service unavailable",
          message: "Unable to load shipping options",
        },
      },
    },
  ],
};

/**
 * Payment Declined - Card Declined
 *
 * Payment service returns 402 with declined message.
 */
export const paymentDeclinedScenario: ScenaristScenario = {
  id: "paymentDeclined",
  name: "Payment Declined",
  description: "Payment is declined by the payment service",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: PRO_USER,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/inventory",
      response: {
        status: 200,
        body: INVENTORY_IN_STOCK,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/shipping",
      response: {
        status: 200,
        body: ALL_SHIPPING_OPTIONS,
      },
    },
    {
      method: "POST",
      url: "http://localhost:3001/payments",
      response: {
        status: 402,
        body: {
          id: "pay_failed_123",
          status: "failed",
          error: "card_declined",
          message: "Your card was declined",
        },
      },
    },
  ],
};

/**
 * Payment Service Down - 500 Error
 *
 * Payment service returns 500 error.
 */
export const paymentServiceDownScenario: ScenaristScenario = {
  id: "paymentServiceDown",
  name: "Payment Service Down",
  description: "Payment service returns 500 error",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: PRO_USER,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/inventory",
      response: {
        status: 200,
        body: INVENTORY_IN_STOCK,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/shipping",
      response: {
        status: 200,
        body: ALL_SHIPPING_OPTIONS,
      },
    },
    {
      method: "POST",
      url: "http://localhost:3001/payments",
      response: {
        status: 500,
        body: {
          error: "Service unavailable",
          message: "Payment service is temporarily unavailable",
        },
      },
    },
  ],
};

/**
 * Sells Out During Checkout - Sequence Scenario (Video 4)
 *
 * The "impossible" test case: Item is in stock when browsing,
 * but sold out by the time checkout is attempted.
 *
 * Uses a response sequence:
 * - First inventory call: 15 units in stock
 * - Second inventory call: 0 units (sold out)
 */
export const sellsOutDuringCheckoutScenario: ScenaristScenario = {
  id: "sellsOutDuringCheckout",
  name: "Sells Out During Checkout",
  description: "Item sells out between browsing and checkout",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/users/current",
      response: {
        status: 200,
        body: PRO_USER,
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/inventory",
      sequence: {
        responses: [
          // First call (products page): in stock
          {
            status: 200,
            body: [
              { id: "1", productId: "1", quantity: 15, reserved: 0 },
              { id: "2", productId: "2", quantity: 15, reserved: 0 },
              { id: "3", productId: "3", quantity: 15, reserved: 0 },
            ],
          },
          // Second call (checkout verification): sold out
          {
            status: 200,
            body: [
              { id: "1", productId: "1", quantity: 0, reserved: 0 },
              { id: "2", productId: "2", quantity: 0, reserved: 0 },
              { id: "3", productId: "3", quantity: 0, reserved: 0 },
            ],
          },
        ],
        repeat: "last",
      },
    },
    {
      method: "GET",
      url: "http://localhost:3001/shipping",
      response: {
        status: 200,
        body: ALL_SHIPPING_OPTIONS,
      },
    },
  ],
};

// ============================================================================
// EXPORTED SCENARIOS
// ============================================================================

/**
 * All scenarios for registration and type-safe access
 */
export const scenarios = {
  default: defaultScenario,
  freeUser: freeUserScenario,
  soldOut: soldOutScenario,
  lowStock: lowStockScenario,
  expressUnavailable: expressUnavailableScenario,
  shippingServiceDown: shippingServiceDownScenario,
  paymentDeclined: paymentDeclinedScenario,
  paymentServiceDown: paymentServiceDownScenario,
  sellsOutDuringCheckout: sellsOutDuringCheckoutScenario,
} as const satisfies ScenaristScenarios;
