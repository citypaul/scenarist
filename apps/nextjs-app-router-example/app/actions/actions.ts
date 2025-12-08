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
