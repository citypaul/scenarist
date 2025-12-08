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

  const data = (await response.json()) as { success?: boolean; message?: string; error?: string };

  if (!response.ok) {
    return { success: false, message: data.error ?? "Submission failed" };
  }

  return { success: true, message: data.message ?? "Message sent!" };
}
