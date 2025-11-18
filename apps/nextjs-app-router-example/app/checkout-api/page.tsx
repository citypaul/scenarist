/**
 * Checkout Page - API Route Abstraction Pattern
 *
 * Demonstrates testing database-heavy Server Components by abstracting
 * database access behind API routes that Scenarist can mock.
 *
 * Pattern Benefits:
 * - Fast tests (~1 second each)
 * - No real database required
 * - Parallel test execution
 * - Easy scenario switching
 *
 * Trade-offs:
 * - Requires adding API routes (code changes)
 * - Doesn't test actual database queries
 * - ~5-10ms production overhead per request
 */

import { headers } from 'next/headers';
import { scenarist } from '@/lib/scenarist';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tier: 'standard' | 'premium';
};

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
};

type Recommendation = {
  id: string;
  name: string;
  price: number;
};

const PRODUCT_NAMES: Record<string, string> = {
  'prod-1': 'Premium Headphones',
  'prod-2': 'Wireless Mouse',
  'prod-3': 'Mechanical Keyboard',
};

export default async function CheckoutApiPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId: userIdParam } = await searchParams;
  const userId = userIdParam || 'user-1';

  // Get test ID from headers for Scenarist isolation
  const headersList = await headers();
  const testId = headersList.get(scenarist.config.headers.testId) || scenarist.config.defaultTestId;
  const testHeaders = { [scenarist.config.headers.testId]: testId };

  // Fetch user details from API route
  const userResponse = await fetch(`http://localhost:3002/api/user/${userId}`, {
    headers: testHeaders,
  });
  const { user }: { user: User } = await userResponse.json();

  // Fetch cart items from API route
  const cartResponse = await fetch(`http://localhost:3002/api/user/${userId}/cart`, {
    headers: testHeaders,
  });
  const { cartItems }: { cartItems: CartItem[] } = await cartResponse.json();

  // Fetch order history from API route
  const ordersResponse = await fetch(`http://localhost:3002/api/user/${userId}/orders`, {
    headers: testHeaders,
  });
  const { orders }: { orders: Order[] } = await ordersResponse.json();

  // Fetch recommendations from API route (wraps external API)
  const recommendationsResponse = await fetch('http://localhost:3002/api/recommendations', {
    headers: {
      ...testHeaders,
      'x-user-tier': user.tier,
    },
  });
  const { products }: { products: Recommendation[] } = await recommendationsResponse.json();

  // Calculate cart totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = user.tier === 'premium' ? Math.floor(subtotal * 0.2) : 0;
  const total = subtotal - discount;

  return (
    <div className="checkout-container max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Checkout - API Route Approach</h1>

      {/* User Info */}
      <section className="user-info mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">
          Welcome, {user.firstName} {user.lastName}
        </h2>
        <p className="user-email text-gray-600 mb-2">{user.email}</p>
        <span
          className={`tier-badge inline-block px-3 py-1 rounded ${
            user.tier === 'premium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-700'
          }`}
        >
          {user.tier === 'premium' ? '⭐ Premium' : 'Standard'} Member
        </span>
      </section>

      {/* Cart */}
      <section className="cart mb-8 p-6 border rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Your Cart ({cartItems.length} items)</h2>
        {cartItems.length === 0 ? (
          <p className="text-gray-500">Your cart is empty</p>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <article key={item.id} className="cart-item flex justify-between items-center p-4 bg-white border rounded">
                  <div>
                    <h3 className="font-medium">{PRODUCT_NAMES[item.productId]}</h3>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="item-price text-sm text-gray-600">£{(item.price / 100).toFixed(2)} each</p>
                    <p className="item-total font-medium">£{((item.price * item.quantity) / 100).toFixed(2)}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="cart-summary border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>£{(subtotal / 100).toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="discount flex justify-between text-green-600">
                  <span>Premium Discount (20%):</span>
                  <span>-£{(discount / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="total flex justify-between text-xl font-bold border-t pt-2">
                <span>Total:</span>
                <span>£{(total / 100).toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Order History */}
      <section className="order-history mb-8 p-6 border rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Order History</h2>
        {orders.length === 0 ? (
          <p className="first-order text-lg">This is your first order! 🎉</p>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id} className="order-item flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Order #{order.id.slice(0, 8)}</span>
                <span className="font-medium">£{(order.total / 100).toFixed(2)}</span>
                <span className={`status px-2 py-1 rounded text-sm ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recommendations */}
      <section className="recommendations p-6 border rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Recommended for You</h2>
        <div className="product-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <article key={product.id} className="recommended-product p-4 border rounded hover:shadow-lg transition">
              <h3 className="font-medium mb-2">{product.name}</h3>
              <p className="price text-lg font-bold text-blue-600">£{(product.price / 100).toFixed(2)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
