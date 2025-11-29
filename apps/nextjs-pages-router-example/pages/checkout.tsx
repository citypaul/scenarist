/**
 * Checkout Page - Phase 4 Feature Composition Demo
 *
 * Demonstrates request matching + stateful mocks working TOGETHER:
 * 1. User fills shipping address form
 * 2. Calculate Shipping: Matches on country → different costs (MATCHING)
 * 3. Calculate Shipping: Captures address for later (STATEFUL)
 * 4. Place Order: Injects captured address into response (STATEFUL)
 */

import { useState } from "react";
import type { GetServerSideProps } from "next";

type ShippingFormData = {
  country: string;
  address: string;
  city: string;
  postcode: string;
};

type ShippingResult = {
  country: string;
  shippingCost: number;
};

type OrderResult = {
  orderId: string;
  shippingAddress: {
    country: string;
    address: string;
    city: string;
    postcode: string;
  };
};

export default function CheckoutPage() {
  const [formData, setFormData] = useState<ShippingFormData>({
    country: "",
    address: "",
    city: "",
    postcode: "",
  });
  const [shippingResult, setShippingResult] = useState<ShippingResult | null>(
    null,
  );
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handleCalculateShipping = async () => {
    setIsCalculating(true);
    try {
      const response = await fetch("/api/checkout/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const response = await fetch("/api/checkout/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await response.json();
      setOrderResult(data);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1>Checkout</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCalculateShipping();
        }}
        style={{ marginBottom: "30px" }}
      >
        <div style={{ marginBottom: "15px" }}>
          <label
            htmlFor="country"
            style={{ display: "block", marginBottom: "5px" }}
          >
            Country
          </label>
          <select
            id="country"
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
            style={{ width: "100%", padding: "8px" }}
          >
            <option value="">Select country</option>
            <option value="UK">UK</option>
            <option value="US">US</option>
            <option value="FR">FR</option>
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            htmlFor="address"
            style={{ display: "block", marginBottom: "5px" }}
          >
            Address
          </label>
          <input
            id="address"
            type="text"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            htmlFor="city"
            style={{ display: "block", marginBottom: "5px" }}
          >
            City
          </label>
          <input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            htmlFor="postcode"
            style={{ display: "block", marginBottom: "5px" }}
          >
            Postcode
          </label>
          <input
            id="postcode"
            type="text"
            value={formData.postcode}
            onChange={(e) =>
              setFormData({ ...formData, postcode: e.target.value })
            }
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <button
          type="submit"
          disabled={isCalculating}
          style={{ padding: "10px 20px", marginRight: "10px" }}
        >
          Calculate Shipping
        </button>
      </form>

      {shippingResult && (
        <div style={{ marginBottom: "30px" }}>
          <div role="status" style={{ marginBottom: "15px" }}>
            <strong>Shipping Cost:</strong> £
            {shippingResult.shippingCost.toFixed(2)}
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            style={{ padding: "10px 20px" }}
          >
            Place Order
          </button>
        </div>
      )}

      {orderResult && (
        <div
          role="region"
          aria-label="Order confirmation"
          style={{
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <h2>Order Confirmed!</h2>
          <p>
            <strong>Order ID:</strong> {orderResult.orderId}
          </p>
          <p>
            <strong>Shipping Address:</strong>
          </p>
          <ul>
            <li>{orderResult.shippingAddress.address}</li>
            <li>{orderResult.shippingAddress.city}</li>
            <li>{orderResult.shippingAddress.postcode}</li>
            <li>{orderResult.shippingAddress.country}</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
