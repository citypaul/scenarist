/**
 * Checkout Shipping API Route - Phase 4 Composition Demo
 *
 * Proxies shipping calculation requests to json-server (localhost:3001)
 * where MSW intercepts them.
 *
 * Demonstrates request matching on country field to return different
 * shipping costs while simultaneously capturing address via state.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { scenarist } from "../../../lib/scenarist";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Proxy to json-server (MSW will intercept on server-side)
  const response = await fetch("http://localhost:3001/checkout/shipping", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...scenarist.getHeaders(req), // ✅ Pass test ID to MSW
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}
