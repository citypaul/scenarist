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
 *
 * Client Component - Requires state and effects for feature flag handling.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type PricingData = {
  readonly tier: "standard" | "premium";
  readonly price: number;
  readonly discount?: string;
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
        // Refresh pricing after feature flag change
        await fetchPricing();
      }
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Pricing</h1>

        <nav aria-label="Main navigation" className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Back to Home
          </Link>
        </nav>

        {/* Feature Explanation */}
        <section
          aria-label="What this demo tests"
          className="mb-8 bg-purple-50 border border-purple-200 p-6 rounded-lg"
        >
          <h2 className="text-lg font-semibold text-purple-900 mb-2">
            State-Aware Mocking Demo (ADR-0019)
          </h2>
          <p className="text-purple-800 text-sm mb-3">
            This page demonstrates <strong>match.state</strong> and{" "}
            <strong>captureState</strong> - features that enable mock selection
            based on captured state.
          </p>
          <ul className="text-purple-700 text-sm list-disc list-inside space-y-1">
            <li>
              <code className="bg-purple-100 px-1 rounded">
                POST /api/features
              </code>{" "}
              captures the feature flag value via captureState
            </li>
            <li>
              <code className="bg-purple-100 px-1 rounded">
                GET /api/pricing
              </code>{" "}
              selects different mock based on state via match.state
            </li>
            <li>
              When premiumEnabled is true, a different mock handles the request
            </li>
          </ul>
        </section>

        {/* Feature Flag Toggle */}
        <section
          aria-label="Feature flag control"
          className="mb-8 bg-white p-6 rounded-lg shadow"
        >
          <h2 className="text-2xl font-semibold mb-4">Feature Flags</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Premium Pricing</p>
              <p className="text-sm text-gray-500">
                Enable premium tier pricing with 50% discount
              </p>
            </div>
            <button
              onClick={handleTogglePremium}
              disabled={isToggling}
              aria-pressed={premiumEnabled}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                premiumEnabled ? "bg-purple-600" : "bg-gray-300"
              } ${isToggling ? "opacity-50" : ""}`}
            >
              <span className="sr-only">
                {premiumEnabled ? "Disable" : "Enable"} premium pricing
              </span>
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  premiumEnabled ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <p
            role="status"
            aria-live="polite"
            className={`mt-2 text-sm ${premiumEnabled ? "text-purple-600" : "text-gray-500"}`}
          >
            Premium pricing is {premiumEnabled ? "enabled" : "disabled"}
          </p>
        </section>

        {/* Current Pricing Display */}
        <section
          role="region"
          aria-label="Current pricing"
          className="mb-8 bg-white p-6 rounded-lg shadow"
        >
          <h2 className="text-2xl font-semibold mb-4">Current Pricing</h2>

          {isLoading ? (
            <p className="text-gray-500">Loading pricing...</p>
          ) : pricing ? (
            <div className="text-center">
              <div
                role="status"
                aria-live="polite"
                className={`inline-block px-4 py-2 rounded-full mb-4 ${
                  pricing.tier === "premium"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <span className="font-semibold capitalize">{pricing.tier}</span>{" "}
                Tier
              </div>
              <div className="mb-4">
                <span className="text-5xl font-bold text-gray-900">
                  £{pricing.price}
                </span>
                <span className="text-gray-500">/month</span>
              </div>
              {pricing.discount && (
                <p className="text-green-600 font-medium">{pricing.discount}</p>
              )}
            </div>
          ) : (
            <p className="text-red-500">Failed to load pricing</p>
          )}
        </section>

        {/* Pricing Comparison */}
        <section
          aria-label="Pricing comparison"
          className="grid grid-cols-2 gap-4"
        >
          <div
            className={`p-6 rounded-lg border-2 ${
              pricing?.tier === "standard"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <h3 className="text-lg font-semibold mb-2">Standard</h3>
            <p className="text-3xl font-bold mb-2">£100</p>
            <p className="text-sm text-gray-600">Basic features</p>
          </div>
          <div
            className={`p-6 rounded-lg border-2 ${
              pricing?.tier === "premium"
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <h3 className="text-lg font-semibold mb-2">Premium</h3>
            <p className="text-3xl font-bold mb-2">£50</p>
            <p className="text-sm text-gray-600">50% off with flag enabled</p>
          </div>
        </section>
      </div>
    </main>
  );
}
