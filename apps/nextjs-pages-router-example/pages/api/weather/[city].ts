/**
 * Weather API Route - Phase 2 Sequence Demo
 *
 * Proxies requests to json-server (localhost:3001) where MSW intercepts them.
 * Demonstrates weather cycle sequence (repeat: 'cycle').
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/pages";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { city } = req.query;

  // Security: Encode path parameter to prevent path traversal
  // @see https://github.com/citypaul/scenarist/security/code-scanning/80
  const encodedCity = encodeURIComponent(Array.isArray(city) ? city[0] : city ?? '');

  // Proxy to json-server (MSW will intercept on server-side)
  const response = await fetch(`http://localhost:3001/weather/${encodedCity}`, {
    headers: {
      ...getScenaristHeaders(req), // ✅ Pass test ID to MSW
    },
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}
