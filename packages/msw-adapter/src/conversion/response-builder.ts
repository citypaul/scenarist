import { HttpResponse, delay } from 'msw';
import type { MockDefinition } from '@scenarist/core';

export const buildResponse = async (
  mock: MockDefinition
): Promise<Response> => {
  if (mock.response.delay) {
    await delay(mock.response.delay);
  }

  return HttpResponse.json(mock.response.body as never, {
    status: mock.response.status,
    headers: mock.response.headers,
  });
};
