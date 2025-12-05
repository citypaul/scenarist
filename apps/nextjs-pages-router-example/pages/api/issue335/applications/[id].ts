/**
 * Issue #335 Test API Route
 *
 * Fetches application status from external API (json-server).
 * Used to verify that switching to a scenario with a simple response
 * overrides the default scenario's sequence mock.
 *
 * @see https://github.com/citypaul/scenarist/issues/335
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getScenaristHeaders } from "@scenarist/nextjs-adapter/pages";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;

  const encodedId = encodeURIComponent(Array.isArray(id) ? id[0] : (id ?? ""));

  const response = await fetch(
    `http://localhost:3001/issue335/applications/${encodedId}`,
    {
      headers: {
        ...getScenaristHeaders(req),
      },
    },
  );

  const data = await response.json();
  return res.status(response.status).json(data);
}
