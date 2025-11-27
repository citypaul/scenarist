/**
 * GitHub Jobs API Route - Phase 2 Sequence Demo
 *
 * Proxies requests to json-server (localhost:3001) where MSW intercepts them.
 * Demonstrates GitHub polling sequence (repeat: 'last').
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/pages";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  // Security: Encode path parameter to prevent path traversal
  // @see https://github.com/citypaul/scenarist/security/code-scanning/79
  const encodedId = encodeURIComponent(Array.isArray(id) ? id[0] : id ?? '');

  // Proxy to json-server (MSW will intercept on server-side)
  const response = await fetch(`http://localhost:3001/github/jobs/${encodedId}`, {
    headers: {
      ...getScenaristHeaders(req), // ✅ Pass test ID to MSW
    },
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}
