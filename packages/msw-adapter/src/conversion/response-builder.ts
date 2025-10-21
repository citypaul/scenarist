import { HttpResponse, delay } from 'msw';
import type { MockDefinition } from '@scenarist/core';

export const buildResponse = async (
  mock: MockDefinition
): Promise<Response> => {
  if (mock.response.delay) {
    await delay(mock.response.delay);
  }

  // Type assertion required: MSW's HttpResponse.json() expects JsonBodyType,
  // but MockDefinition.response.body is typed as 'unknown' to maintain
  // framework-agnostic serialization in core package. The body is guaranteed
  // to be JSON-serializable by MockDefinition design contract. We do not
  // perform runtime validation for performance reasons (garbage in, garbage out).
  return HttpResponse.json(mock.response.body as never, {
    status: mock.response.status,
    headers: mock.response.headers,
  });
};
