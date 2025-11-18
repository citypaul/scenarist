/**
 * User API Route - Abstracts database/external service access
 *
 * In a real application, this would query a database OR call an external service.
 * For this demonstration, we call an external "database API" that Scenarist intercepts.
 *
 * This abstraction allows testing Server Components that need user data
 * without requiring a real database.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Forward test ID header for scenario isolation
  const testId = request.headers.get('x-test-id');
  const headers = testId ? { 'x-test-id': testId } : {};

  // Call external "database API" (Scenarist intercepts this)
  const response = await fetch(`http://localhost:3001/api/user/${params.id}`, {
    headers,
  });

  return NextResponse.json(await response.json());
}
