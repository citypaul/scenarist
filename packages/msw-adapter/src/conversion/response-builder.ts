import { HttpResponse } from 'msw';
import type { MockDefinition } from '@scenarist/core';

export const buildResponse = async (
  mock: MockDefinition
): Promise<Response> => {
  return HttpResponse.json(null, {
    status: mock.response.status,
  });
};
