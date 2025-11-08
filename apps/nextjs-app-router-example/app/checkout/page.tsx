/**
 * Checkout Page - Phase 8.4 Feature Composition Demo
 *
 * Demonstrates request matching + stateful mocks working TOGETHER:
 * 1. User fills shipping address form
 * 2. Calculate Shipping: Matches on country → different costs (MATCHING)
 * 3. Calculate Shipping: Captures address for later (STATEFUL)
 * 4. Place Order: Injects captured address into response (STATEFUL)
 *
 * Client Component - Requires state and effects for form handling.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

type ShippingFormData = {
  readonly country: string;
  readonly address: string;
  readonly city: string;
  readonly postcode: string;
};

type ShippingResult = {
  readonly country: string;
  readonly shippingCost: number;
};

type OrderResult = {
  readonly orderId: string;
  readonly shippingAddress: {
    readonly country: string;
    readonly address: string;
    readonly city: string;
    readonly postcode: string;
  };
};

export default function CheckoutPage() {
  const [formData, setFormData] = useState<ShippingFormData>({
    country: '',
    address: '',
    city: '',
    postcode: '',
  });
  const [shippingResult, setShippingResult] = useState<ShippingResult | null>(null);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handleCalculateShipping = async () => {
    setIsCalculating(true);
    try {
      const response = await fetch('/api/checkout/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setShippingResult(data);
    } finally {
      setIsCalculating(false);
    }
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const orderId = `order-${Date.now()}`;
      const response = await fetch('/api/checkout/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await response.json();
      setOrderResult(data);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Checkout</h1>

        <nav aria-label="Main navigation" className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 underline">
            Back to Products
          </Link>
        </nav>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCalculateShipping();
          }}
          className="mb-8 bg-white p-6 rounded-lg shadow"
        >
          <h2 className="text-2xl font-semibold mb-6">Shipping Address</h2>

          <div className="mb-4">
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select country</option>
              <option value="UK">UK</option>
              <option value="US">US</option>
              <option value="FR">FR</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-2">
              Postcode
            </label>
            <input
              id="postcode"
              type="text"
              value={formData.postcode}
              onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isCalculating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {isCalculating ? 'Calculating...' : 'Calculate Shipping'}
          </button>
        </form>

        {shippingResult && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow">
            <div role="status" className="mb-6">
              <span className="text-lg font-semibold">Shipping Cost: </span>
              <span className="text-2xl font-bold text-blue-600">
                £{shippingResult.shippingCost.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        )}

        {orderResult && (
          <div
            role="region"
            aria-label="Order confirmation"
            className="bg-green-50 border border-green-200 p-6 rounded-lg"
          >
            <h2 className="text-2xl font-bold text-green-800 mb-4">Order Confirmed!</h2>
            <p className="mb-2">
              <span className="font-semibold">Order ID:</span> {orderResult.orderId}
            </p>
            <p className="font-semibold mb-2">Shipping Address:</p>
            <ul className="list-disc list-inside text-gray-700">
              <li>{orderResult.shippingAddress.address}</li>
              <li>{orderResult.shippingAddress.city}</li>
              <li>{orderResult.shippingAddress.postcode}</li>
              <li>{orderResult.shippingAddress.country}</li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
