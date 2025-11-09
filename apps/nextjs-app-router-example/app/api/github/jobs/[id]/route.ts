/**
 * GitHub Job Status API Route Handler
 *
 * Fetches job status from external API (json-server).
 * Demonstrates Scenarist sequences - each request advances the sequence.
 *
 * Sequence: pending → processing → complete → complete (repeat: 'last')
 */

import { NextRequest, NextResponse } from 'next/server';
import { scenarist } from '../../../../../lib/scenarist';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Fetch from json-server (external API)
    // Scenarist MSW will intercept this request and return sequenced responses
    const response = await fetch(`http://localhost:3001/github/jobs/${id}`, {
      headers: {
        ...scenarist.getHeaders(request),
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch job status',
      },
      { status: 500 }
    );
  }
}
