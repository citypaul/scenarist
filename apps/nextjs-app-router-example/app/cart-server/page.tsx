/**
 * Cart Server Page - React Server Component with Stateful Mocks
 *
 * This demonstrates testing stateful mocks with RSC:
 * - Async server component that fetches cart state
 * - Scenarist captures state from POST /cart/add requests
 * - State is injected into GET /cart responses via templates
 * - Proves stateful mocks work with server-side rendering
 *
 * State flow: POST /cart/add → capture productId → GET /cart → inject state
 *
 * Traditional approach: ❌ Jest doesn't support RSC
 * Scenarist approach: ✅ Playwright + stateful mocks + RSC = works perfectly
 */

import { getScenaristHeaders } from '@scenarist/nextjs-adapter/app';
import { scenarist } from '@/lib/scenarist';
import { headers } from 'next/headers';

type CartItem = {
  readonly id: string;
  readonly name: string;
  readonly quantity: number;
};

type CartResponse = {
  readonly items: ReadonlyArray<string> | string; // Array of product IDs from state, or unreplaced template string
};

const PRODUCT_NAMES: Record<string, string> = {
  'prod-1': 'Product A',
  'prod-2': 'Product B',
  'prod-3': 'Product C',
};

const aggregateCartItems = (productIds: ReadonlyArray<string> | string): ReadonlyArray<CartItem> => {
  // Handle unreplaced template (when state doesn't exist yet)
  if (typeof productIds === 'string') {
    return [];
  }

  if (!productIds || productIds.length === 0) {
    return [];
  }

  const counts: Record<string, number> = {};
  for (const id of productIds) {
    counts[id] = (counts[id] || 0) + 1;
  }

  return Object.entries(counts).map(([id, quantity]) => ({
    id,
    name: PRODUCT_NAMES[id] || `Unknown Product (${id})`,
    quantity,
  }));
};

async function fetchCart(): Promise<CartResponse> {
  // Create a mock Request object from the incoming headers
  // This allows us to use getScenaristHeaders helper
  const headersList = await headers();
  const mockRequest = new Request('http://localhost:3002', {
    headers: headersList,
  });

  const response = await fetch('http://localhost:3002/api/cart', {
    headers: {
      ...getScenaristHeaders(mockRequest, scenarist),
    },
    cache: 'no-store', // Disable Next.js caching for demo
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch cart: ${response.statusText}`);
  }

  return response.json();
}

/**
 * React Server Component
 *
 * This is an ASYNC component that runs ONLY on the server.
 * Jest cannot test this with stateful mocks - throws: "Objects are not valid as a React child"
 * Scenarist + Playwright CAN test this - state persists across requests!
 */
export default async function CartServerPage() {
  const cartData = await fetchCart();
  const cartItems = aggregateCartItems(cartData.items);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Shopping Cart (React Server Component)
        </h1>
        <p className="text-gray-600 mb-4">
          This page demonstrates testing stateful mocks with Scenarist and RSC.
          Cart items are captured from POST requests and injected into GET responses.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Your Cart</h2>

          {cartItems.length === 0 ? (
            <p className="text-gray-500">Your cart is empty</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b pb-4"
                >
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">ID: {item.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Quantity: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Testing Stateful Mocks with RSC</h3>
          <div className="space-y-2 text-sm">
            <p>
              <strong>State Capture:</strong> POST /cart/add captures productId from request body
            </p>
            <p>
              <strong>State Injection:</strong> GET /cart injects captured items via templates
            </p>
            <p>
              <strong>Per-Test Isolation:</strong> Each test ID has independent cart state
            </p>
            <p className="text-xs text-gray-600 mt-2">
              This proves Scenarist stateful mocks work with Server Components!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
