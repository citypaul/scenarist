/**
 * Server Actions Tests - Contact Form with Scenarist
 *
 * Demonstrates Server Actions integration with Scenarist:
 * - Server Action calls external API (mocked by MSW)
 * - Header forwarding for test ID isolation
 * - Multiple scenarios: success, error, duplicate, VIP matching
 */

import { test, expect } from "./fixtures";

test.describe("Server Actions - Contact Form", () => {
  test("should submit contact form successfully", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "contactFormSuccess");
    await page.goto("/actions");

    await page.getByLabel("Name").fill("John Doe");
    await page.getByLabel("Email").fill("john@example.com");
    await page.getByLabel("Message").fill("Hello!");

    await page.getByRole("button", { name: "Send Message" }).click();

    await expect(page.getByRole("status")).toContainText(
      "Message sent successfully",
    );
  });

  test("should show error when server fails", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "contactFormError");
    await page.goto("/actions");

    await page.getByLabel("Name").fill("John Doe");
    await page.getByLabel("Email").fill("john@example.com");
    await page.getByLabel("Message").fill("Hello!");

    await page.getByRole("button", { name: "Send Message" }).click();

    // Use locator with text to avoid Next.js route announcer
    await expect(page.getByText("Server error")).toBeVisible();
  });

  test("should show duplicate email message", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "contactFormDuplicate");
    await page.goto("/actions");

    await page.getByLabel("Name").fill("John Doe");
    await page.getByLabel("Email").fill("existing@example.com");
    await page.getByLabel("Message").fill("Hello!");

    await page.getByRole("button", { name: "Send Message" }).click();

    // Use locator with text to avoid Next.js route announcer
    await expect(page.getByText("Email already registered")).toBeVisible();
  });

  test("should show VIP acknowledgment for VIP email domains", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "contactFormVip");
    await page.goto("/actions");

    await page.getByLabel("Name").fill("VIP User");
    await page.getByLabel("Email").fill("user@vip.example.com");
    await page.getByLabel("Message").fill("Priority request");

    await page.getByRole("button", { name: "Send Message" }).click();

    await expect(page.getByRole("status")).toContainText("Priority response");
  });
});
