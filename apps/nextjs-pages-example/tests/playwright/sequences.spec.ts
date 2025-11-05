/**
 * Response Sequences Tests - Phase 2 Feature Parity
 *
 * Purpose: Demonstrate Phase 2 (Response Sequences) works in Next.js context
 *
 * Feature Parity Goal:
 * - Express: ✅ All 3 phases (matching, sequences, stateful)
 * - Next.js: ⚠️  2/3 phases (matching ✅, stateful ✅, sequences ❌)
 *
 * These tests close the gap by demonstrating:
 * - Polling sequences with repeat: 'last'
 * - Cycle sequences with repeat: 'cycle'
 * - Exhaustion sequences with repeat: 'none'
 */

import { test, expect } from "./fixtures";

test.describe("Response Sequences - Phase 2 Feature Parity", () => {
  test("should demonstrate GitHub polling sequence (repeat: 'last')", async ({
    page,
    switchScenario,
  }) => {
    // Switch to GitHub polling scenario
    await switchScenario(page, "githubPolling");

    // Navigate to a page to establish browser context
    await page.goto("/");

    // First call - should return "pending" status
    const data1 = await page.evaluate(async () => {
      const response = await fetch("/api/github/jobs/123");
      return { status: response.status, body: await response.json() };
    });
    expect(data1.status).toBe(200);
    expect(data1.body).toEqual({
      jobId: "123",
      status: "pending",
      progress: 0,
    });

    // Second call - should return "processing" status
    const data2 = await page.evaluate(async () => {
      const response = await fetch("/api/github/jobs/123");
      return { status: response.status, body: await response.json() };
    });
    expect(data2.status).toBe(200);
    expect(data2.body).toEqual({
      jobId: "123",
      status: "processing",
      progress: 50,
    });

    // Third call - should return "complete" status
    const data3 = await page.evaluate(async () => {
      const response = await fetch("/api/github/jobs/123");
      return { status: response.status, body: await response.json() };
    });
    expect(data3.status).toBe(200);
    expect(data3.body).toEqual({
      jobId: "123",
      status: "complete",
      progress: 100,
    });

    // Fourth call - should repeat last response (repeat: 'last')
    const data4 = await page.evaluate(async () => {
      const response = await fetch("/api/github/jobs/123");
      return { status: response.status, body: await response.json() };
    });
    expect(data4.status).toBe(200);
    expect(data4.body).toEqual({
      jobId: "123",
      status: "complete",
      progress: 100,
    });
  });

  test("should demonstrate weather cycle sequence (repeat: 'cycle')", async ({
    page,
    switchScenario,
  }) => {
    // Switch to weather cycle scenario
    await switchScenario(page, "weatherCycle");

    // Navigate to a page to establish browser context
    await page.goto("/");

    // First call - Sunny
    const data1 = await page.evaluate(async () => {
      const response = await fetch("/api/weather/london");
      return { status: response.status, body: await response.json() };
    });
    expect(data1.status).toBe(200);
    expect(data1.body).toEqual({
      city: "London",
      conditions: "Sunny",
      temp: 20,
    });

    // Second call - Cloudy
    const data2 = await page.evaluate(async () => {
      const response = await fetch("/api/weather/london");
      return { status: response.status, body: await response.json() };
    });
    expect(data2.status).toBe(200);
    expect(data2.body).toEqual({
      city: "London",
      conditions: "Cloudy",
      temp: 18,
    });

    // Third call - Rainy
    const data3 = await page.evaluate(async () => {
      const response = await fetch("/api/weather/london");
      return { status: response.status, body: await response.json() };
    });
    expect(data3.status).toBe(200);
    expect(data3.body).toEqual({
      city: "London",
      conditions: "Rainy",
      temp: 15,
    });

    // Fourth call - should cycle back to Sunny (repeat: 'cycle')
    const data4 = await page.evaluate(async () => {
      const response = await fetch("/api/weather/london");
      return { status: response.status, body: await response.json() };
    });
    expect(data4.status).toBe(200);
    expect(data4.body).toEqual({
      city: "London",
      conditions: "Sunny",
      temp: 20,
    });
  });

  test("should demonstrate payment limited sequence (repeat: 'none')", async ({
    page,
    switchScenario,
  }) => {
    // Switch to payment limited scenario
    await switchScenario(page, "paymentLimited");

    // Navigate to a page to establish browser context
    await page.goto("/");

    // First call - First pending
    const data1 = await page.evaluate(async () => {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 100 }),
      });
      return { status: response.status, body: await response.json() };
    });
    expect(data1.status).toBe(200);
    expect(data1.body).toEqual({ id: "ch_1", status: "pending" });

    // Second call - Second pending
    const data2 = await page.evaluate(async () => {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 100 }),
      });
      return { status: response.status, body: await response.json() };
    });
    expect(data2.status).toBe(200);
    expect(data2.body).toEqual({ id: "ch_2", status: "pending" });

    // Third call - Succeeded
    const data3 = await page.evaluate(async () => {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 100 }),
      });
      return { status: response.status, body: await response.json() };
    });
    expect(data3.status).toBe(200);
    expect(data3.body).toEqual({ id: "ch_3", status: "succeeded" });

    // Fourth call - should fall back to rate limit error (repeat: 'none')
    const data4 = await page.evaluate(async () => {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 100 }),
      });
      return { status: response.status, body: await response.json() };
    });
    expect(data4.status).toBe(429);
    expect(data4.body).toEqual({
      error: { message: "Rate limit exceeded" },
    });
  });
});
