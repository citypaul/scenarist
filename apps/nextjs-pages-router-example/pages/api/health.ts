/**
 * Health Check API Route
 *
 * Simple health check endpoint that returns 200 OK.
 * Used by production tests to verify app is running.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

type HealthResponse = {
  readonly status: 'ok';
};

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  return res.status(200).json({ status: 'ok' });
}
