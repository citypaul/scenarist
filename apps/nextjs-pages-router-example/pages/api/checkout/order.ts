/**
 * Checkout Order API Route - Phase 4 Composition Demo
 *
 * Proxies order placement requests to json-server (localhost:3001)
 * where MSW intercepts them.
 *
 * Demonstrates stateful mocks - the response includes the shipping
 * address that was captured during the shipping calculation step.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/pages";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Proxy to json-server (MSW will intercept on server-side)
  const response = await fetch("http://localhost:3001/checkout/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getScenaristHeaders(req), // ✅ Pass test ID to MSW
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}
