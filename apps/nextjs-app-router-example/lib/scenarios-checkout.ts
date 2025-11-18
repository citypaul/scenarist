import type { ScenaristScenario, ScenaristScenarios } from '@scenarist/nextjs-adapter/app';

export const premiumUserCheckoutScenario: ScenaristScenario = {
  id: 'premiumUserCheckout',
  name: 'Premium User Checkout',
  description: 'Premium user with full cart and order history',
  mocks: [
    // User API
    {
      method: 'GET',
      url: 'http://localhost:3001/api/user/user-1',
      response: {
        status: 200,
        body: {
          user: {
            id: 'user-1',
            email: 'premium@example.com',
            firstName: 'Jane',
            lastName: 'Premium',
            tier: 'premium',
          },
        },
      },
    },
    // Cart API
    {
      method: 'GET',
      url: 'http://localhost:3001/api/user/user-1/cart',
      response: {
        status: 200,
        body: {
          cartItems: [
            { id: 'cart-1', productId: 'prod-1', quantity: 2, price: 15000 }, // £150 each
            { id: 'cart-2', productId: 'prod-2', quantity: 1, price: 8000 }, // £80
            { id: 'cart-3', productId: 'prod-3', quantity: 1, price: 12000 }, // £120
          ],
        },
      },
    },
    // Orders API
    {
      method: 'GET',
      url: 'http://localhost:3001/api/user/user-1/orders',
      response: {
        status: 200,
        body: {
          orders: [
            { id: 'order-1', total: 25000, status: 'delivered', createdAt: '2024-01-15T10:00:00Z' },
            { id: 'order-2', total: 18000, status: 'delivered', createdAt: '2024-01-10T14:30:00Z' },
            { id: 'order-3', total: 32000, status: 'shipped', createdAt: '2024-01-05T09:15:00Z' },
            { id: 'order-4', total: 15000, status: 'delivered', createdAt: '2023-12-20T16:45:00Z' },
            { id: 'order-5', total: 28000, status: 'delivered', createdAt: '2023-12-15T11:20:00Z' },
          ],
        },
      },
    },
    // Recommendations API (external)
    {
      method: 'GET',
      url: 'http://localhost:3001/api/recommendations',
      match: {
        headers: { 'x-user-tier': 'premium' },
      },
      response: {
        status: 200,
        body: {
          products: [
            { id: 'rec-1', name: 'Premium Laptop Stand', price: 8000 },
            { id: 'rec-2', name: 'Premium USB-C Hub', price: 12000 },
            { id: 'rec-3', name: 'Premium Desk Mat', price: 5000 },
          ],
        },
      },
    },
  ],
};

export const standardUserCheckoutScenario: ScenaristScenario = {
  id: 'standardUserCheckout',
  name: 'Standard User Checkout (First-Time)',
  description: 'Standard user with minimal cart, no order history',
  mocks: [
    // User API
    {
      method: 'GET',
      url: 'http://localhost:3001/api/user/user-1',
      response: {
        status: 200,
        body: {
          user: {
            id: 'user-1',
            email: 'standard@example.com',
            firstName: 'John',
            lastName: 'Standard',
            tier: 'standard',
          },
        },
      },
    },
    // Cart API
    {
      method: 'GET',
      url: 'http://localhost:3001/api/user/user-1/cart',
      response: {
        status: 200,
        body: {
          cartItems: [
            { id: 'cart-1', productId: 'prod-1', quantity: 1, price: 15000 }, // £150
          ],
        },
      },
    },
    // Orders API (empty)
    {
      method: 'GET',
      url: 'http://localhost:3001/api/user/user-1/orders',
      response: {
        status: 200,
        body: {
          orders: [],
        },
      },
    },
    // Recommendations API (external)
    {
      method: 'GET',
      url: 'http://localhost:3001/api/recommendations',
      match: {
        headers: { 'x-user-tier': 'standard' },
      },
      response: {
        status: 200,
        body: {
          products: [
            { id: 'rec-1', name: 'Basic Mouse Pad', price: 1500 },
            { id: 'rec-2', name: 'Basic Cable Organizer', price: 2000 },
          ],
        },
      },
    },
  ],
};

export const checkoutScenarios = {
  premiumUserCheckout: premiumUserCheckoutScenario,
  standardUserCheckout: standardUserCheckoutScenario,
} as const satisfies ScenaristScenarios;
