/**
 * Pricing Page - State-Aware Mocking Demo (ADR-0019)
 *
 * Demonstrates match.state + captureState for mock selection:
 * 1. POST /api/features captures feature flag state via captureState
 * 2. GET /api/pricing returns different mock based on captured state (match.state)
 *
 * Flow:
 * - Initial: pricing returns "standard" tier (no state)
 * - After enabling premium flag: pricing returns "premium" tier (state.premiumEnabled = true)
 */

import { useState, useEffect, useCallback } from "react";
import type { GetServerSideProps } from "next";

type PricingData = {
  tier: "standard" | "premium";
  price: number;
  discount?: string;
};

export default function PricingPage() {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [premiumEnabled, setPremiumEnabled] = useState(false);

  const fetchPricing = useCallback(async () => {
    try {
      const response = await fetch("/api/pricing");
      const data = await response.json();
      setPricing(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const handleTogglePremium = async () => {
    setIsToggling(true);
    const newValue = !premiumEnabled;
    try {
      const response = await fetch("/api/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: "premium_pricing", enabled: newValue }),
      });
      const data = await response.json();
      if (data.success) {
        setPremiumEnabled(newValue);
        await fetchPricing();
      }
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1>Pricing</h1>

      {/* Feature Explanation */}
      <div
        style={{
          backgroundColor: "#faf5ff",
          border: "1px solid #e9d5ff",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ fontSize: "16px", color: "#6b21a8", marginTop: 0 }}>
          State-Aware Mocking Demo (ADR-0019)
        </h2>
        <p style={{ fontSize: "14px", color: "#7c3aed", marginBottom: "12px" }}>
          This page demonstrates <strong>match.state</strong> and{" "}
          <strong>captureState</strong> - features that enable mock selection
          based on captured state.
        </p>
        <ul
          style={{
            fontSize: "14px",
            color: "#8b5cf6",
            margin: 0,
            paddingLeft: "20px",
          }}
        >
          <li>
            <code
              style={{
                backgroundColor: "#f3e8ff",
                padding: "2px 4px",
                borderRadius: "4px",
              }}
            >
              POST /api/features
            </code>{" "}
            captures the feature flag value via captureState
          </li>
          <li>
            <code
              style={{
                backgroundColor: "#f3e8ff",
                padding: "2px 4px",
                borderRadius: "4px",
              }}
            >
              GET /api/pricing
            </code>{" "}
            selects different mock based on state via match.state
          </li>
          <li>
            When premiumEnabled is true, a different mock handles the request
          </li>
        </ul>
      </div>

      {/* Feature Flag Toggle */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Feature Flags</h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontWeight: "500",
                color: "#1f2937",
                margin: "0 0 4px 0",
              }}
            >
              Premium Pricing
            </p>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
              Enable premium tier pricing with 50% discount
            </p>
          </div>
          <button
            onClick={handleTogglePremium}
            disabled={isToggling}
            aria-pressed={premiumEnabled}
            style={{
              position: "relative",
              width: "56px",
              height: "32px",
              backgroundColor: premiumEnabled ? "#7c3aed" : "#d1d5db",
              borderRadius: "9999px",
              border: "none",
              cursor: isToggling ? "not-allowed" : "pointer",
              opacity: isToggling ? 0.5 : 1,
              transition: "background-color 0.2s",
            }}
          >
            <span className="sr-only">
              {premiumEnabled ? "Disable" : "Enable"} premium pricing
            </span>
            <span
              style={{
                position: "absolute",
                top: "4px",
                left: premiumEnabled ? "28px" : "4px",
                width: "24px",
                height: "24px",
                backgroundColor: "#fff",
                borderRadius: "9999px",
                transition: "left 0.2s",
              }}
            />
          </button>
        </div>
        <p
          role="status"
          style={{
            fontSize: "14px",
            color: premiumEnabled ? "#7c3aed" : "#6b7280",
            marginTop: "8px",
            marginBottom: 0,
          }}
        >
          Premium pricing is {premiumEnabled ? "enabled" : "disabled"}
        </p>
      </div>

      {/* Current Pricing Display */}
      <section
        role="region"
        aria-label="Current pricing"
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Current Pricing</h2>

        {isLoading ? (
          <p style={{ color: "#6b7280" }}>Loading pricing...</p>
        ) : pricing ? (
          <div style={{ textAlign: "center" }}>
            <div
              role="status"
              style={{
                display: "inline-block",
                padding: "8px 16px",
                borderRadius: "9999px",
                fontWeight: "600",
                textTransform: "capitalize",
                marginBottom: "16px",
                backgroundColor:
                  pricing.tier === "premium" ? "#f3e8ff" : "#f3f4f6",
                color: pricing.tier === "premium" ? "#7c3aed" : "#374151",
              }}
            >
              {pricing.tier} Tier
            </div>
            <div style={{ marginBottom: "16px" }}>
              <span
                style={{
                  fontSize: "48px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                £{pricing.price}
              </span>
              <span style={{ color: "#6b7280" }}>/month</span>
            </div>
            {pricing.discount && (
              <p style={{ color: "#059669", fontWeight: "500", margin: 0 }}>
                {pricing.discount}
              </p>
            )}
          </div>
        ) : (
          <p style={{ color: "#ef4444" }}>Failed to load pricing</p>
        )}
      </section>

      {/* Pricing Comparison */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <div
          style={{
            padding: "20px",
            borderRadius: "8px",
            border: `2px solid ${pricing?.tier === "standard" ? "#3b82f6" : "#e5e7eb"}`,
            backgroundColor: pricing?.tier === "standard" ? "#eff6ff" : "#fff",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0" }}>Standard</h3>
          <p
            style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 8px 0" }}
          >
            £100
          </p>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
            Basic features
          </p>
        </div>
        <div
          style={{
            padding: "20px",
            borderRadius: "8px",
            border: `2px solid ${pricing?.tier === "premium" ? "#7c3aed" : "#e5e7eb"}`,
            backgroundColor: pricing?.tier === "premium" ? "#faf5ff" : "#fff",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0" }}>Premium</h3>
          <p
            style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 8px 0" }}
          >
            £50
          </p>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
            50% off with flag enabled
          </p>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
