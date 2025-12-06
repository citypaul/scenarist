/**
 * Order Management Page - Conditional afterResponse Demo (Issue #332)
 *
 * Demonstrates condition-level afterResponse in stateResponse:
 * 1. Condition can override mock-level afterResponse with its own state mutation
 * 2. Condition can suppress state mutation with afterResponse: null
 * 3. Condition inherits mock-level afterResponse when no afterResponse key present
 *
 * Flow:
 * - Initial: status returns "new" (no state), sets phase: "initial"
 * - After submit: status returns "processing", sets phase: "processing" (condition override)
 * - After approve: status returns "complete", phase stays "processing" (afterResponse: null)
 */

import { useState, useEffect, useCallback } from "react";
import type { GetServerSideProps } from "next";

type OrderStatus = {
  status: "new" | "processing" | "complete";
  message: string;
};

export default function OrderPage() {
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/order/status");
      const data = await response.json();
      setOrderStatus(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/order/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      await fetchStatus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveOrder = async () => {
    setIsApproving(true);
    try {
      await fetch("/api/order/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      await fetchStatus();
    } finally {
      setIsApproving(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "new":
        return {
          backgroundColor: "#fef3c7",
          color: "#92400e",
          border: "1px solid #fcd34d",
        };
      case "processing":
        return {
          backgroundColor: "#dbeafe",
          color: "#1e40af",
          border: "1px solid #93c5fd",
        };
      case "complete":
        return {
          backgroundColor: "#d1fae5",
          color: "#065f46",
          border: "1px solid #6ee7b7",
        };
      default:
        return {
          backgroundColor: "#f3f4f6",
          color: "#374151",
          border: "1px solid #d1d5db",
        };
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1>Order Management</h1>

      {/* Feature Explanation */}
      <div
        style={{
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ fontSize: "16px", color: "#1e40af", marginTop: 0 }}>
          Conditional afterResponse Demo (Issue #332)
        </h2>
        <p style={{ fontSize: "14px", color: "#1e40af", marginBottom: "12px" }}>
          This page demonstrates <strong>condition-level afterResponse</strong>{" "}
          - conditions can override or suppress the mock-level state mutation.
        </p>
        <ul
          style={{
            fontSize: "14px",
            color: "#3b82f6",
            margin: 0,
            paddingLeft: "20px",
          }}
        >
          <li>
            <strong>Default:</strong> Mock-level afterResponse sets phase:
            &quot;initial&quot;
          </li>
          <li>
            <strong>Processing:</strong> Condition overrides to set phase:
            &quot;processing&quot;
          </li>
          <li>
            <strong>Complete:</strong> Condition has afterResponse: null (no
            state change)
          </li>
        </ul>
      </div>

      {/* Current Status Display */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Order Status</h2>

        {isLoading ? (
          <p style={{ color: "#6b7280" }}>Loading status...</p>
        ) : orderStatus ? (
          <div>
            <div
              role="status"
              style={{
                display: "inline-block",
                padding: "8px 16px",
                borderRadius: "9999px",
                fontWeight: "600",
                textTransform: "capitalize",
                marginBottom: "16px",
                ...getStatusStyle(orderStatus.status),
              }}
            >
              {orderStatus.status}
            </div>
            <p
              data-testid="status-message"
              style={{ color: "#4b5563", margin: 0 }}
            >
              {orderStatus.message}
            </p>
          </div>
        ) : (
          <p style={{ color: "#ef4444" }}>Failed to load status</p>
        )}
      </div>

      {/* Submit Order */}
      {orderStatus?.status === "new" && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Submit Order</h2>
          <p style={{ color: "#4b5563" }}>Ready to submit your order?</p>
          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
            style={{
              width: "100%",
              backgroundColor: isSubmitting ? "#9ca3af" : "#2563eb",
              color: "#fff",
              padding: "12px 16px",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit Order"}
          </button>
        </div>
      )}

      {/* Approve Section */}
      {orderStatus?.status === "processing" && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Approve Order</h2>
          <p style={{ color: "#4b5563" }}>
            Your order is being processed. Click below to approve.
          </p>
          <button
            onClick={handleApproveOrder}
            disabled={isApproving}
            style={{
              width: "100%",
              backgroundColor: isApproving ? "#9ca3af" : "#059669",
              color: "#fff",
              padding: "12px 16px",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              cursor: isApproving ? "not-allowed" : "pointer",
            }}
          >
            {isApproving ? "Processing..." : "Approve Order"}
          </button>
        </div>
      )}

      {/* Complete Section */}
      {orderStatus?.status === "complete" && (
        <div
          style={{
            backgroundColor: "#d1fae5",
            border: "1px solid #6ee7b7",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ color: "#065f46", marginTop: 0 }}>Order Complete!</h2>
          <p style={{ color: "#047857", margin: 0 }}>
            Your order has been completed successfully.
          </p>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
