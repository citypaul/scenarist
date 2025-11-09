/**
 * Weather API Route - Phase 8.5 Sequences Demo
 *
 * Proxies weather requests to json-server (localhost:3001)
 * where MSW intercepts them.
 *
 * Demonstrates repeat: 'cycle' - sequence cycles through states
 * (Sunny → Cloudy → Rainy → back to Sunny) infinitely.
 */

import { NextResponse } from 'next/server';
import { scenarist } from '../../../../lib/scenarist';

type WeatherResponse = {
  readonly city: string;
  readonly conditions: string;
  readonly temp: number;
};

export async function GET(request: Request) {
  try {
    // Proxy to json-server (MSW will intercept on server-side)
    const response = await fetch('http://localhost:3001/weather/London', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...scenarist.getHeaders(request), // ✅ Pass test ID to MSW
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data: WeatherResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get weather',
      },
      { status: 500 }
    );
  }
}
