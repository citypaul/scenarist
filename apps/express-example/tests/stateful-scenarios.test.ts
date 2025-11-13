import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/server.js";

describe("Stateful Scenarios E2E (Phase 3)", () => {
  const { app, scenarist } = createApp();

  beforeAll(() => {
    scenarist.start();
  });

  afterAll(() => {
    scenarist.stop();
  });

  describe("Shopping Cart - Complete Journey", () => {
    it("should capture items and inject into cart response", async () => {
      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(scenarist.config.headers.testId, "cart-test-1")
        .send({ scenario: "shoppingCart" });

      await request(app)
        .post("/api/cart/add")
        .set(scenarist.config.headers.testId, "cart-test-1")
        .send({ item: "Apple" });

      await request(app)
        .post("/api/cart/add")
        .set(scenarist.config.headers.testId, "cart-test-1")
        .send({ item: "Banana" });

      await request(app)
        .post("/api/cart/add")
        .set(scenarist.config.headers.testId, "cart-test-1")
        .send({ item: "Cherry" });

      const response = await request(app)
        .get("/api/cart")
        .set(scenarist.config.headers.testId, "cart-test-1");

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual(["Apple", "Banana", "Cherry"]);
      expect(response.body.count).toBe(3);
      expect(typeof response.body.count).toBe("number");
    });
  });

  describe("Multi-Step Form - Complete Journey", () => {
    it("should accumulate state across form steps and inject in final confirmation", async () => {
      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(scenarist.config.headers.testId, "form-test-1")
        .send({ scenario: "multiStepForm" });

      const step1 = await request(app)
        .post("/api/form/step1")
        .set(scenarist.config.headers.testId, "form-test-1")
        .send({ name: "Alice", email: "alice@example.com" });

      expect(step1.status).toBe(200);
      expect(step1.body.success).toBe(true);
      expect(step1.body.message).toBe("Step 1 completed");
      expect(step1.body.nextStep).toBe("/form/step2");

      const step2 = await request(app)
        .post("/api/form/step2")
        .set(scenarist.config.headers.testId, "form-test-1")
        .send({ address: "123 Main St", city: "Portland" });

      expect(step2.status).toBe(200);
      expect(step2.body.success).toBe(true);
      expect(step2.body.message).toBe("Step 2 completed for Alice");
      expect(step2.body.nextStep).toBe("/form/submit");

      const submit = await request(app)
        .post("/api/form/submit")
        .set(scenarist.config.headers.testId, "form-test-1");

      expect(submit.status).toBe(200);
      expect(submit.body.success).toBe(true);
      expect(submit.body.message).toBe("Form submitted successfully");
      expect(submit.body.confirmation).toEqual({
        name: "Alice",
        email: "alice@example.com",
        address: "123 Main St",
        city: "Portland",
        confirmationId: "CONF-12345",
      });
    });
  });

  describe("State Reset on Scenario Switch", () => {
    it("should reset cart state when switching scenarios", async () => {
      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(scenarist.config.headers.testId, "reset-test-1")
        .send({ scenario: "shoppingCart" });

      await request(app)
        .post("/api/cart/add")
        .set(scenarist.config.headers.testId, "reset-test-1")
        .send({ item: "Widget" });

      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(scenarist.config.headers.testId, "reset-test-1")
        .send({ scenario: "success" });

      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(scenarist.config.headers.testId, "reset-test-1")
        .send({ scenario: "shoppingCart" });

      const response = await request(app)
        .get("/api/cart")
        .set(scenarist.config.headers.testId, "reset-test-1");

      expect(response.status).toBe(200);
      // Pure templates with missing state return undefined (not the template string)
      expect(response.body.items).toBeUndefined();
      expect(response.body.count).toBeUndefined();
    });

    it("should NOT reset state when scenario switch fails", async () => {
      // Scenario already registered in scenarios.ts

      const router = app._router as {
        stack: Array<{ route?: { path?: string } }>;
      };
      if (
        !router?.stack.some((layer) => layer.route?.path === "/api/temp-data")
      ) {
        app.post("/api/temp-data", async (req, res) => {
          try {
            const response = await fetch("https://api.example.com/temp-data", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(req.body),
            });
            const data = await response.json();
            res.status(response.status).json(data);
          } catch (e: unknown) {
            res.status(500).json({ error: "Failed" });
          }
        });

        app.get("/api/temp-data", async (_req, res) => {
          try {
            const response = await fetch("https://api.example.com/temp-data");
            const data = await response.json();
            res.status(response.status).json(data);
          } catch (error) {
            res.status(500).json({ error: "Failed" });
          }
        });
      }

      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(scenarist.config.headers.testId, "failed-switch-test")
        .send({ scenario: "temp-capture-scenario" });

      await request(app)
        .post("/api/temp-data")
        .set(scenarist.config.headers.testId, "failed-switch-test")
        .send({ value: "important-data" });

      const failedSwitch = await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(scenarist.config.headers.testId, "failed-switch-test")
        .send({ scenario: "non-existent-scenario" });

      expect(failedSwitch.status).toBe(400);

      const response = await request(app)
        .get("/api/temp-data")
        .set(scenarist.config.headers.testId, "failed-switch-test");

      expect(response.status).toBe(200);
      expect(response.body.value).toBe("important-data");
    });
  });

  describe("State Isolation Between Test IDs", () => {
    it("should maintain independent cart state for different test IDs", async () => {
      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(scenarist.config.headers.testId, "isolation-test-A")
        .send({ scenario: "shoppingCart" });

      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(scenarist.config.headers.testId, "isolation-test-B")
        .send({ scenario: "shoppingCart" });

      await request(app)
        .post("/api/cart/add")
        .set(scenarist.config.headers.testId, "isolation-test-A")
        .send({ item: "Apple" });

      await request(app)
        .post("/api/cart/add")
        .set(scenarist.config.headers.testId, "isolation-test-A")
        .send({ item: "Banana" });

      await request(app)
        .post("/api/cart/add")
        .set(scenarist.config.headers.testId, "isolation-test-B")
        .send({ item: "Cherry" });

      const responseA = await request(app)
        .get("/api/cart")
        .set(scenarist.config.headers.testId, "isolation-test-A");

      const responseB = await request(app)
        .get("/api/cart")
        .set(scenarist.config.headers.testId, "isolation-test-B");

      expect(responseA.body.items).toEqual(["Apple", "Banana"]);
      expect(responseA.body.count).toBe(2);

      expect(responseB.body.items).toEqual(["Cherry"]);
      expect(responseB.body.count).toBe(1);
    });
  });
});
