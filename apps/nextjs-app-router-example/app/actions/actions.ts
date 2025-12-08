/**
 * Server Action - Contact Form Submission
 *
 * Demonstrates Scenarist integration with Next.js Server Actions.
 *
 * Key Pattern: Header Forwarding for Test Isolation
 * ------------------------------------------------
 * Server Actions run on the server and make their own fetch requests.
 * For Scenarist to route these requests to the correct test scenario,
 * we must forward the x-scenarist-test-id header from the original request.
 *
 * Without header forwarding:
 * - All concurrent tests would share the same mock responses
 * - Test isolation would break, causing flaky tests
 *
 * With header forwarding (getScenaristHeadersFromReadonlyHeaders):
 * - Each test's requests are routed to its specific scenario
 * - Concurrent tests can run with different scenarios safely
 *
 * Production: Headers are empty, no overhead
 * Testing: Headers contain test ID for scenario routing
 */
"use server";

import { headers } from "next/headers";
import { getScenaristHeadersFromReadonlyHeaders } from "@scenarist/nextjs-adapter/app";

type FormState = {
  readonly success: boolean;
  readonly message: string;
} | null;

export async function submitContactForm(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const headersList = await headers();

  const response = await fetch("http://localhost:3001/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Forward Scenarist headers for test isolation
      // Each test gets its own scenario based on x-scenarist-test-id
      ...getScenaristHeadersFromReadonlyHeaders(headersList),
    },
    body: JSON.stringify({
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
    }),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const errorMessage =
      data !== null &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Submission failed";
    return { success: false, message: errorMessage };
  }

  const successMessage =
    data !== null &&
    typeof data === "object" &&
    "message" in data &&
    typeof data.message === "string"
      ? data.message
      : "Message sent!";
  return { success: true, message: successMessage };
}
