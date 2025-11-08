/**
 * GitHub Job Polling API Route - Phase 8.5 Sequences Demo
 *
 * Proxies job status requests to json-server (localhost:3001)
 * where MSW intercepts them.
 *
 * Demonstrates repeat: 'last' - sequence progresses through states
 * (pending → processing → complete) then repeats the last response.
 */

import { NextResponse } from 'next/server';
import { getScenaristHeaders } from '@scenarist/nextjs-adapter/app';
import { scenarist } from '../../../../lib/scenarist';

type JobStatusResponse = {
  readonly jobId: string;
  readonly status: string;
  readonly progress: number;
};

export async function GET(request: Request) {
  try {
    // Proxy to json-server (MSW will intercept on server-side)
    const response = await fetch('http://localhost:3001/github/jobs/123', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getScenaristHeaders(request, scenarist), // ✅ Pass test ID to MSW
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data: JobStatusResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to check job status',
      },
      { status: 500 }
    );
  }
}
